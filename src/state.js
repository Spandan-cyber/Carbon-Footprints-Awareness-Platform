import { calculateFootprint } from './calculator.js';
import { calculateSavings } from './habits.js';
import { subscribeToAuth, saveUserData, fetchUserData } from './firebase.js';

// Default user questionnaire values
const DEFAULT_INPUTS = {
  carKm: '8000',
  carType: 'carGasoline',
  publicTransitKm: '2000',
  transitType: 'bus',
  shortFlights: '2',
  longFlights: '1',
  householdSize: '2',
  electricityKwh: '300',
  greenElectricityShare: '20',
  heatingKwh: '6000',
  heatingSource: 'naturalGas',
  dietType: 'averageMeat',
  localFoodShare: '30',
  consumptionStyle: 'average',
  wasteManagement: 'averageWaste'
};

const DEFAULT_CHAT = [
  {
    sender: 'bot',
    title: 'Welcome to Gaia AI!',
    text: 'I\'m your personal carbon coach. I\'m here to analyze your emissions, answer questions, and help you build sustainable habits. Try asking me something or select a quick topic below!'
  }
];

class StateManager {
  constructor() {
    this.inputs = { ...DEFAULT_INPUTS };
    this.adoptedHabits = [];
    this.chatLogs = [ ...DEFAULT_CHAT ];
    this.customAvatar = null;
    this.customName = null;
    this.currentUser = null;
    this.authInitialized = false;
    this.authSubscribers = new Set();
    this.dataSubscribers = new Set();

    this.loadLocal();

    // Listen to Firebase authentication status changes
    subscribeToAuth(async (user) => {
      this.currentUser = user;
      this.authInitialized = true;
      if (user) {
        await this.syncOnLogin(user.uid);
      } else {
        this.loadLocal();
      }
      this.notifyAuthSubscribers();
      this.notifyDataSubscribers();
    });
  }

  loadLocal() {
    let saved = localStorage.getItem('sylva_state');
    if (!saved) {
      saved = localStorage.getItem('terratrace_state');
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.inputs) this.inputs = { ...DEFAULT_INPUTS, ...parsed.inputs };
        if (parsed.adoptedHabits) this.adoptedHabits = parsed.adoptedHabits;
        if (parsed.chatLogs) this.chatLogs = parsed.chatLogs;
        if (parsed.customAvatar) this.customAvatar = parsed.customAvatar;
        if (parsed.customName) this.customName = parsed.customName;
      } catch (e) {
        console.error('Failed to parse Sylva localStorage state:', e);
      }
    } else {
      // Revert to defaults if no local storage
      this.inputs = { ...DEFAULT_INPUTS };
      this.adoptedHabits = [];
      this.chatLogs = [ ...DEFAULT_CHAT ];
      this.customAvatar = null;
      this.customName = null;
    }
  }

  saveLocal() {
    localStorage.setItem('sylva_state', JSON.stringify({
      inputs: this.inputs,
      adoptedHabits: this.adoptedHabits,
      chatLogs: this.chatLogs,
      customAvatar: this.customAvatar,
      customName: this.customName
    }));
  }

  async syncOnLogin(uid) {
    const cloudState = await fetchUserData(uid);
    if (cloudState) {
      // Existing cloud profile - sync down (prioritized remote)
      if (cloudState.inputs) this.inputs = { ...DEFAULT_INPUTS, ...cloudState.inputs };
      this.adoptedHabits = cloudState.adoptedHabits || [];
      this.chatLogs = cloudState.chatLogs || [ ...DEFAULT_CHAT ];
      this.customAvatar = cloudState.customAvatar || null;
      this.customName = cloudState.customName || null;
      this.saveLocal();
    } else {
      // First-time login: upload current local state to the newly created cloud profile
      await this.saveCloud();
    }
  }

  async save() {
    this.saveLocal();
    if (this.currentUser) {
      await this.saveCloud();
    }
    this.notifyDataSubscribers();
  }

  async saveCloud() {
    if (this.currentUser) {
      await saveUserData(this.currentUser.uid, {
        inputs: this.inputs,
        adoptedHabits: this.adoptedHabits,
        chatLogs: this.chatLogs,
        customAvatar: this.customAvatar,
        customName: this.customName,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  reset() {
    this.inputs = { ...DEFAULT_INPUTS };
    this.adoptedHabits = [];
    this.chatLogs = [ ...DEFAULT_CHAT ];
    this.customAvatar = null;
    this.customName = null;
    this.save();
  }

  updateInput(key, value) {
    this.inputs[key] = value;
    this.save();
  }

  adoptHabit(habitId) {
    if (!this.adoptedHabits.includes(habitId)) {
      this.adoptedHabits.push(habitId);
      this.save();
    }
  }

  abandonHabit(habitId) {
    this.adoptedHabits = this.adoptedHabits.filter(id => id !== habitId);
    this.save();
  }

  addChatMessage(sender, title, text) {
    this.chatLogs.push({ sender, title, text });
    this.save();
  }

  subscribeToAuthChanges(callback) {
    this.authSubscribers.add(callback);
    callback(this.currentUser, this.authInitialized);
    return () => this.authSubscribers.delete(callback);
  }

  notifyAuthSubscribers() {
    this.authSubscribers.forEach(cb => cb(this.currentUser, this.authInitialized));
  }

  subscribeToDataChanges(callback) {
    this.dataSubscribers.add(callback);
    return () => this.dataSubscribers.delete(callback);
  }

  notifyDataSubscribers() {
    this.dataSubscribers.forEach(cb => cb());
  }

  /**
   * Computes the current carbon statistics (baseline, savings, and net)
   */
  getStats() {
    const baseline = calculateFootprint(this.inputs);
    const savings = calculateSavings(this.adoptedHabits);

    const netSectors = {};
    let netTotal = 0;

    Object.keys(baseline.sectors).forEach(sector => {
      const sectorVal = Math.max(0, baseline.sectors[sector] - savings.sectors[sector]);
      netSectors[sector] = parseFloat(sectorVal.toFixed(2));
      netTotal += sectorVal;
    });

    return {
      baseline,
      savings,
      netSectors,
      netTotal: parseFloat(netTotal.toFixed(2))
    };
  }
}

export const stateManager = new StateManager();
export default stateManager;

export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
