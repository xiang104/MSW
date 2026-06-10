import { useState } from 'react';

export default function RoomPanel({
  roomCode,
  roomName,
  roomError,
  isFirebaseConfigured,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) {
  const [joinInput, setJoinInput] = useState('');
  const [createNameInput, setCreateNameInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function handleCreate() {
    setIsBusy(true);
    try {
      await onCreateRoom(createNameInput);
      setCreateNameInput('');
    } catch (error) {
      window.alert(error.message || '建立房間失敗');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleJoin() {
    setIsBusy(true);
    try {
      await onJoinRoom(joinInput);
      setJoinInput('');
    } catch (error) {
      window.alert(error.message || '加入房間失敗');
    } finally {
      setIsBusy(false);
    }
  }

  if (roomCode) {
    return (
      <section className="room-panel room-panel--connected">
        <div className="room-panel__status">
          <span className="room-panel__label">目前位於房間</span>
          {roomName && <strong className="room-panel__name">{roomName}</strong>}
          <strong className="room-panel__code">{roomCode}</strong>
          <span className="room-panel__sync">即時同步中</span>
        </div>
        <button
          type="button"
          className="btn btn--outline"
          onClick={onLeaveRoom}
        >
          離開房間
        </button>
      </section>
    );
  }

  return (
    <section className="room-panel">
      <header className="room-panel__header">
        <h2>多人連線房間</h2>
        <p>建立房間後分享房號，隊友輸入相同房號即可即時同步資料。</p>
      </header>

      {!isFirebaseConfigured && (
        <p className="room-panel__warning">
          Firebase 尚未設定。請在專案根目錄建立 `.env` 並填入 `VITE_FIREBASE_*` 環境變數。
        </p>
      )}

      {roomError && <p className="room-panel__error">{roomError}</p>}

      <div className="room-panel__actions">
        <div className="room-panel__create">
          <input
            className="room-panel__input"
            type="text"
            placeholder="房間名稱（選填），例如 0610 混龍"
            value={createNameInput}
            onChange={(e) => setCreateNameInput(e.target.value)}
            disabled={isBusy || !isFirebaseConfigured}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCreate}
            disabled={isBusy || !isFirebaseConfigured}
          >
            建立房間
          </button>
        </div>

        <div className="room-panel__join">
          <input
            className="room-panel__input"
            type="text"
            placeholder="輸入房號，例如 M-123456"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            disabled={isBusy || !isFirebaseConfigured}
          />
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleJoin}
            disabled={isBusy || !isFirebaseConfigured || !joinInput.trim()}
          >
            加入房間
          </button>
        </div>
      </div>
    </section>
  );
}
