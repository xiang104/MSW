export const AUCTION_FEE_RATE = 0.03;
export const MESOS_PER_MILEAGE_UNIT = 10_000_000;
export const SCISSORS_MILEAGE_COST = 7900;
export const DEFAULT_MILEAGE_RATE = 8000;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const LOST_ITEM_MODE = {
  SELF_ABSORB: 'self_absorb',
  SHARED: 'shared',
};

export const LOST_ITEM_MODE_OPTIONS = [
  { value: LOST_ITEM_MODE.SELF_ABSORB, label: '自行吸收 (原價賠償)' },
  { value: LOST_ITEM_MODE.SHARED, label: '當作沒打到 (共同承擔)' },
];

export function createDefaultPlayer(index) {
  return {
    id: `player-${index}-${Date.now()}`,
    name: `玩家 ${index}`,
    auctionTotal: 0,
    scissorsCount: 0,
    mileageRate: DEFAULT_MILEAGE_RATE,
    lostItemValue: 0,
  };
}

export function createPlayers(count) {
  return Array.from({ length: count }, (_, i) => createDefaultPlayer(i + 1));
}

export function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function formatMesos(value) {
  const rounded = Math.round(value);
  return rounded.toLocaleString('zh-TW');
}

export function calculatePlayerStats(player) {
  const auctionTotal = parseNumber(player.auctionTotal);
  const scissorsCount = parseNumber(player.scissorsCount);
  const mileageRate = Math.max(parseNumber(player.mileageRate), 1);

  const actualAuctionIncome = auctionTotal * (1 - AUCTION_FEE_RATE);
  const scissorsUnitCost = (MESOS_PER_MILEAGE_UNIT / mileageRate) * SCISSORS_MILEAGE_COST;
  const advanceCost = scissorsUnitCost * scissorsCount;

  return {
    actualAuctionIncome,
    scissorsUnitCost,
    advanceCost,
  };
}

export function getEffectiveLostItemValue(player, lostItemMode) {
  if (lostItemMode === LOST_ITEM_MODE.SELF_ABSORB) {
    return parseNumber(player.lostItemValue);
  }
  return 0;
}

export function calculateSettlement(players, options = {}) {
  const lostItemMode = options.lostItemMode ?? LOST_ITEM_MODE.SHARED;

  const playerResults = players.map((player) => {
    const stats = calculatePlayerStats(player);
    const effectiveLostItemValue = getEffectiveLostItemValue(player, lostItemMode);
    const virtualHeldAmount = stats.actualAuctionIncome + effectiveLostItemValue;

    return {
      ...player,
      ...stats,
      effectiveLostItemValue,
      virtualHeldAmount,
    };
  });

  const totalActualAuctionIncome = playerResults.reduce(
    (sum, p) => sum + p.actualAuctionIncome,
    0
  );
  const totalLostItemValue = playerResults.reduce(
    (sum, p) => sum + p.effectiveLostItemValue,
    0
  );
  const totalAdvanceCost = playerResults.reduce((sum, p) => sum + p.advanceCost, 0);
  const teamNetProfit =
    totalActualAuctionIncome + totalLostItemValue - totalAdvanceCost;
  const playerCount = players.length;
  const basicDividend = playerCount > 0 ? teamNetProfit / playerCount : 0;

  const settledPlayers = playerResults.map((player) => {
    const finalTarget = basicDividend + player.advanceCost;
    const adjustment = finalTarget - player.virtualHeldAmount;

    return {
      ...player,
      basicDividend,
      finalTarget,
      adjustment,
      action: adjustment >= 0 ? 'receive' : 'pay',
      actionAmount: Math.abs(adjustment),
    };
  });

  return {
    players: settledPlayers,
    summary: {
      totalActualAuctionIncome,
      totalLostItemValue,
      totalAdvanceCost,
      teamNetProfit,
      basicDividend,
      playerCount,
      lostItemMode,
    },
  };
}
