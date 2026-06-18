import stateManager, { escapeHTML } from './state.js';
import { HABITS, getLevelInfo } from './habits.js';
import notifications from './notifications.js';
import { initWallpaper } from './wallpaper.js';
import { animateNumber } from './animations.js';
import { initCustomCursor } from './cursor.js';
import { loginWithGoogle, logout, isFirebaseConfigured } from './firebase.js';

// Sector color settings for Donut Chart
const SECTOR_COLORS = {
  transport: '#3B82F6', // Blue
  energy: '#F59E0B',    // Amber
  food: '#10B981',      // Emerald
  consumption: '#EC4899', // Pink
  waste: '#8B5CF6'       // Purple
};

// ==========================================================================
// DOM Elements
// ==========================================================================
const elements = {
  headerFootprint: document.getElementById('header-footprint-value'),
  donutChart: document.getElementById('donut-chart'),
  chartTotalValue: document.getElementById('chart-total-value'),
  chartLegendList: document.getElementById('chart-legend-list'),
  benchmarkBar: document.getElementById('user-benchmark-bar'),
  benchmarkPin: document.getElementById('user-benchmark-pin'),
  
  // XP Elements
  xpUserTitle: document.getElementById('xp-user-title'),
  xpLevelNum: document.getElementById('xp-level-num'),
  xpCurrentVal: document.getElementById('xp-current-val'),
  xpNeededVal: document.getElementById('xp-needed-val'),
  xpFillProgress: document.getElementById('xp-fill-progress'),
  
  // Habits Elements
  habitsFilterButtons: document.querySelectorAll('.filter-btn'),
  habitsListContainer: document.getElementById('habits-list-container')
};

let activeFilter = 'all';
let currentLevel = 1;

// ==========================================================================
// Init Controller
// ==========================================================================
function init() {
  initCustomCursor();
  initWallpaper();
  setupAuthHeader();

  // Load initial level reference
  const stats = stateManager.getStats();
  const initialLevelInfo = getLevelInfo(stats.savings.xp);
  currentLevel = initialLevelInfo.level;

  setupEventListeners();
  updateDashboard();

  // Net Footprint score pill click jiggle
  const scorePill = document.querySelector('.global-score-pill');
  if (scorePill) {
    scorePill.addEventListener('click', () => {
      scorePill.classList.remove('button-jiggle');
      void scorePill.offsetWidth;
      scorePill.classList.add('button-jiggle');
      notifications.show('Net Footprint', 'Displays your current annual footprint after subtracting adopted habits.', '📊', 3000);
    });
    scorePill.addEventListener('animationend', () => {
      scorePill.classList.remove('button-jiggle');
    });
  }

  // Listen to cloud data changes
  stateManager.subscribeToDataChanges(() => {
    updateDashboard();
  });

  // Dismiss loading screen after 2 seconds
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('fade-out');
      loader.addEventListener('transitionend', () => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      });
    }
  }, 2000);
}

function setupEventListeners() {
  // Habit Filter Buttons
  elements.habitsFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.habitsFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderHabitsList();
    });
  });
}

function updateDashboard() {
  const stats = stateManager.getStats();
  const netTotal = stats.netTotal;
  const netSectors = stats.netSectors;
  const savings = stats.savings;

  // 1. Update Header Badge & Donut Center text with animations
  if (elements.headerFootprint) animateNumber(elements.headerFootprint, netTotal, 550, 2);
  if (elements.chartTotalValue) animateNumber(elements.chartTotalValue, netTotal, 550, 2);

  // 2. Render SVG Donut and Legend List
  renderDonutChart(netSectors, netTotal);

  // 3. Render Benchmark Comparison
  const maxBenchmarkScale = 18.0;
  const percentage = Math.min(100, Math.max(0, (netTotal / maxBenchmarkScale) * 100));
  if (elements.benchmarkBar) elements.benchmarkBar.style.width = `${percentage}%`;
  if (elements.benchmarkPin) elements.benchmarkPin.style.left = `${percentage}%`;

  // 4. Render XP Level Cards with animations
  const levelInfo = getLevelInfo(savings.xp);
  if (elements.xpUserTitle) elements.xpUserTitle.textContent = levelInfo.title;
  if (elements.xpLevelNum) elements.xpLevelNum.textContent = levelInfo.level;
  if (elements.xpCurrentVal) animateNumber(elements.xpCurrentVal, levelInfo.xpInCurrentLevel, 550, 0);
  if (elements.xpNeededVal) animateNumber(elements.xpNeededVal, levelInfo.xpRequiredForNext, 550, 0);
  if (elements.xpFillProgress) elements.xpFillProgress.style.width = `${levelInfo.progressPercent}%`;

  // Award Level-up praises
  if (levelInfo.level > currentLevel) {
    currentLevel = levelInfo.level;
    notifications.show('Level Up!', `Congratulations! You reached Level ${levelInfo.level} — ${levelInfo.title}!`, '🏆', 5000);
  } else if (levelInfo.level < currentLevel) {
    currentLevel = levelInfo.level;
  }

  // 5. Render Habit cards
  renderHabitsList();
}

