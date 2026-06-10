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
    auctionTotal: '',
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

export function calculateTotal(input) {
  if (input === '' || input === null || input === undefined) return 0;

  const sanitized = String(input).replace(/\s/g, '').replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) return 0;
  if (/[+\-*/]$/.test(sanitized)) return 0;
  if (/^[+*/]/.test(sanitized)) return 0;

  try {
    const value = evaluateExpression(sanitized);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function evaluateExpression(expr) {
  const tokens = [];
  let index = 0;

  while (index < expr.length) {
    const char = expr[index];
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push(char);
      index += 1;
      continue;
    }

    const start = index;
    while (index < expr.length && /[\d.]/.test(expr[index])) {
      index += 1;
    }

    if (index === start) return 0;

    const number = Number(expr.slice(start, index));
    if (!Number.isFinite(number)) return 0;
    tokens.push(number);
  }

  if (tokens.length === 0) return 0;
  if (typeof tokens[0] !== 'number') return 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const shouldBeNumber = i % 2 === 0;
    if (shouldBeNumber && typeof tokens[i] !== 'number') return 0;
    if (!shouldBeNumber && typeof tokens[i] !== 'string') return 0;
  }

  const addTokens = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const rhs = tokens[i + 1];
    if (typeof rhs !== 'number') return 0;

    if (operator === '*' || operator === '/') {
      const lhs = addTokens.pop();
      addTokens.push(operator === '*' ? lhs * rhs : rhs === 0 ? 0 : lhs / rhs);
    } else {
      addTokens.push(operator, rhs);
    }
  }

  let result = addTokens[0];
  for (let i = 1; i < addTokens.length; i += 2) {
    const operator = addTokens[i];
    const rhs = addTokens[i + 1];
    result = operator === '+' ? result + rhs : result - rhs;
  }

  return result;
}

export function applyAuctionTax(grossTotal, isTaxEnabled) {
  if (!isTaxEnabled) return grossTotal;
  return Math.floor(grossTotal * (1 - AUCTION_FEE_RATE));
}

export function formatMesos(value) {
  const rounded = Math.round(value);
  return rounded.toLocaleString('zh-TW');
}

export function calculatePlayerStats(player, options = {}) {
  const isTaxEnabled = options.isTaxEnabled ?? false;
  const grossAuctionTotal = calculateTotal(player.auctionTotal);
  const scissorsCount = parseNumber(player.scissorsCount);
  const mileageRate = Math.max(parseNumber(player.mileageRate), 1);

  const actualAuctionIncome = applyAuctionTax(grossAuctionTotal, isTaxEnabled);
  const scissorsUnitCost = (MESOS_PER_MILEAGE_UNIT / mileageRate) * SCISSORS_MILEAGE_COST;
  const advanceCost = scissorsUnitCost * scissorsCount;

  return {
    grossAuctionTotal,
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
  const isTaxEnabled = options.isTaxEnabled ?? false;
  const statsOptions = { isTaxEnabled };

  const playerResults = players.map((player) => {
    const stats = calculatePlayerStats(player, statsOptions);
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
      isTaxEnabled,
    },
  };
}
