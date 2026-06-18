import stateManager, { escapeHTML } from './state.js';
import { getLevelInfo } from './habits.js';
import { analyzeUserContext, getAssistantResponse } from './assistant.js';
import notifications from './notifications.js';
import { initWallpaper } from './wallpaper.js';
import { animateNumber } from './animations.js';
import { initCustomCursor } from './cursor.js';
import { loginWithGoogle, logout, isFirebaseConfigured } from './firebase.js';

// ==========================================================================
// DOM Elements
// ==========================================================================
const elements = {
  headerFootprint: document.getElementById('header-footprint-value'),
  chatLogContainer: document.getElementById('chat-log-container'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  quickChipsContainer: document.getElementById('quick-chips-container'),
  insightsAlert: document.getElementById('assistant-insights-alert'),
  insightsAlertText: document.getElementById('assistant-alert-text'),
  
  // XP profile items repeating
  xpUserTitle: document.getElementById('xp-user-title'),
  xpLevelNum: document.getElementById('xp-level-num'),
  xpCurrentVal: document.getElementById('xp-current-val'),
  xpNeededVal: document.getElementById('xp-needed-val'),
  xpFillProgress: document.getElementById('xp-fill-progress')
};

// Internal track for level up check
let currentLevel = 1;

// ==========================================================================
// Init Controller
// ==========================================================================
function init() {
  initCustomCursor();
  initWallpaper();
  setupAuthHeader();
  setupEventListeners();
  renderChat();
  updateRightColumn();

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
    renderChat();
    updateRightColumn();
  });

  // Load level comparison reference
  const stats = stateManager.getStats();
  const initialLevelInfo = getLevelInfo(stats.savings.xp);
  currentLevel = initialLevelInfo.level;

  // Process potential query parameter presets (e.g. redirected from dashboard legend click)
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (query) {
    // Clear parameter from URL bar silently
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(() => {
      submitUserChatMessage(`How can I reduce my ${query} emissions?`);
    }, 150);
  }

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
  // Submit Form
  if (elements.chatForm) {
    elements.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = elements.chatInput.value.trim();
      if (!message) return;

      submitUserChatMessage(message);
      elements.chatInput.value = '';
    });
  }

  // Quick prompt chips click
  if (elements.quickChipsContainer) {
    elements.quickChipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip-btn');
      if (chip) {
        const query = chip.getAttribute('data-query');
        submitUserChatMessage(query);
      }
    });
  }
}

function renderChat() {
  if (!elements.chatLogContainer) return;
  elements.chatLogContainer.innerHTML = '';

  stateManager.chatLogs.forEach(log => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${log.sender}`;
    
    let content = '';
    if (log.title) {
      content += `<div class="msg-title">${escapeHTML(log.title)}</div>`;
    }
    if (log.sender === 'user') {
      content += `<div>${escapeHTML(log.text)}</div>`;
    } else {
      content += `<div>${log.text}</div>`;
    }
    bubble.innerHTML = content;
    
    elements.chatLogContainer.appendChild(bubble);
  });

  // Auto scroll to bottom
  elements.chatLogContainer.scrollTop = elements.chatLogContainer.scrollHeight;
}

function updateRightColumn() {
  const stats = stateManager.getStats();
  const netTotal = stats.netTotal;
  const netSectors = stats.netSectors;
  const savings = stats.savings;

  // 1. Update Header Net Score with animations
  if (elements.headerFootprint) animateNumber(elements.headerFootprint, netTotal, 550, 2);

  // 2. Render Context-aware Insights
  const insights = analyzeUserContext({ sectors: netSectors, total: netTotal }, stateManager.adoptedHabits);
  
  if (elements.insightsAlert) {
    elements.insightsAlert.className = `assistant-insight-box alert-${insights.alertClass}`;
  }
  
  if (elements.insightsAlertText) {
    let alertsHtml = `<p><strong>Analysis:</strong> ${insights.statusText}</p>`;
    if (insights.insights.length > 0) {
      alertsHtml += '<ul class="insight-bullets" style="margin-top:8px; padding-left: 14px;">';
      insights.insights.forEach(item => {
        alertsHtml += `<li style="margin-bottom:4px;">${item.message}</li>`;
      });
      alertsHtml += '</ul>';
    }
    elements.insightsAlertText.innerHTML = alertsHtml;
  }

  // 3. Render XP Levels with animations
  const levelInfo = getLevelInfo(savings.xp);
  if (elements.xpUserTitle) elements.xpUserTitle.textContent = levelInfo.title;
  if (elements.xpLevelNum) elements.xpLevelNum.textContent = levelInfo.level;
  if (elements.xpCurrentVal) animateNumber(elements.xpCurrentVal, levelInfo.xpInCurrentLevel, 550, 0);
  if (elements.xpNeededVal) animateNumber(elements.xpNeededVal, levelInfo.xpRequiredForNext, 550, 0);
  if (elements.xpFillProgress) elements.xpFillProgress.style.width = `${levelInfo.progressPercent}%`;

  // Award Level-up praises
  if (levelInfo.level > currentLevel) {
    currentLevel = levelInfo.level;
    addBotResponse('Level Up!', `Incredible job! You have reached <strong>Level ${levelInfo.level}</strong> and earned the rank of <strong>${levelInfo.title}</strong>! Keep up the sustainable actions!`);
    notifications.show('Level Up!', `Congratulations! You reached Level ${levelInfo.level} — ${levelInfo.title}!`, '🏆', 5000);
  } else if (levelInfo.level < currentLevel) {
    currentLevel = levelInfo.level;
  }
}

function submitUserChatMessage(text) {
  // 1. Append User message
  stateManager.addChatMessage('user', null, text);
  renderChat();

  // 2. Append Loading bubble with bouncing dots typing-indicator
  const loader = document.createElement('div');
  loader.className = 'chat-bubble bot loader-bubble';
  loader.innerHTML = `
    <div class="typing-indicator" aria-label="Gaia is typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  elements.chatLogContainer.appendChild(loader);
  elements.chatLogContainer.scrollTop = elements.chatLogContainer.scrollHeight;

  // 3. Process reply delay
  setTimeout(() => {
    // Remove loader
    if (loader.parentNode) loader.parentNode.removeChild(loader);

    const stats = stateManager.getStats();
    const net = { sectors: stats.netSectors, total: stats.netTotal };

    const reply = getAssistantResponse(text, net);
    stateManager.addChatMessage('bot', reply.title, reply.text);
    renderChat();
    
    updateRightColumn();
  }, 400);
}

function addBotResponse(title, text) {
  stateManager.addChatMessage('bot', title, text);
  renderChat();
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
