import stateManager, { escapeHTML } from './state.js';
import notifications from './notifications.js';
import { initWallpaper } from './wallpaper.js';
import { animateNumber } from './animations.js';
import { initCustomCursor } from './cursor.js';
import { loginWithGoogle, logout, isFirebaseConfigured } from './firebase.js';

// ==========================================================================
// DOM elements
// ==========================================================================
const elements = {
  // Sliders & Selects
  carKm: document.getElementById('input-car-km'),
  carType: document.getElementById('input-car-type'),
  transitKm: document.getElementById('input-transit-km'),
  transitType: document.getElementById('input-transit-type'),
  shortFlights: document.getElementById('input-short-flights'),
  longFlights: document.getElementById('input-long-flights'),
  householdSize: document.getElementById('input-household-size'),
  electricityKwh: document.getElementById('input-electricity-kwh'),
  greenShare: document.getElementById('input-green-share'),
  heatingKwh: document.getElementById('input-heating-kwh'),
  heatingSource: document.getElementById('input-heating-source'),
  dietType: document.getElementById('input-diet-type'),
  localFoodShare: document.getElementById('input-local-food-share'),
  consumptionStyle: document.getElementById('input-consumption-style'),
  wasteManagement: document.getElementById('input-waste-management'),

  // Display indicators
  valCarKm: document.getElementById('val-car-km'),
  valTransitKm: document.getElementById('val-transit-km'),
  valShortFlights: document.getElementById('val-short-flights'),
  valLongFlights: document.getElementById('val-long-flights'),
  valHouseholdSize: document.getElementById('val-household-size'),
  valElectricityKwh: document.getElementById('val-electricity-kwh'),
  valGreenShare: document.getElementById('val-green-share'),
  valHeatingKwh: document.getElementById('val-heating-kwh'),
  valLocalFoodShare: document.getElementById('val-local-food-share'),

  // Control Buttons & Headers
  headerFootprint: document.getElementById('header-footprint-value'),
  btnReset: document.getElementById('btn-reset'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel')
};

// ==========================================================================
// Init Controller
// ==========================================================================
function init() {
  initCustomCursor();
  initWallpaper();
  setupAuthHeader();
  syncInputsToUI();
  setupEventListeners();
  initSliderJiggle();
  updateHeaderScore();

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
    syncInputsToUI();
    updateHeaderScore();
  });

  // Set initial height of tab content for sliding transitions
  const activePanel = document.querySelector('.tab-panel.active');
  if (activePanel) {
    requestAnimationFrame(() => {
      adjustTabContentHeight(activePanel);
    });
  }

  // Initialize the sliding tab indicator pill position
  requestAnimationFrame(updatePillPosition);
  window.addEventListener('resize', updatePillPosition);

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

function adjustTabContentHeight(activePanel) {
  const container = document.querySelector('.tab-content');
  if (container && activePanel) {
    container.style.height = `${activePanel.offsetHeight}px`;
  }
}

function updateSliderTrail(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const percent = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--value-percent', `${percent}%`);
}

function updateAllSliderTrails() {
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(updateSliderTrail);
}

function initSliderJiggle() {
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(slider => {
    let lastVal = parseFloat(slider.value) || 0;
    let lastTime = performance.now();
    let jiggleTimeout = null;

    slider.addEventListener('input', () => {
      updateSliderTrail(slider);
      const currVal = parseFloat(slider.value) || 0;
      const currTime = performance.now();
      const dt = currTime - lastTime;
      const dv = currVal - lastVal;

      slider.classList.add('is-dragging');

      if (dt > 0) {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const range = Math.max(1, max - min);
        const normalizedDv = dv / range;
        
        // Calculate velocity (percentage of range crossed per second)
        const speed = Math.abs(normalizedDv / dt) * 1000;
        const direction = dv > 0 ? 1 : -1;

        // Visual stretch in direction of motion (X), squash in Y
        const stretchX = 1 + Math.min(0.35, speed * 0.12);
        const squashY = 1 - Math.min(0.28, speed * 0.10);
        const skew = direction * Math.min(18, speed * 6);

        slider.style.setProperty('--scale-x', stretchX);
        slider.style.setProperty('--scale-y', squashY);
        slider.style.setProperty('--skew-x', `${skew}deg`);
      }

      lastVal = currVal;
      lastTime = currTime;

      if (jiggleTimeout) clearTimeout(jiggleTimeout);
      jiggleTimeout = setTimeout(() => {
        slider.classList.remove('is-dragging');
        slider.style.setProperty('--scale-x', '1');
        slider.style.setProperty('--scale-y', '1');
        slider.style.setProperty('--skew-x', '0deg');
      }, 50);
    });
  });
}

