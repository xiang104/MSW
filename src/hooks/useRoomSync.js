import { useCallback, useEffect, useRef } from 'react';
import { get, off, onValue, ref, set, update } from 'firebase/database';
import { getDb, isFirebaseConfigured } from '../firebase';
import { addRoomToHistory } from '../utils/roomHistory';
import { cleanupExpiredRooms } from '../utils/roomCleanup';
import {
  buildRoomPayload,
  generateRoomCode,
  normalizeRoomCode,
  parseRoomData,
} from '../utils/roomSync';

const ROOM_SESSION_KEY = 'maple-split-room-code';

export function getSavedRoomCode() {
  return sessionStorage.getItem(ROOM_SESSION_KEY);
}

export function saveRoomCode(roomCode) {
  if (roomCode) {
    sessionStorage.setItem(ROOM_SESSION_KEY, roomCode);
  } else {
    sessionStorage.removeItem(ROOM_SESSION_KEY);
  }
}

export function useRoomSync({
  enabled,
  roomCode,
  roomState,
  onRoomCodeChange,
  onRemoteUpdate,
  onHistoryChange,
  onError,
}) {
  const isRemoteUpdate = useRef(false);
  const pushTimer = useRef(null);
  const lastPushed = useRef('');

  useEffect(() => {
    if (!enabled || !roomCode) {
      return undefined;
    }

    const db = getDb();
    if (!db) {
      onError?.('Firebase 尚未設定，請填入環境變數後重新啟動。');
      return undefined;
    }

    const roomRef = ref(db, `rooms/${roomCode}`);
    const handleValue = (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const parsed = parseRoomData(data);
      if (!parsed) return;

      isRemoteUpdate.current = true;
      onRemoteUpdate(parsed);
      lastPushed.current = JSON.stringify(buildRoomPayload(parsed));

      queueMicrotask(() => {
        isRemoteUpdate.current = false;
      });
    };

    onValue(roomRef, handleValue, (error) => {
      onError?.(error.message || '房間連線失敗');
    });

    return () => off(roomRef);
  }, [enabled, roomCode, onRemoteUpdate, onError]);

  useEffect(() => {
    if (!enabled || !roomCode || isRemoteUpdate.current) {
      return undefined;
    }

    const db = getDb();
    if (!db) return undefined;

    const payload = buildRoomPayload(roomState);
    const serialized = JSON.stringify(payload);
    if (serialized === lastPushed.current) {
      return undefined;
    }

    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (isRemoteUpdate.current) return;

      lastPushed.current = serialized;
      update(ref(db, `rooms/${roomCode}`), payload).catch((error) => {
        onError?.(error.message || '同步資料失敗');
      });
    }, 300);

    return () => clearTimeout(pushTimer.current);
  }, [enabled, roomCode, roomState, onError]);

  const createRoom = useCallback(
    async (roomName = '') => {
      if (!isFirebaseConfigured()) {
        throw new Error('請先設定 Firebase 環境變數（.env）後重新啟動應用程式。');
      }

      await cleanupExpiredRooms();

      const db = getDb();
      const code = generateRoomCode();
      const payload = buildRoomPayload({
        ...roomState,
        roomName: roomName.trim(),
        createdAt: Date.now(),
      });

      await set(ref(db, `rooms/${code}`), payload);
      lastPushed.current = JSON.stringify(payload);
      saveRoomCode(code);
      addRoomToHistory(code, roomName.trim() || code);
      onHistoryChange?.();
      onRoomCodeChange(code);
      return code;
    },
    [roomState, onRoomCodeChange, onHistoryChange]
  );

  const joinRoom = useCallback(
    async (rawCode) => {
      if (!isFirebaseConfigured()) {
        throw new Error('請先設定 Firebase 環境變數（.env）後重新啟動應用程式。');
      }

      const code = normalizeRoomCode(rawCode);
      if (!code) {
        throw new Error('房號格式不正確，請輸入 6 位數房號（例如 M-123456）。');
      }

      const db = getDb();
      const roomRef = ref(db, `rooms/${code}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        throw new Error('找不到此房間，請確認房號是否正確。');
      }

      const parsed = parseRoomData(snapshot.val());
      if (!parsed) {
        throw new Error('房間資料格式錯誤，無法加入。');
      }

      isRemoteUpdate.current = true;
      onRemoteUpdate(parsed);
      lastPushed.current = JSON.stringify(buildRoomPayload(parsed));
      queueMicrotask(() => {
        isRemoteUpdate.current = false;
      });

      saveRoomCode(code);
      addRoomToHistory(code, parsed.roomName || code);
      onHistoryChange?.();
      onRoomCodeChange(code);
      return code;
    },
    [onRemoteUpdate, onRoomCodeChange, onHistoryChange]
  );

  const leaveRoom = useCallback(() => {
    clearTimeout(pushTimer.current);
    lastPushed.current = '';
    saveRoomCode(null);
    onRoomCodeChange(null);
  }, [onRoomCodeChange]);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    isFirebaseConfigured: isFirebaseConfigured(),
  };
}