function renderDonutChart(sectors, total) {
  if (!elements.donutChart) return;
  elements.donutChart.innerHTML = '';

  const radius = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius; // ~376.99
  
  let cumulativePercent = 0;
  let legendHtml = '';

  // Zero state handling
  if (total === 0) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', '#162b24');
    circle.setAttribute('stroke-width', strokeWidth.toString());
    elements.donutChart.appendChild(circle);

    Object.keys(sectors).forEach(sector => {
      legendHtml += `
        <li class="legend-item">
          <div class="legend-left">
            <span class="legend-color-dot" style="background-color: ${SECTOR_COLORS[sector]}"></span>
            <span class="legend-label">${sector}</span>
          </div>
          <span class="legend-value">0.0 t</span>
        </li>`;
    });
    elements.chartLegendList.innerHTML = legendHtml;
    return;
  }

  // Draw circles dynamically for each sector
  Object.keys(sectors).forEach(sector => {
    const value = sectors[sector];
    const percent = value / total;
    const segmentLength = percent * circumference;
    const offset = -cumulativePercent * circumference;

    if (value > 0) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx.toString());
      circle.setAttribute('cy', cy.toString());
      circle.setAttribute('r', radius.toString());
      circle.setAttribute('fill', 'transparent');
      circle.setAttribute('stroke', SECTOR_COLORS[sector]);
      circle.setAttribute('stroke-width', strokeWidth.toString());
      circle.setAttribute('stroke-dasharray', `${segmentLength} ${circumference}`);
      circle.setAttribute('stroke-dashoffset', offset.toString());
      circle.setAttribute('transform', 'rotate(-90 80 80)');
      elements.donutChart.appendChild(circle);
    }

    // Legend item clickable linking to coach with that query preset!
    legendHtml += `
      <li class="legend-item" title="Ask Gaia Coach about ${sector}" style="cursor: pointer;" onclick="window.location.href='assistant.html?query=${sector}'">
        <div class="legend-left">
          <span class="legend-color-dot" style="background-color: ${SECTOR_COLORS[sector]}"></span>
          <span class="legend-label">${sector}</span>
        </div>
        <span class="legend-value">${value.toFixed(2)} t</span>
      </li>`;

    cumulativePercent += percent;
  });

  if (elements.chartLegendList) elements.chartLegendList.innerHTML = legendHtml;
}