function updatePillPosition() {
  const activeTab = document.querySelector('.tab-btn.active');
  const pill = document.getElementById('tab-indicator-pill');
  if (activeTab && pill) {
    const nav = activeTab.closest('.tabs-nav');
    if (!nav) return;
    const navRect = nav.getBoundingClientRect();
    const rect = activeTab.getBoundingClientRect();
    
    const leftOffset = rect.left - navRect.left;
    const rightOffset = navRect.width - (leftOffset + rect.width);
    
    // Temporarily remove transition to snap directly to the position
    pill.style.transition = 'none';
    pill.style.left = `${leftOffset}px`;
    pill.style.right = `${rightOffset}px`;
    pill.style.width = 'auto';
  }
}

function moveIndicator(oldTab, newTab) {
  const pill = document.getElementById('tab-indicator-pill');
  if (!pill || !oldTab || !newTab) return;

  const nav = oldTab.closest('.tabs-nav');
  if (!nav) return;
  const navRect = nav.getBoundingClientRect();
  const oldRect = oldTab.getBoundingClientRect();
  const newRect = newTab.getBoundingClientRect();

  const oldLeft = oldRect.left - navRect.left;
  const newLeft = newRect.left - navRect.left;
  const oldRight = navRect.width - (oldLeft + oldRect.width);
  const newRight = navRect.width - (newLeft + newRect.width);

  // Determine direction
  const isMovingRight = newLeft > oldLeft;

  // Clear width to make sure left/right are active
  pill.style.width = 'auto';

  if (isMovingRight) {
    // Right edge (leading) moves fast, left edge (lagging) follows with spring overshoot
    pill.style.transition = 'right 0.32s cubic-bezier(0.25, 1, 0.5, 1), left 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)';
  } else {
    // Left edge (leading) moves fast, right edge (lagging) follows with spring overshoot
    pill.style.transition = 'left 0.32s cubic-bezier(0.25, 1, 0.5, 1), right 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }

  // Set new positions
  pill.style.left = `${newLeft}px`;
  pill.style.right = `${newRight}px`;
}

function syncInputsToUI() {
  const inputs = stateManager.inputs;
  
  // Set element values
  if (elements.carKm) {
    elements.carKm.value = inputs.carKm;
    elements.valCarKm.textContent = `${inputs.carKm} km`;
  }
  if (elements.carType) elements.carType.value = inputs.carType;
  if (elements.transitKm) {
    elements.transitKm.value = inputs.publicTransitKm;
    elements.valTransitKm.textContent = `${inputs.publicTransitKm} km`;
  }
  if (elements.transitType) elements.transitType.value = inputs.transitType;
  if (elements.shortFlights) {
    elements.shortFlights.value = inputs.shortFlights;
    elements.valShortFlights.textContent = `${inputs.shortFlights} /year`;
  }
  if (elements.longFlights) {
    elements.longFlights.value = inputs.longFlights;
    elements.valLongFlights.textContent = `${inputs.longFlights} /year`;
  }
  if (elements.householdSize) {
    elements.householdSize.value = inputs.householdSize;
    elements.valHouseholdSize.textContent = `${inputs.householdSize} people`;
  }
  if (elements.electricityKwh) {
    elements.electricityKwh.value = inputs.electricityKwh;
    elements.valElectricityKwh.textContent = `${inputs.electricityKwh} kWh`;
  }
  if (elements.greenShare) {
    elements.greenShare.value = inputs.greenElectricityShare;
    elements.valGreenShare.textContent = `${inputs.greenElectricityShare}%`;
  }
  if (elements.heatingKwh) {
    elements.heatingKwh.value = inputs.heatingKwh;
    elements.valHeatingKwh.textContent = `${inputs.heatingKwh} kWh`;
  }
  if (elements.heatingSource) elements.heatingSource.value = inputs.heatingSource;
  if (elements.dietType) elements.dietType.value = inputs.dietType;
  if (elements.localFoodShare) {
    elements.localFoodShare.value = inputs.localFoodShare;
    elements.valLocalFoodShare.textContent = `${inputs.localFoodShare}%`;
  }
  if (elements.consumptionStyle) elements.consumptionStyle.value = inputs.consumptionStyle;
  if (elements.wasteManagement) elements.wasteManagement.value = inputs.wasteManagement;
  updateAllSliderTrails();
}

function setupEventListeners() {
  // Bind slider changes to state update
  const sliders = [
    { el: elements.carKm, key: 'carKm', display: elements.valCarKm, suffix: ' km' },
    { el: elements.transitKm, key: 'publicTransitKm', display: elements.valTransitKm, suffix: ' km' },
    { el: elements.shortFlights, key: 'shortFlights', display: elements.valShortFlights, suffix: ' /year' },
    { el: elements.longFlights, key: 'longFlights', display: elements.valLongFlights, suffix: ' /year' },
    { el: elements.householdSize, key: 'householdSize', display: elements.valHouseholdSize, suffix: ' people' },
    { el: elements.electricityKwh, key: 'electricityKwh', display: elements.valElectricityKwh, suffix: ' kWh' },
    { el: elements.greenShare, key: 'greenElectricityShare', display: elements.valGreenShare, suffix: '%' },
    { el: elements.heatingKwh, key: 'heatingKwh', display: elements.valHeatingKwh, suffix: ' kWh' },
    { el: elements.localFoodShare, key: 'localFoodShare', display: elements.valLocalFoodShare, suffix: '%' }
  ];

  let updateScheduled = false;

  sliders.forEach(slider => {
    if (slider.el) {
      slider.el.addEventListener('input', (e) => {
        stateManager.updateInput(slider.key, e.target.value);
        if (slider.display) slider.display.textContent = `${e.target.value}${slider.suffix}`;
        
        // Throttled draw update using requestAnimationFrame
        if (!updateScheduled) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            updateHeaderScore();
            updateScheduled = false;
          });
        }
      });
    }
  });

  const selects = [
    { el: elements.carType, key: 'carType' },
    { el: elements.transitType, key: 'transitType' },
    { el: elements.heatingSource, key: 'heatingSource' },
    { el: elements.dietType, key: 'dietType' },
    { el: elements.consumptionStyle, key: 'consumptionStyle' },
    { el: elements.wasteManagement, key: 'wasteManagement' }
  ];

  selects.forEach(select => {
    if (select.el) {
      select.el.addEventListener('change', (e) => {
        stateManager.updateInput(select.key, e.target.value);
        updateHeaderScore();
        
        // Trigger heartbeat pulse animation
        select.el.classList.remove('select-pulse');
        void select.el.offsetWidth; // Force reflow
        select.el.classList.add('select-pulse');
      });

      select.el.addEventListener('animationend', () => {
        select.el.classList.remove('select-pulse');
      });
    }
  });

  // Reset Button
  if (elements.btnReset) {
    elements.btnReset.addEventListener('click', () => {
      stateManager.reset();
      syncInputsToUI();
      updateHeaderScore();
      notifications.show('Assessment Reset', 'All questionnaire inputs have been restored to defaults.', '🔄', 3500);
    });
  }

  // Questionnaire tabs navigation
  elements.tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const oldTab = document.querySelector('.tab-btn.active');
      if (oldTab === btn) return; // Ignore clicking already active tab

      elements.tabButtons.forEach(b => b.classList.remove('active'));
      elements.tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panelId = btn.getAttribute('data-tab');
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');

        // Translate the horizontal slide track
        const track = document.getElementById('tab-track');
        if (track) {
          track.style.transform = `translate3d(-${index * 25}%, 0, 0)`;
        }

        adjustTabContentHeight(panel);
        
        // Custom gooey active background indicator slime slide
        moveIndicator(oldTab, btn);
      }
    });
  });
}

function updateHeaderScore() {
  const stats = stateManager.getStats();
  if (elements.headerFootprint) {
    animateNumber(elements.headerFootprint, stats.netTotal, 550, 2);
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

// Start page setup
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
