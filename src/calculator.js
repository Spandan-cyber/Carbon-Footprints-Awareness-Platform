/**
 * Carbon Footprint Calculation Engine
 * Estimates carbon emissions (in tonnes of CO2e per year) based on user activities.
 */

// Emission factors (in kg CO2e per unit)
export const EMISSION_FACTORS = {
  transport: {
    carGasoline: 0.18, // per km
    carDiesel: 0.17,   // per km
    carElectric: 0.04, // per km (average grid charging)
    bus: 0.05,         // per passenger km
    train: 0.03,       // per passenger km
    flightShort: 0.15, // per km (< 1500 km)
    flightLong: 0.11   // per km (> 1500 km)
  },
  energy: {
    electricity: 0.38,   // per kWh
    naturalGas: 0.20,    // per kWh
    heatingOil: 0.27,    // per kWh
    coal: 0.34,          // per kWh
    biomass: 0.03,       // per kWh
    geothermal: 0.02     // per kWh
  },
  food: {
    meatHeavy: 2.9,     // tonnes/year
    averageMeat: 1.8,   // tonnes/year
    pescatarian: 1.4,   // tonnes/year
    vegetarian: 1.1,    // tonnes/year
    vegan: 0.7          // tonnes/year
  },
  consumption: {
    minimalist: 0.4,    // tonnes/year
    average: 1.2,       // tonnes/year
    shopper: 2.6        // tonnes/year
  },
  waste: {
    highWaste: 0.9,     // tonnes/year (no recycling)
    averageWaste: 0.5,  // tonnes/year (partial recycling)
    lowWaste: 0.2       // tonnes/year (intensive recycling/composting)
  }
};

/**
 * Calculates carbon footprint based on user inputs
 * @param {Object} inputs User context inputs from UI
 * @returns {Object} Calculated carbon footprint in tonnes/year
 */
export function calculateFootprint(inputs) {
  // 1. Transport Calculation
  let transportTotal = 0;
  
  // Car travel
  const carKm = parseFloat(inputs.carKm) || 0;
  const carType = inputs.carType || 'carGasoline';
  transportTotal += (carKm * EMISSION_FACTORS.transport[carType]);

  // Public Transit
  const publicTransitKm = parseFloat(inputs.publicTransitKm) || 0;
  const transitType = inputs.transitType || 'bus'; // bus or train
  transportTotal += (publicTransitKm * EMISSION_FACTORS.transport[transitType]);

  // Flights
  const shortFlightKm = (parseFloat(inputs.shortFlights) || 0) * 1000; // avg 1000km per short flight
  const longFlightKm = (parseFloat(inputs.longFlights) || 0) * 6000;   // avg 6000km per long flight
  transportTotal += (shortFlightKm * EMISSION_FACTORS.transport.flightShort);
  transportTotal += (longFlightKm * EMISSION_FACTORS.transport.flightLong);

  // Convert transport to tonnes
  const transportTonnes = transportTotal / 1000;

  // 2. Household Energy Calculation
  let energyTotal = 0;
  
  // Electricity
  const elecKwh = parseFloat(inputs.electricityKwh) || 0;
  const greenShare = parseFloat(inputs.greenElectricityShare) || 0; // percentage 0-100
  const adjustedElecFactor = EMISSION_FACTORS.energy.electricity * (1 - greenShare / 100);
  energyTotal += (elecKwh * adjustedElecFactor);

  // Heating
  const heatingKwh = parseFloat(inputs.heatingKwh) || 0;
  const heatingSource = inputs.heatingSource || 'naturalGas';
  energyTotal += (heatingKwh * EMISSION_FACTORS.energy[heatingSource]);

  // Household sizing adjustment (split energy by household size, but sharing is not 1:1)
  const householdSize = Math.max(1, parseInt(inputs.householdSize) || 1);
  const sharingFactor = 1 + (householdSize - 1) * 0.5; // sharing economy in households
  const energyTonnes = (energyTotal / sharingFactor) / 1000;

  // 3. Food Diet Calculation
  const dietType = inputs.dietType || 'averageMeat';
  let foodTonnes = EMISSION_FACTORS.food[dietType];

  // Local/Organic sourcing adjustment
  const localFoodShare = parseFloat(inputs.localFoodShare) || 0; // percentage 0-100
  // Sourcing locally/organically can reduce food footprint by up to 15%
  foodTonnes = foodTonnes * (1 - (localFoodShare / 100) * 0.15);

  // 4. Consumption & Shopping
  const consumptionStyle = inputs.consumptionStyle || 'average';
  const consumptionTonnes = EMISSION_FACTORS.consumption[consumptionStyle];

  // 5. Waste & Recycling
  const wasteManagement = inputs.wasteManagement || 'averageWaste';
  const wasteTonnes = EMISSION_FACTORS.waste[wasteManagement];

  // Summarize results
  const total = transportTonnes + energyTonnes + foodTonnes + consumptionTonnes + wasteTonnes;

  return {
    sectors: {
      transport: parseFloat(transportTonnes.toFixed(2)),
      energy: parseFloat(energyTonnes.toFixed(2)),
      food: parseFloat(foodTonnes.toFixed(2)),
      consumption: parseFloat(consumptionTonnes.toFixed(2)),
      waste: parseFloat(wasteTonnes.toFixed(2))
    },
    total: parseFloat(total.toFixed(2))
  };
}

/**
 * Compares footprint to global standard benchmarks
 * @param {number} total Total tonnes/year
 * @returns {Object} Comparison data
 */
export function getBenchmarks(total) {
  return {
    user: total,
    worldAverage: 4.5,
    usAverage: 16.0,
    euAverage: 6.5,
    parisAgreementTarget: 2.0
  };
}