function renderHabitsList() {
  if (!elements.habitsListContainer) return;
  elements.habitsListContainer.innerHTML = '';

  const filteredHabits = HABITS.filter(habit => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'food') return habit.sector === 'food' || habit.sector === 'waste';
    return habit.sector === activeFilter;
  });

  filteredHabits.forEach((habit, index) => {
    const isAdopted = stateManager.adoptedHabits.includes(habit.id);
    
    const habitCard = document.createElement('div');
    habitCard.className = `habit-card ${isAdopted ? 'adopted' : ''}`;
    habitCard.setAttribute('role', 'listitem');

    const diffClass = `diff-${habit.difficulty.toLowerCase()}`;

    habitCard.innerHTML = `
      <button class="habit-checkbox-btn" aria-label="${isAdopted ? 'Abandon' : 'Adopt'} ${habit.title}" aria-pressed="${isAdopted}"></button>
      <div class="habit-info">
        <h4 class="habit-name">${habit.title}</h4>
        <p class="habit-description">${habit.description}</p>
        <div class="habit-footer-pills">
          <span class="habit-pill ${diffClass}">${habit.difficulty}</span>
          <span class="habit-pill xp">+${habit.xpReward} XP</span>
          <span class="habit-pill impact">-${habit.carbonSavings.toFixed(2)} t CO₂e</span>
        </div>
      </div>
    `;

    const toggleHabit = () => {
      if (isAdopted) {
        stateManager.abandonHabit(habit.id);
        notifications.show('Action Removed', `Abandoned: "${habit.title}" (${habit.carbonSavings.toFixed(2)} t CO₂e added back)`, '⚠️', 3000);
      } else {
        stateManager.adoptHabit(habit.id);
        notifications.show('Action Adopted!', `Adopted: "${habit.title}" (Footprint reduced by -${habit.carbonSavings.toFixed(2)} t CO₂e)`, '🌱', 3500);
      }
      updateDashboard();
    };

    // Prevent button click from double firing card click
    const btn = habitCard.querySelector('.habit-checkbox-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleHabit();
    });

    habitCard.addEventListener('click', toggleHabit);
    elements.habitsListContainer.appendChild(habitCard);

    // Staggered card entrance transition
    setTimeout(() => {
      habitCard.classList.add('visible');
    }, index * 40);
  });

  if (filteredHabits.length === 0) {
    elements.habitsListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 0.9rem;">
        No habits match the selected filter.
      </div>
    `;
  }
}

function setupAuthHeader() {
  const container = document.getElementById('auth-header-container');
  if (!container) return;

  const renderHeader = (user) => {
    container.innerHTML = '';
    
    if (user) {
      // User is logged in - render profile badge
      const badge = document.createElement('div');
      badge.className = 'auth-user-badge';
      
      const isDemo = !isFirebaseConfigured;
      const statusClass = isDemo ? 'demo' : 'connected';
      const statusText = isDemo ? 'Demo Mode' : 'Cloud Sync';
      
      badge.innerHTML = `
        <div class="auth-avatar-wrapper">
          <img class="auth-avatar" src="${stateManager.customAvatar || user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="${escapeHTML(stateManager.customName || user.displayName || 'User')}">
          <span class="auth-status-dot ${statusClass}"></span>
        </div>
        <div class="auth-dropdown">
          <div class="auth-dropdown-user-info">
            <span class="auth-dropdown-name">${escapeHTML(stateManager.customName || user.displayName || 'User')}</span>
            <span class="auth-dropdown-email">${escapeHTML(user.email || '')}</span>
          </div>
          <div class="auth-status-badge ${statusClass}">
            <span class="status-indicator-dot"></span>
            ${statusText}
          </div>
          <div class="auth-dropdown-divider"></div>
          <a href="profile.html" class="auth-dropdown-link">
            <svg class="line-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Profile
          </a>
          <div class="auth-dropdown-divider"></div>
          <button class="auth-dropdown-btn" id="btn-auth-signout">
            <svg class="line-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      `;
      
      // Handle click on user badge (for mobile toggle, though hover is default in CSS)
      badge.addEventListener('click', (e) => {
        if (e.target.closest('.auth-dropdown-btn') || e.target.closest('.auth-dropdown-link')) return;
        badge.classList.toggle('active');
        e.stopPropagation();
      });

      container.appendChild(badge);

      // Sign out handler
      const signOutBtn = document.getElementById('btn-auth-signout');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await logout();
            notifications.show('Signed Out', 'You have signed out of your account.', 'ℹ️', 3000);
          } catch (error) {
            console.error('Sign out error:', error);
          }
        });
      }
    } else {
      // User is logged out - render Sign In button
      const btn = document.createElement('button');
      btn.className = 'google-signin-btn';
      btn.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#ea4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.5 5.5 0 0 1 8.5 13a5.5 5.5 0 0 1 5.491-5.518c2.4 0 3.818 1.364 3.818 1.364l2.864-2.864S18.545 4 13.99 4C8.48 4 4 8.48 4 14s4.48 10 9.99 10c6.19 0 9.873-4.527 9.873-10.227 0-.573-.054-1.488-.054-1.488H12.24Z"/>
        </svg>
        Sign In
      `;
      
      btn.addEventListener('click', async () => {
        btn.classList.remove('button-jiggle');
        void btn.offsetWidth;
        btn.classList.add('button-jiggle');
        
        try {
          btn.disabled = true;
          btn.innerHTML = `<span style="font-size: 0.8rem; opacity: 0.7;">Signing in...</span>`;
          await new Promise(resolve => setTimeout(resolve, 150));
          const result = await loginWithGoogle();
          notifications.show('Welcome to Sylva!', `Signed in as ${stateManager.customName || result.user.displayName || 'User'}`, '🌳', 3500);
        } catch (error) {
          console.error('Sign in error:', error);
          notifications.show('Sign In Failed', 'Authentication could not be completed.', '❌', 3500);
          renderHeader(null); // restore button state
        }
      });

      btn.addEventListener('animationend', () => {
        btn.classList.remove('button-jiggle');
      });

      container.appendChild(btn);
    }
  };

  stateManager.subscribeToAuthChanges((user) => {
    renderHeader(user);
  });

  stateManager.subscribeToDataChanges(() => {
    renderHeader(stateManager.currentUser);
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    const activeBadge = document.querySelector('.auth-user-badge.active');
    if (activeBadge) {
      activeBadge.classList.remove('active');
    }
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
