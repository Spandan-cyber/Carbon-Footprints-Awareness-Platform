import assert from 'assert';

// Mock localStorage globally before importing state.js dynamically
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};
global.document = {};

async function run() {
  console.log('🧪 Starting StateManager & security XSS sanitization unit tests...');
  
  const { default: stateManager, escapeHTML } = await import('../src/state.js');

  // Test Case 1: XSS HTML-escaping function
  const dirtyHtml = '<script>alert("xss")</script>';
  const cleanHtml = escapeHTML(dirtyHtml);
  assert.strictEqual(cleanHtml, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'XSS script tag should be fully escaped');

  const dirtySpecial = 'a & b > c < d " e \' f';
  const cleanSpecial = escapeHTML(dirtySpecial);
  const expectedSpecial = 'a &amp; b &gt; c &lt; d &quot; e &#039; f';
  assert.strictEqual(cleanSpecial, expectedSpecial, 'Special characters &, <, >, ", \' should be escaped');

  // Test Case 2: StateManager Initialization
  assert.ok(stateManager, 'StateManager instance should exist');
  assert.strictEqual(stateManager.customName, null, 'Initial customName should be null');
  assert.strictEqual(stateManager.customAvatar, null, 'Initial customAvatar should be null');
  assert.deepStrictEqual(stateManager.adoptedHabits, [], 'Initial adopted habits should be empty');

  // Test Case 3: StateManager Updates
  stateManager.inputs.carKm = '15000';
  stateManager.inputs.carType = 'carGasoline';
  stateManager.saveLocal();

  // Test loading from simulated local storage
  stateManager.loadLocal();
  assert.strictEqual(stateManager.inputs.carKm, '15000', 'Updated carKm should persist in loadLocal');

  // Test adopting habits and calculations
  stateManager.adoptedHabits = ['bike_short_trips'];
  const stats = stateManager.getStats();
  // bike_short_trips saves 0.35 tonnes
  assert.strictEqual(stats.savings.total, 0.35, 'Savings total should equal bike_short_trips savings');
  assert.strictEqual(stats.savings.xp, 50, 'Savings XP should equal bike_short_trips XP reward');
  assert.ok(stats.netTotal < stats.baseline.total, 'Net total should be less than baseline total');

  // Test adding chat logs
  const initialLogsCount = stateManager.chatLogs.length;
  stateManager.addChatMessage('user', 'Hello', 'Is this testing working?');
  assert.strictEqual(stateManager.chatLogs.length, initialLogsCount + 1, 'Chat logs count should increase by 1');
  const lastLog = stateManager.chatLogs[stateManager.chatLogs.length - 1];
  assert.strictEqual(lastLog.sender, 'user', 'Last log sender should match');
  assert.strictEqual(lastLog.title, 'Hello', 'Last log title should match');
  assert.strictEqual(lastLog.text, 'Is this testing working?', 'Last log text should match');

  // Test Reset
  stateManager.reset();
  assert.strictEqual(stateManager.inputs.carKm, '8000', 'Reset should restore default carKm value');
  assert.deepStrictEqual(stateManager.adoptedHabits, [], 'Reset should clear adopted habits');
  assert.strictEqual(stateManager.customName, null, 'Reset should clear custom name');
  assert.strictEqual(stateManager.customAvatar, null, 'Reset should clear custom avatar');

  console.log('✅ StateManager & security XSS sanitization unit tests passed successfully!');
}

run().catch((error) => {
  console.error('❌ StateManager & security XSS sanitization unit tests failed!');
  console.error(error);
  process.exit(1);
});
