import { useCallback, useEffect, useMemo, useState } from 'react';
import PlayerCard from './components/PlayerCard';
import TeamSummary from './components/TeamSummary';
import SettlementList from './components/SettlementList';
import ModeSwitcher from './components/ModeSwitcher';
import RoomPanel from './components/RoomPanel';
import { getSavedRoomCode, useRoomSync } from './hooks/useRoomSync';
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  LOST_ITEM_MODE,
  LOST_ITEM_MODE_OPTIONS,
  DEFAULT_MILEAGE_RATE,
  createPlayers,
  calculateSettlement,
} from './utils/calculator';

export default function App() {
  const [currentMode, setCurrentMode] = useState('local');
  const [roomCode, setRoomCode] = useState(null);
  const [roomError, setRoomError] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState(() => createPlayers(4));
  const [lostItemMode, setLostItemMode] = useState(LOST_ITEM_MODE.SHARED);
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);

  const isRoomMode = currentMode === 'room';
  const isInRoom = isRoomMode && Boolean(roomCode);

  const settlement = useMemo(
    () => calculateSettlement(players, { lostItemMode, isTaxEnabled }),
    [players, lostItemMode, isTaxEnabled]
  );

  const isSelfAbsorbMode = lostItemMode === LOST_ITEM_MODE.SELF_ABSORB;

  const roomState = useMemo(
    () => ({
      playerCount,
      players,
      isTaxEnabled,
      lostItemMode,
    }),
    [playerCount, players, isTaxEnabled, lostItemMode]
  );

  const applyRemoteState = useCallback((remote) => {
    setPlayerCount(remote.playerCount);
    setPlayers(remote.players);
    setIsTaxEnabled(remote.isTaxEnabled);
    setLostItemMode(remote.lostItemMode);
    setRoomError('');
  }, []);

  const handleRoomCodeChange = useCallback((nextRoomCode) => {
    setRoomCode(nextRoomCode);
    if (nextRoomCode) {
      setRoomError('');
    }
  }, []);

  const { createRoom, joinRoom, leaveRoom, isFirebaseConfigured } = useRoomSync({
    enabled: isInRoom,
    roomCode,
    roomState,
    onRoomCodeChange: handleRoomCodeChange,
    onRemoteUpdate: applyRemoteState,
    onError: setRoomError,
  });

  useEffect(() => {
    if (currentMode !== 'room' || roomCode) return undefined;

    const savedCode = getSavedRoomCode();
    if (!savedCode) return undefined;

    let cancelled = false;
    joinRoom(savedCode).catch((error) => {
      if (!cancelled) {
        setRoomError(error.message || '無法重新加入房間');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentMode, roomCode, joinRoom]);

  function handleModeChange(mode) {
    if (mode === currentMode) return;

    if (mode === 'local') {
      leaveRoom();
      setRoomError('');
    }

    setCurrentMode(mode);
  }

  function handlePlayerCountChange(count) {
    const nextCount = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, count));
    setPlayerCount(nextCount);

    setPlayers((prev) => {
      if (nextCount > prev.length) {
        const extra = createPlayers(nextCount).slice(prev.length);
        return [...prev, ...extra];
      }
      return prev.slice(0, nextCount);
    });
  }

  function handlePlayerChange(id, field, value) {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, [field]: value } : player
      )
    );
  }

  function handleClearAll() {
    const confirmed = window.confirm('確定要清除所有資料並重新計算嗎？');
    if (!confirmed) return;

    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        auctionTotal: '',
        scissorsCount: 0,
        mileageRate: DEFAULT_MILEAGE_RATE,
        lostItemValue: 0,
      }))
    );
  }

  async function handleCreateRoom() {
    setRoomError('');
    await createRoom();
  }

  async function handleJoinRoom(code) {
    setRoomError('');
    await joinRoom(code);
  }

  function handleLeaveRoom() {
    leaveRoom();
    setRoomError('');
  }

  return (
    <div className="app">
      <ModeSwitcher currentMode={currentMode} onChange={handleModeChange} />

      {isRoomMode && (
        <RoomPanel
          roomCode={roomCode}
          roomError={roomError}
          isFirebaseConfigured={isFirebaseConfigured}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__badge">MAPLE SPLIT</span>
          <h1>楓星分寶計算機</h1>
          <p>
            {isInRoom
              ? '多人房間模式 · 資料即時同步至雲端'
              : '拍賣場結算 · 白金剪刀代墊 · 多退少補自動計算'}
          </p>
        </div>

        <div className="global-settings">
          <div className="player-count-control">
            <label htmlFor="player-count">玩家人數</label>
            <div className="player-count-control__row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handlePlayerCountChange(playerCount - 1)}
                disabled={playerCount <= MIN_PLAYERS}
                aria-label="減少人數"
              >
                −
              </button>
              <input
                id="player-count"
                type="number"
                min={MIN_PLAYERS}
                max={MAX_PLAYERS}
                value={playerCount}
                onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handlePlayerCountChange(playerCount + 1)}
                disabled={playerCount >= MAX_PLAYERS}
                aria-label="增加人數"
              >
                +
              </button>
            </div>
            <span className="player-count-control__hint">{MIN_PLAYERS} ~ {MAX_PLAYERS} 人</span>
          </div>

          <div className="tax-toggle-control">
            <label className="tax-toggle-control__label" htmlFor="tax-enabled">
              拍賣場手續費
            </label>
            <label className="tax-toggle">
              <input
                id="tax-enabled"
                type="checkbox"
                checked={isTaxEnabled}
                onChange={(e) => setIsTaxEnabled(e.target.checked)}
              />
              <span>計算拍賣場 3% 手續費</span>
            </label>
            <span className="tax-toggle-control__hint">
              {isTaxEnabled ? '結算時將總賣價 × 0.97（無條件捨去）' : '目前以原價結算，不扣手續費'}
            </span>
          </div>

          <div className="lost-item-mode-control">
            <label htmlFor="lost-item-mode">搞丟道具處理模式</label>
            <select
              id="lost-item-mode"
              className="lost-item-mode-control__select"
              value={lostItemMode}
              onChange={(e) => setLostItemMode(e.target.value)}
            >
              {LOST_ITEM_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="lost-item-mode-control__hint">
              {isSelfAbsorbMode
                ? '搞丟者原價賠償，計入團隊淨利（不扣 3% 手續費）'
                : '搞丟道具價值不計入結算，由全隊共同承擔'}
            </span>
          </div>

          <div className="reset-control">
            <span className="reset-control__label">資料管理</span>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleClearAll}
            >
              一鍵清除
            </button>
            <span className="reset-control__hint">清空金額與剪刀，保留人數與模式</span>
          </div>
        </div>
      </header>

      <section className="info-banner">
        <span>{isTaxEnabled ? '拍賣場手續費 3%（已啟用）' : '拍賣場手續費未啟用，以原價結算'}</span>
        {isInRoom && <span>房間 {roomCode} · 變更將即時同步</span>}
        <span>剪刀成本 = (1,000 萬 ÷ 里程匯率) × 7,900</span>
        <span>虛擬持有 = 拍賣收入 + 搞丟道具賠償</span>
        <span>最終目標 = 基本分紅 + 個人代墊成本</span>
      </section>

      <main className="player-grid">
        {players.map((player, index) => {
          const result = settlement.players[index];
          return (
            <PlayerCard
              key={player.id}
              index={index + 1}
              player={player}
              result={result}
              lostItemMode={lostItemMode}
              isTaxEnabled={isTaxEnabled}
              onChange={handlePlayerChange}
            />
          );
        })}
      </main>

      <TeamSummary summary={settlement.summary} />
      <SettlementList players={settlement.players} />
    </div>
  );
}
