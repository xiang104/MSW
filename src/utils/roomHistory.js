const HISTORY_KEY = 'maple-split-room-history';
const MAX_HISTORY = 8;

export function getRoomHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRoomToHistory(roomCode, roomName = '') {
  if (!roomCode) return getRoomHistory();

  const trimmedName = String(roomName || '').trim();
  const nextEntry = {
    code: roomCode,
    name: trimmedName || roomCode,
    joinedAt: Date.now(),
  };

  const filtered = getRoomHistory().filter((item) => item.code !== roomCode);
  const nextHistory = [nextEntry, ...filtered].slice(0, MAX_HISTORY);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function removeRoomFromHistory(roomCode) {
  const nextHistory = getRoomHistory().filter((item) => item.code !== roomCode);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}
