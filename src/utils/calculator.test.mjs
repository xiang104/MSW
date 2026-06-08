import {

  calculateSettlement,

  calculatePlayerStats,

  formatMesos,

  LOST_ITEM_MODE,

  DEFAULT_MILEAGE_RATE,

} from './calculator.js';



function assertEqual(actual, expected, label) {

  if (Math.abs(actual - expected) > 0.01) {

    throw new Error(`${label}: expected ${expected}, got ${actual}`);

  }

}



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



const stats = calculatePlayerStats(players[0]);

assertEqual(stats.actualAuctionIncome, 97_000_000, 'actualAuctionIncome');

assertEqual(stats.scissorsUnitCost, 9_875_000, 'scissorsUnitCost');

assertEqual(stats.advanceCost, 9_875_000, 'advanceCost');



const settlement = calculateSettlement(players, { lostItemMode: LOST_ITEM_MODE.SHARED });

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



const playersWithLostItem = [

  { ...players[0], lostItemValue: 50_000_000 },

  players[1],

];



const selfAbsorbSettlement = calculateSettlement(playersWithLostItem, {

  lostItemMode: LOST_ITEM_MODE.SELF_ABSORB,

});

assertEqual(selfAbsorbSettlement.summary.totalLostItemValue, 50_000_000, 'self absorb lost total');

assertEqual(

  selfAbsorbSettlement.summary.teamNetProfit,

  214_725_000,

  'self absorb teamNetProfit'

);

assertEqual(selfAbsorbSettlement.players[0].virtualHeldAmount, 147_000_000, 'lost player virtual');

assertEqual(selfAbsorbSettlement.players[0].adjustment, -29_762_500, 'lost player adjustment');



const ignoredLostSettlement = calculateSettlement(playersWithLostItem, {

  lostItemMode: LOST_ITEM_MODE.SHARED,

});

assertEqual(ignoredLostSettlement.summary.totalLostItemValue, 0, 'shared mode ignores lost');

assertEqual(ignoredLostSettlement.players[0].virtualHeldAmount, 97_000_000, 'shared virtual held');



if (formatMesos(100000000) !== '100,000,000') {

  throw new Error('formatMesos failed');

}



console.log('All calculator tests passed.');

console.log('Default mileage rate:', DEFAULT_MILEAGE_RATE);


