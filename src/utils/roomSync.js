import {
  DEFAULT_MILEAGE_RATE,
  LOST_ITEM_MODE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  parseNumber,
} from './calculator';

export function generateRoomCode() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `M-${digits}`;
}

export function normalizeRoomCode(input) {
  const trimmed = String(input).trim().toUpperCase();
  if (/^M-\d{6}$/.test(trimmed)) return trimmed;
  if (/^\d{6}$/.test(trimmed)) return `M-${trimmed}`;
  return null;
}

export function buildRoomPayload({ playerCount, players, isTaxEnabled, lostItemMode }) {
  return {
    isTaxEnabled: Boolean(isTaxEnabled),
    lostItemMode,
    playerCount,
    players: players.map((player, index) => ({
      id: player.id || `player-${index + 1}`,
      name: player.name ?? `玩家 ${index + 1}`,
      sellPrice: player.auctionTotal ?? '',
      scissorsCount: parseNumber(player.scissorsCount),
      mileageRate: Math.max(parseNumber(player.mileageRate), 1) || DEFAULT_MILEAGE_RATE,
      lostItemValue: parseNumber(player.lostItemValue),
    })),
    updatedAt: Date.now(),
  };
}

export function parseRoomData(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const playerCount = Math.min(
    MAX_PLAYERS,
    Math.max(MIN_PLAYERS, parseNumber(data.playerCount) || MIN_PLAYERS)
  );
  const sourcePlayers = Array.isArray(data.players) ? data.players : [];

  const players = Array.from({ length: playerCount }, (_, index) => {
    const remote = sourcePlayers[index] || {};
    return {
      id: remote.id || `player-${index + 1}`,
      name: remote.name ?? `玩家 ${index + 1}`,
      auctionTotal: remote.sellPrice ?? '',
      scissorsCount: remote.scissorsCount ?? 0,
      mileageRate: remote.mileageRate ?? DEFAULT_MILEAGE_RATE,
      lostItemValue: remote.lostItemValue ?? 0,
    };
  });

  return {
    playerCount,
    players,
    isTaxEnabled: Boolean(data.isTaxEnabled),
    lostItemMode:
      data.lostItemMode === LOST_ITEM_MODE.SELF_ABSORB
        ? LOST_ITEM_MODE.SELF_ABSORB
        : LOST_ITEM_MODE.SHARED,
  };
}
