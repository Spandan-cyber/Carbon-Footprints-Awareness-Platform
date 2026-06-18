/**
 * Habits & Sustainable Actions Database
 * Tracks available actions, their potential carbon savings, and user leveling mechanics.
 */

export const HABITS = [
  // --- TRANSPORT SECTOR ---
  {
    id: 'bike_short_trips',
    title: 'Cycle/Walk Short Trips',
    description: 'Replace car trips under 5km with biking, walking, or scooting.',
    sector: 'transport',
    difficulty: 'Low',
    xpReward: 50,
    carbonSavings: 0.35, // tCO2e/year
    tips: 'Start with one day a week (e.g. running local errands on Saturdays).'
  },
  {
    id: 'carpool_work',
    title: 'Commuter Carpooling',
    description: 'Share your daily commute with coworkers or neighbors 2+ times a week.',
    sector: 'transport',
    difficulty: 'Medium',
    xpReward: 80,
    carbonSavings: 0.50,
    tips: 'Use workplace bulletin boards or local carpooling apps to find matches.'
  },
  {
    id: 'public_transit',
    title: 'Transit Tuesday',
    description: 'Use trains or buses for your commute at least twice a week.',
    sector: 'transport',
    difficulty: 'Medium',
    xpReward: 70,
    carbonSavings: 0.45,
    tips: 'Use transit apps to plan routes. Reading or listening to podcasts makes the time fly.'
  },
  {
    id: 'reduce_flights',
    title: 'Local Vacationer',
    description: 'Replace one long-haul flight per year with a train trip or local staycation.',
    sector: 'transport',
    difficulty: 'High',
    xpReward: 180,
    carbonSavings: 0.85,
    tips: 'Explore regional gems. Trains let you see landscapes and avoid airport security lines.'
  },

  // --- ENERGY SECTOR ---
  {
    id: 'led_bulbs',
    title: 'LED Retrofit',
    description: 'Replace all remaining incandescent or halogen bulbs with energy-efficient LEDs.',
    sector: 'energy',
    difficulty: 'Low',
    xpReward: 40,
    carbonSavings: 0.12,
    tips: 'LEDs consume up to 85% less energy and last up to 25 times longer.'
  },
  {
    id: 'thermostat_adjustment',
    title: 'Thermostat Dialback',
    description: 'Lower heating by 2°C in winter, or raise cooling by 2°C in summer.',
    sector: 'energy',
    difficulty: 'Low',
    xpReward: 50,
    carbonSavings: 0.28,
    tips: 'Put on a cozy sweater or use smart programmable thermostats to automate adjustments.'
  },
  {
    id: 'cold_wash',
    title: 'Cold Water Washing',
    description: 'Wash laundry in cold water (30°C or less) and air-dry when possible.',
    sector: 'energy',
    difficulty: 'Low',
    xpReward: 30,
    carbonSavings: 0.10,
    tips: 'Up to 90% of a washing machine\'s energy goes to heating the water.'
  },
  {
    id: 'green_power',
    title: 'Renewable Power Switch',
    description: 'Switch to a certified 100% renewable energy plan with your local electricity provider.',
    sector: 'energy',
    difficulty: 'Medium',
    xpReward: 150,
    carbonSavings: 1.10,
    tips: 'It takes 10 minutes to call your provider or switch online. Look for green certifications.'
  },

  // --- FOOD SECTOR ---
  {
    id: 'meatless_mondays',
    title: 'Meatless Mondays',
    description: 'Avoid meat entirely for one day per week.',
    sector: 'food',
    difficulty: 'Low',
    xpReward: 45,
    carbonSavings: 0.22,
    tips: 'Explore hearty options like bean chilis, lentil curries, or mushroom burgers.'
  },
  {
    id: 'low_food_waste',
    title: 'Zero Waste Pantry',
    description: 'Measure, plan meals, and store food properly to achieve zero food waste.',
    sector: 'food',
    difficulty: 'Medium',
    xpReward: 80,
    carbonSavings: 0.30,
    tips: 'Make a weekly shopping list, buy only what you need, and freeze leftovers immediately.'
  },
  {
    id: 'organic_local',
    title: 'Locavore Sourcing',
    description: 'Purchase 50%+ of your groceries from local farms, farmer\'s markets, or organic sources.',
    sector: 'food',
    difficulty: 'Medium',
    xpReward: 60,
    carbonSavings: 0.18,
    tips: 'Eating seasonally reduces long-distance cold-chain transport emissions.'
  },
  {
    id: 'plant_based_heavy',
    title: 'Plant-Based Transition',
    description: 'Adopt a primarily vegetarian or vegan diet full-time.',
    sector: 'food',
    difficulty: 'High',
    xpReward: 200,
    carbonSavings: 1.05,
    tips: 'Replace dairy with plant milks, and explore tofu, tempeh, or seitan for protein.'
  },

  // --- CONSUMPTION & WASTE SECTOR ---
  {
    id: 'secondhand_first',
    title: 'Secondhand Enthusiast',
    description: 'Commit to buying clothes, books, and home goods secondhand before buying new.',
    sector: 'consumption',
    difficulty: 'Medium',
    xpReward: 90,
    carbonSavings: 0.38,
    tips: 'Thrift stores, vintage boutiques, and online circular platforms offer incredible unique finds.'
  },
  {
    id: 'device_life_extension',
    title: 'Gadget Longevity',
    description: 'Keep your smartphone and computer for at least 4 years before upgrading.',
    sector: 'consumption',
    difficulty: 'Medium',
    xpReward: 75,
    carbonSavings: 0.20,
    tips: 'Electronics require massive manufacturing energy. Battery replacements can make devices feel like new.'
  },
  {
    id: 'intensive_recycling',
    title: 'Circular Waste Sorting',
    description: 'Actively recycle paper, plastics, glass, and compost organic waste.',
    sector: 'waste',
    difficulty: 'Low',
    xpReward: 40,
    carbonSavings: 0.25,
    tips: 'Wash food residue off plastics. Set up a simple two-bin system under your sink.'
  }
];

/**
 * Calculates leveling metrics based on total XP
 * @param {number} totalXp Current XP
 * @returns {Object} Level progress data
 */
export function getLevelInfo(totalXp) {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const xpInCurrentLevel = totalXp % xpPerLevel;
  const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100;
  
  // Custom user titles depending on level
  let title = 'Eco Recruit';
  if (level >= 3) title = 'Green Guard';
  if (level >= 6) title = 'Carbon Crusader';
  if (level >= 10) title = 'Gaia Guardian';
  if (level >= 15) title = 'Sustainability Sage';

  return {
    level,
    xpInCurrentLevel,
    xpRequiredForNext: xpPerLevel,
    progressPercent,
    title
  };
}

/**
 * Computes savings based on a list of adopted habits
 * @param {Array<string>} adoptedHabitIds List of adopted habit IDs
 * @returns {Object} Total savings by sector and combined total
 */
export function calculateSavings(adoptedHabitIds) {
  const result = {
    sectors: {
      transport: 0,
      energy: 0,
      food: 0,
      consumption: 0,
      waste: 0
    },
    total: 0,
    xp: 0
  };

  adoptedHabitIds.forEach(id => {
    const habit = HABITS.find(h => h.id === id);
    if (habit) {
      result.sectors[habit.sector] += habit.carbonSavings;
      result.total += habit.carbonSavings;
      result.xp += habit.xpReward;
    }
  });

  // Round values
  Object.keys(result.sectors).forEach(k => {
    result.sectors[k] = parseFloat(result.sectors[k].toFixed(2));
  });
  result.total = parseFloat(result.total.toFixed(2));

  return result;
}
