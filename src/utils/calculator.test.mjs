import {
  calculateSettlement,
  calculatePlayerStats,
  calculateTotal,
  applyAuctionTax,
  formatMesos,
  LOST_ITEM_MODE,
  DEFAULT_MILEAGE_RATE,
} from './calculator.js';

function assertEqual(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

assertEqual(calculateTotal('5000+12000+3000'), 20000, 'calculateTotal sum');
assertEqual(calculateTotal('100000000'), 100000000, 'calculateTotal plain number');
assertEqual(calculateTotal('5000+12000+'), 0, 'calculateTotal incomplete');
assertEqual(calculateTotal('abc'), 0, 'calculateTotal invalid chars');
assertEqual(calculateTotal('10*5+20'), 70, 'calculateTotal precedence');
assertEqual(applyAuctionTax(100_000_000, true), 97_000_000, 'applyAuctionTax enabled');
assertEqual(applyAuctionTax(100_000_003, true), 97_000_002, 'applyAuctionTax floor');
assertEqual(applyAuctionTax(100_000_000, false), 100_000_000, 'applyAuctionTax disabled');

const players = [
  {
    id: '1',
    name: 'A',
    auctionTotal: 100_000_000,
    scissorsCount: 1,
    mileageRate: 8000,
    lostItemValue: 0,
  },
  {
    id: '2',
    name: 'B',
    auctionTotal: 80_000_000,
    scissorsCount: 0,
    mileageRate: 8000,
    lostItemValue: 0,
  },
];

const statsWithTax = calculatePlayerStats(players[0], { isTaxEnabled: true });
assertEqual(statsWithTax.actualAuctionIncome, 97_000_000, 'actualAuctionIncome with tax');
assertEqual(statsWithTax.scissorsUnitCost, 9_875_000, 'scissorsUnitCost');
assertEqual(statsWithTax.advanceCost, 9_875_000, 'advanceCost');

const statsWithoutTax = calculatePlayerStats(players[0], { isTaxEnabled: false });
assertEqual(statsWithoutTax.actualAuctionIncome, 100_000_000, 'actualAuctionIncome without tax');

const expressionStats = calculatePlayerStats(
  { ...players[0], auctionTotal: '50000000+50000000' },
  { isTaxEnabled: true }
);
assertEqual(expressionStats.grossAuctionTotal, 100_000_000, 'expression gross total');
assertEqual(expressionStats.actualAuctionIncome, 97_000_000, 'expression actual income');

const settlement = calculateSettlement(players, {
  lostItemMode: LOST_ITEM_MODE.SHARED,
  isTaxEnabled: true,
});
assertEqual(settlement.summary.totalActualAuctionIncome, 174_600_000, 'totalActualAuctionIncome');
assertEqual(settlement.summary.totalLostItemValue, 0, 'totalLostItemValue (shared mode)');
assertEqual(settlement.summary.totalAdvanceCost, 9_875_000, 'totalAdvanceCost');
assertEqual(settlement.summary.teamNetProfit, 164_725_000, 'teamNetProfit');
assertEqual(settlement.summary.basicDividend, 82_362_500, 'basicDividend');

const playerA = settlement.players[0];
assertEqual(playerA.virtualHeldAmount, 97_000_000, 'playerA virtualHeldAmount');
assertEqual(playerA.finalTarget, 92_237_500, 'playerA finalTarget');
assertEqual(playerA.adjustment, -4_762_500, 'playerA adjustment');
assertEqual(playerA.action, 'pay', 'playerA action');

const settlementNoTax = calculateSettlement(players, {
  lostItemMode: LOST_ITEM_MODE.SHARED,
  isTaxEnabled: false,
});
assertEqual(settlementNoTax.summary.totalActualAuctionIncome, 180_000_000, 'no tax total income');

const playersWithLostItem = [
  { ...players[0], lostItemValue: 50_000_000 },
  players[1],
];

const selfAbsorbSettlement = calculateSettlement(playersWithLostItem, {
  lostItemMode: LOST_ITEM_MODE.SELF_ABSORB,
  isTaxEnabled: true,
});
assertEqual(selfAbsorbSettlement.summary.totalLostItemValue, 50_000_000, 'self absorb lost total');
assertEqual(selfAbsorbSettlement.summary.teamNetProfit, 214_725_000, 'self absorb teamNetProfit');
assertEqual(selfAbsorbSettlement.players[0].virtualHeldAmount, 147_000_000, 'lost player virtual');
assertEqual(selfAbsorbSettlement.players[0].adjustment, -29_762_500, 'lost player adjustment');

const ignoredLostSettlement = calculateSettlement(playersWithLostItem, {
  lostItemMode: LOST_ITEM_MODE.SHARED,
  isTaxEnabled: true,
});
assertEqual(ignoredLostSettlement.summary.totalLostItemValue, 0, 'shared mode ignores lost');
assertEqual(ignoredLostSettlement.players[0].virtualHeldAmount, 97_000_000, 'shared virtual held');

if (formatMesos(100000000) !== '100,000,000') {
  throw new Error('formatMesos failed');
}

console.log('All calculator tests passed.');
console.log('Default mileage rate:', DEFAULT_MILEAGE_RATE);
