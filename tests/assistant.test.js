import assert from 'assert';
import { analyzeUserContext, getAssistantResponse } from '../src/assistant.js';

console.log('🧪 Starting Gaia assistant & context coach unit tests...');

try {
  // Test Case 1: Context Analysis - Highest Sector Identification
  // High transport footprint
  const footprintTransport = {
    sectors: {
      transport: 5.5,
      energy: 2.0,
      food: 1.5,
      consumption: 1.0,
      waste: 0.5
    },
    total: 10.5
  };

  const analysisTransport = analyzeUserContext(footprintTransport, []);
  assert.strictEqual(analysisTransport.alertClass, 'neutral', 'Total footprint = 10.5 should return neutral alertClass');
  assert.strictEqual(analysisTransport.insights[0].type, 'transport', 'Primary insight should highlight transport');
  assert.ok(analysisTransport.insights.length > 0, 'Should return active insights');

  // Low footprint eco scenario
  const footprintEco = {
    sectors: {
      transport: 0.1,
      energy: 0.2,
      food: 0.5,
      consumption: 0.3,
      waste: 0.1
    },
    total: 1.2
  };

  const analysisEco = analyzeUserContext(footprintEco, ['bike_short_trips']);
  assert.strictEqual(analysisEco.alertClass, 'emerald', 'Total footprint < 2.0 should return emerald alertClass');
  assert.ok(analysisEco.statusText.includes('Excellent'), 'Status text should praise the low footprint');

  // Test Case 2: Assistant Keyword Response Matching
  // Test 'transport' query
  const resTransport = getAssistantResponse('How can I reduce transport emissions?', footprintTransport);
  assert.strictEqual(resTransport.title, 'Optimizing Transportation', 'Should match transport topic title');
  assert.ok(resTransport.text.includes('Transit'), 'Should contain transit suggestions');

  // Test 'diet' query (should map to food)
  const resDiet = getAssistantResponse('What diet changes help?', footprintTransport);
  assert.strictEqual(resDiet.title, 'Sustainable Eating', 'Diet query should resolve to Food/Eating topic');

  // Test greeting matching
  const resGreeting = getAssistantResponse('Hello, who are you?', footprintTransport);
  assert.strictEqual(resGreeting.title, 'Welcome Back!', 'Greeting query should return Welcome Back!');

  // Test default fallback
  const resFallback = getAssistantResponse('xyzabc', footprintTransport);
  assert.strictEqual(resFallback.title, 'Custom Advice', 'Fallback query should return Custom Advice');

  console.log('✅ Gaia assistant & context coach unit tests passed successfully!');

} catch (error) {
  console.error('❌ Gaia assistant & context coach unit tests failed!');
  console.error(error);
  process.exit(1);
}
