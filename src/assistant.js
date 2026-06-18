/**
 * Gaia AI - Smart Climate Assistant
 * Analyzes footprint contexts, tracks progress, and answers climate-related questions.
 */

// Responses based on topics/keywords
const TOPIC_RESPONSES = {
  transport: {
    title: 'Optimizing Transportation',
    text: `Transportation is often the single largest source of personal emissions. 
    <ul>
      <li><strong>Reduce Car Trips:</strong> Try bundling errands, carpooling, or walking for trips under 3km.</li>
      <li><strong>Public Transit:</strong> Buses and trains emit 70-80% less CO2 per kilometer than solo driving.</li>
      <li><strong>Aviation:</strong> A single round-trip long-haul flight can release over 1.5 tonnes of CO2. Consider train travel or combining trips.</li>
    </ul>`
  },
  energy: {
    title: 'Smart Home Energy',
    text: `Home heating and electricity are major carbon drivers. Here are high-impact changes:
    <ul>
      <li><strong>Switch to Renewables:</strong> Choose a green energy provider. This can wipe out your entire electricity footprint!</li>
      <li><strong>Thermostat Settings:</strong> Setting heating 1-2°C lower in winter saves ~10% on energy bills and emissions.</li>
      <li><strong>Standby Power:</strong> Unplug chargers and appliances; "phantom loads" account for 5% of household energy.</li>
    </ul>`
  },
  food: {
    title: 'Sustainable Eating',
    text: `Our food system represents about 26% of global greenhouse gas emissions.
    <ul>
      <li><strong>Protein Transition:</strong> Beef produces up to 30x more emissions per gram of protein than beans/lentils. Switching even a few meals makes a massive impact.</li>
      <li><strong>Food Waste:</strong> 33% of food is wasted globally. If food waste were a country, it would be the third-largest emitter.</li>
      <li><strong>Eat Seasonally:</strong> Avoid air-freighted out-of-season produce.</li>
    </ul>`
  },
  consumption: {
    title: 'Circular Consumption',
    text: `Every item bought has an upstream manufacturing footprint.
    <ul>
      <li><strong>Circular Economy:</strong> Purchase secondhand items. This extends product lifespans and bypasses production emissions.</li>
      <li><strong>Buy Quality:</strong> Choose durable goods over fast fashion and cheap electronics.</li>
      <li><strong>Repair Over Replace:</strong> Try patching clothes or replacing phone batteries instead of upgrading.</li>
    </ul>`
  },
  waste: {
    title: 'Zero-Waste Practices',
    text: `Landfilled organic waste decays into methane, a greenhouse gas 28x more potent than CO2.
    <ul>
      <li><strong>Compost:</strong> Composting returns organic matter to the soil without generating landfill methane.</li>
      <li><strong>Recycling:</strong> Aluminum and paper recycling require 95% and 40% less energy respectively than producing raw materials.</li>
    </ul>`
  },
  offsets: {
    title: 'Carbon Offsetting',
    text: `Carbon offsets fund environmental projects (like reforestation or solar farms) to balance out your emissions.
    <strong>Gaia's Tip:</strong> Offsets should be a <em>last resort</em>. Always prioritize reducing your actual emissions first. Look for gold-standard verified offset providers (like Gold Standard or Plan Vivo).`
  },
  averages: {
    title: 'Understanding Averages',
    text: `To prevent catastrophic warming, global average emissions must drop below <strong>2.0 tonnes per person annually</strong> by 2030. Currently:
    <ul>
      <li>USA average: ~16.0 tonnes</li>
      <li>Europe average: ~6.5 tonnes</li>
      <li>Global average: ~4.5 tonnes</li>
    </ul>
    Every small change helps pull these national averages down!`
  },
  greeting: {
    title: 'Hello, I\'m Gaia!',
    text: 'I\'m your personal climate coach. I\'m here to analyze your emissions, answer questions, and help you build sustainable habits. Try asking me something or check the insights below!'
  }
};

/**
 * Evaluates the current carbon footprint inputs and returns a personalized dashboard analysis.
 * @param {Object} footprint Calculated footprint sectors and total
 * @param {Array<string>} adoptedHabits List of adopted habit IDs
 * @returns {Object} Structured analysis (status, alert, suggestions)
 */
