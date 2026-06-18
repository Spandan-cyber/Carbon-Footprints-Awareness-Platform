import assert from 'assert';
import { calculateFootprint } from '../src/calculator.js';

console.log('🧪 Starting carbon calculator unit tests...');

try {
  // Test case 1: Standard high-emission commuter
  const highInputs = {
    carKm: '25000',
    carType: 'carGasoline',
    publicTransitKm: '0',
    transitType: 'bus',
    shortFlights: '6',
    longFlights: '2',
    householdSize: '1',
    electricityKwh: '800',
    greenElectricityShare: '0',
    heatingKwh: '15000',
    heatingSource: 'heatingOil',
    dietType: 'meatHeavy',
    localFoodShare: '0',
    consumptionStyle: 'shopper',
    wasteManagement: 'highWaste'
  };

  const highResult = calculateFootprint(highInputs);
  console.log('✅ Calculated high emission scenario:');
  console.log(`   - Total: ${highResult.total} t CO2e`);
  console.log(`   - Sectors:`, highResult.sectors);

  // Assertions for high emissions
  assert.ok(highResult.total > 15, 'High emission scenario should be > 15 tonnes');
  assert.strictEqual(highResult.sectors.food, 2.9, 'Food sector should match heavy meat factor');
  assert.strictEqual(highResult.sectors.waste, 0.9, 'Waste sector should match high waste factor');

  // Test case 2: Low-emission eco-warrior
  const ecoInputs = {
    carKm: '0',
    carType: 'carElectric',
    publicTransitKm: '5000',
    transitType: 'train',
    shortFlights: '0',
    longFlights: '0',
    householdSize: '4',
    electricityKwh: '150',
    greenElectricityShare: '100', // 100% solar/wind
    heatingKwh: '3000',
    heatingSource: 'geothermal', // geothermal heat pump
    dietType: 'vegan',
    localFoodShare: '80', // 80% local
    consumptionStyle: 'minimalist',
    wasteManagement: 'lowWaste'
  };

  const ecoResult = calculateFootprint(ecoInputs);
  console.log('✅ Calculated eco-warrior scenario:');
  console.log(`   - Total: ${ecoResult.total} t CO2e`);
  console.log(`   - Sectors:`, ecoResult.sectors);

  // Assertions for low emissions
  assert.ok(ecoResult.total < 3, 'Eco-warrior scenario should be < 3 tonnes');
  assert.strictEqual(ecoResult.sectors.transport, 0.15, 'Transport should consist of train only: 5000 * 0.03 / 1000 = 0.15t');
  assert.ok(ecoResult.sectors.food < 0.7, 'Food footprint should be less than base vegan due to 80% local sourcing');
  assert.strictEqual(ecoResult.sectors.consumption, 0.4, 'Consumption style should match minimalist');

  console.log('\n🎉 All carbon calculations unit tests passed successfully!');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Carbon calculator unit tests failed!');
  console.error(error);
  process.exit(1);
}
