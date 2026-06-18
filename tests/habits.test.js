import assert from 'assert';
import { calculateSavings, getLevelInfo, HABITS } from '../src/habits.js';

console.log('🧪 Starting habits & user levels unit tests...');

try {
  // Test Case 1: Empty adopted habits
  const emptySavings = calculateSavings([]);
  assert.strictEqual(emptySavings.total, 0, 'Empty habits should yield 0 total savings');
  assert.strictEqual(emptySavings.xp, 0, 'Empty habits should yield 0 XP');
  assert.strictEqual(emptySavings.sectors.transport, 0, 'Empty habits should have 0 transport savings');
  assert.strictEqual(emptySavings.sectors.energy, 0, 'Empty habits should have 0 energy savings');
  assert.strictEqual(emptySavings.sectors.food, 0, 'Empty habits should have 0 food savings');

  // Test Case 2: Standard adopted habits (bike_short_trips and led_bulbs)
  const habitsToAdopt = ['bike_short_trips', 'led_bulbs'];
  const expectedSavings = 0.35 + 0.12; // bike_short_trips: 0.35, led_bulbs: 0.12
  const expectedXp = 50 + 40; // bike_short_trips: 50, led_bulbs: 40

  const activeSavings = calculateSavings(habitsToAdopt);
  assert.strictEqual(activeSavings.total, expectedSavings, `Total savings should be ${expectedSavings}`);
  assert.strictEqual(activeSavings.xp, expectedXp, `Total XP should be ${expectedXp}`);
  assert.strictEqual(activeSavings.sectors.transport, 0.35, 'Transport sector savings should be 0.35');
  assert.strictEqual(activeSavings.sectors.energy, 0.12, 'Energy sector savings should be 0.12');
  assert.strictEqual(activeSavings.sectors.food, 0, 'Food sector savings should be 0');

  // Test Case 3: Level progression titles and metrics
  // Level 1: 0-99 XP
  const lvl1 = getLevelInfo(0);
  assert.strictEqual(lvl1.level, 1, '0 XP should map to Level 1');
  assert.strictEqual(lvl1.title, 'Eco Recruit', 'Level 1 title should be Eco Recruit');
  assert.strictEqual(lvl1.progressPercent, 0, '0 XP progress should be 0%');

  // Level 2: 100-199 XP
  const lvl2 = getLevelInfo(120);
  assert.strictEqual(lvl2.level, 2, '120 XP should map to Level 2');
  assert.strictEqual(lvl2.title, 'Eco Recruit', 'Level 2 title should be Eco Recruit');
  assert.strictEqual(lvl2.xpInCurrentLevel, 20, '120 XP should leave 20 XP in current level');
  assert.strictEqual(lvl2.progressPercent, 20, '120 XP progress should be 20%');

  // Level 3: 200-299 XP
  const lvl3 = getLevelInfo(250);
  assert.strictEqual(lvl3.level, 3, '250 XP should map to Level 3');
  assert.strictEqual(lvl3.title, 'Green Guard', 'Level 3 title should be Green Guard');

  // Level 6: 500-599 XP
  const lvl6 = getLevelInfo(550);
  assert.strictEqual(lvl6.level, 6, '550 XP should map to Level 6');
  assert.strictEqual(lvl6.title, 'Carbon Crusader', 'Level 6 title should be Carbon Crusader');

  // Level 10: 900+ XP
  const lvl10 = getLevelInfo(900);
  assert.strictEqual(lvl10.level, 10, '900 XP should map to Level 10');
  assert.strictEqual(lvl10.title, 'Gaia Guardian', 'Level 10 title should be Gaia Guardian');

  // Level 15: 1400+ XP
  const lvl15 = getLevelInfo(1400);
  assert.strictEqual(lvl15.level, 15, '1400 XP should map to Level 15');
  assert.strictEqual(lvl15.title, 'Sustainability Sage', 'Level 15 title should be Sustainability Sage');

  console.log('✅ Habits and user levels unit tests passed successfully!');

} catch (error) {
  console.error('❌ Habits and user levels unit tests failed!');
  console.error(error);
  process.exit(1);
}