export function analyzeUserContext(footprint, adoptedHabits) {
  const { sectors, total } = footprint;
  
  // Find highest sector
  let highestSector = 'food';
  let highestValue = 0;
  
  Object.keys(sectors).forEach(sector => {
    if (sectors[sector] > highestValue) {
      highestValue = sectors[sector];
      highestSector = sector;
    }
  });

  const totalSaved = adoptedHabits.reduce((acc, id) => {
    // Add up simulated savings if needed, but here we can just count habits
    return acc + 1;
  }, 0);

  let statusText = '';
  let alertClass = 'info';
  let insights = [];

  if (total > 12) {
    statusText = 'High footprint. There are significant opportunities for reductions in your daily routine.';
    alertClass = 'warning';
  } else if (total > 5) {
    statusText = 'Moderate footprint. You are close to the national average, but we can aim lower!';
    alertClass = 'neutral';
  } else if (total > 2) {
    statusText = 'Good footprint! You are below average, approaching sustainable levels.';
    alertClass = 'success';
  } else {
    statusText = 'Excellent! Your lifestyle aligns with global climate safety targets (< 2 tonnes).';
    alertClass = 'emerald';
  }

  // Create context-aware insights
  if (highestSector === 'transport') {
    insights.push({
      type: 'transport',
      message: `<strong>Transport:</strong> Transport is your largest emission source (${sectors.transport} t). Try cutting short drives or adopting public transport habits.`
    });
  } else if (highestSector === 'energy') {
    insights.push({
      type: 'energy',
      message: `<strong>Energy:</strong> Home energy accounts for ${sectors.energy} t of your footprint. Switching to a 100% renewable plan or lowering heating is your highest leverage action.`
    });
  } else if (highestSector === 'food') {
    insights.push({
      type: 'food',
      message: `<strong>Food:</strong> Your food footprint is ${sectors.food} t. Reducing red meat intake or cutting down food waste will make a massive impact.`
    });
  } else if (highestSector === 'consumption') {
    insights.push({
      type: 'consumption',
      message: `<strong>Consumption:</strong> Consumer goods contribute ${sectors.consumption} t. Buying secondhand first and keeping devices longer is recommended.`
    });
  } else {
    insights.push({
      type: 'waste',
      message: `<strong>Waste:</strong> Waste disposal emits ${sectors.waste} t. Minimizing food packaging and composting will bring this down.`
    });
  }

  // Second insight based on accomplishments
  if (totalSaved === 0) {
    insights.push({
      type: 'habits',
      message: '<strong>Getting Started:</strong> Ready to take action? Browse the habits list below and click "Adopt" to immediately see your carbon emissions shrink!'
    });
  } else if (totalSaved < 4) {
    insights.push({
      type: 'habits',
      message: `<strong>Progress:</strong> Great start! You've adopted ${totalSaved} habits. Pick one more medium or high difficulty challenge to level up faster.`
    });
  } else {
    insights.push({
      type: 'habits',
      message: `<strong>Milestone:</strong> Climate Champion! With ${totalSaved} habits active, you are showing incredible commitment. Keep maintaining this lifestyle!`
    });
  }

  return {
    statusText,
    alertClass,
    highestSector,
    insights
  };
}

/**
 * Route user typed questions to context-rich responses
 * @param {string} rawMessage User question input
 * @param {Object} footprint Current carbon footprint object
 * @returns {Object} { title: string, text: string }
 */
export function getAssistantResponse(rawMessage, footprint) {
  const msg = rawMessage.toLowerCase();

  // Keyword-based routing
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('greet')) {
    return {
      title: 'Welcome Back!',
      text: `Hello there! I am Gaia, your carbon footprint assistant. 
      Right now, your estimated annual carbon footprint is <strong>${footprint.total} tonnes of CO2e</strong>. 
      Let me know how I can help you reduce this today!`
    };
  }

  if (msg.includes('car') || msg.includes('flight') || msg.includes('plane') || msg.includes('drive') || msg.includes('travel') || msg.includes('transport')) {
    return TOPIC_RESPONSES.transport;
  }

  if (msg.includes('electric') || msg.includes('energy') || msg.includes('power') || msg.includes('heat') || msg.includes('gas') || msg.includes('solar') || msg.includes('light')) {
    return TOPIC_RESPONSES.energy;
  }

  if (msg.includes('food') || msg.includes('eat') || msg.includes('meat') || msg.includes('vegan') || msg.includes('beef') || msg.includes('diet') || msg.includes('veget')) {
    return TOPIC_RESPONSES.food;
  }

  if (msg.includes('shopping') || msg.includes('buy') || msg.includes('clothes') || msg.includes('purchas') || msg.includes('secondhand') || msg.includes('fashion') || msg.includes('phone')) {
    return TOPIC_RESPONSES.consumption;
  }

  if (msg.includes('waste') || msg.includes('recycle') || msg.includes('compost') || msg.includes('trash') || msg.includes('garbage')) {
    return {
      title: 'Circular Waste Management',
      text: `${TOPIC_RESPONSES.waste.text}<br>Currently, your waste emissions represent <strong>${footprint.sectors.waste} tonnes</strong> of your overall emissions.`
    };
  }

  if (msg.includes('offset') || msg.includes('neutral') || msg.includes('tree') || msg.includes('planting')) {
    return TOPIC_RESPONSES.offsets;
  }

  if (msg.includes('average') || msg.includes('compare') || msg.includes('standard') || msg.includes('target') || msg.includes('paris')) {
    return TOPIC_RESPONSES.averages;
  }

  if (msg.includes('help') || msg.includes('question') || msg.includes('do') || msg.includes('suggest')) {
    return {
      title: 'Gaia Help Guide',
      text: `You can ask me questions about:
      <ul>
        <li><strong>transportation</strong> (cars, public transit, flights)</li>
        <li><strong>home energy</strong> (solar, electricity, heating)</li>
        <li><strong>food systems</strong> (vegan/vegetarian, food waste, local food)</li>
        <li><strong>recycling and waste</strong> (composting, circularity)</li>
        <li><strong>carbon offsets</strong> and global averages</li>
      </ul>
      Simply type your question or select one of the suggested prompts.`
    };
  }

  // Fallback with custom analysis
  const highest = analyzeUserContext(footprint, []).highestSector;
  return {
    title: 'Custom Advice',
    text: `I couldn't match a specific keyword, but looking at your footprint: 
    Your highest sector is <strong>${highest}</strong> (${footprint.sectors[highest]} tonnes). 
    I highly recommend checking out our suggestions for that category. Try typing "transport", "energy", or "food" for deep-dive climate actions!`
  };
}
