import stateManager, { escapeHTML } from './state.js';
import { getLevelInfo } from './habits.js';
import notifications from './notifications.js';
import { initWallpaper } from './wallpaper.js';
import { animateNumber } from './animations.js';
import { initCustomCursor } from './cursor.js';
import { loginWithGoogle, logout, isFirebaseConfigured } from './firebase.js';

// DOM Elements
const elements = {
  headerFootprint: document.getElementById('header-footprint-value'),
  profileAvatar: document.getElementById('profile-page-avatar'),
  profileName: document.getElementById('profile-page-name'),
  profileEmail: document.getElementById('profile-page-email'),
  
  // XP Card
  xpUserTitle: document.getElementById('xp-user-title'),
  xpLevelNum: document.getElementById('xp-level-num'),
  xpCurrentVal: document.getElementById('xp-current-val'),
  xpNeededVal: document.getElementById('xp-needed-val'),
  xpFillProgress: document.getElementById('xp-fill-progress'),
  
  // Sync details
  syncBox: document.getElementById('settings-sync-box'),
  syncStatusHeader: document.getElementById('sync-status-header'),
  syncStatusDesc: document.getElementById('sync-status-desc'),
  
  // Buttons
  btnExport: document.getElementById('btn-profile-export'),
  btnReset: document.getElementById('btn-profile-reset'),
  authHeaderContainer: document.getElementById('auth-header-container'),
  btnChangeAvatar: document.getElementById('btn-change-avatar'),
  uploadInput: document.getElementById('profile-upload-input'),
  profileNameInput: document.getElementById('profile-name-input'),
  btnEditName: document.getElementById('btn-edit-name')
};

let currentLevel = 1;

// ==========================================================================
// Init Controller
// ==========================================================================
function init() {
  initCustomCursor();
  initWallpaper();
  setupAuthHeader();
  setupEventListeners();
  updateProfileUI();

  // Listen to cloud updates
  stateManager.subscribeToDataChanges(() => {
    updateProfileUI();
  });

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

  // Dismiss loading screen after 1.5 seconds
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('fade-out');
      loader.addEventListener('transitionend', () => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      });
    }
  }, 1500);
}

function setupEventListeners() {
  // Export Data Action
  if (elements.btnExport) {
    elements.btnExport.addEventListener('click', () => {
      elements.btnExport.classList.remove('button-jiggle');
      void elements.btnExport.offsetWidth;
      elements.btnExport.classList.add('button-jiggle');

      try {
        const backupData = {
          app: "Sylva Carbon Footprint Tracker",
          version: "0.1.0",
          exportedAt: new Date().toISOString(),
          user: stateManager.currentUser ? {
            uid: stateManager.currentUser.uid,
            displayName: stateManager.currentUser.displayName,
            email: stateManager.currentUser.email
          } : "local_demo_user",
          state: {
            inputs: stateManager.inputs,
            adoptedHabits: stateManager.adoptedHabits,
            chatLogs: stateManager.chatLogs
          }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `sylva_profile_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        notifications.show('Backup Downloaded', 'Your profile backup has been saved successfully.', '💾', 3000);
      } catch (err) {
        console.error('Export failed:', err);
        notifications.show('Export Failed', 'Unable to generate export backup file.', '❌', 3000);
      }
    });

    elements.btnExport.addEventListener('animationend', () => {
      elements.btnExport.classList.remove('button-jiggle');
    });
  }

  // Reset Progress Action
  if (elements.btnReset) {
    elements.btnReset.addEventListener('click', () => {
      elements.btnReset.classList.remove('button-jiggle');
      void elements.btnReset.offsetWidth;
      elements.btnReset.classList.add('button-jiggle');

      const confirmed = confirm("Are you absolutely sure you want to wipe all account progress? This will delete all inputs, checklist habits, and Gaia Coach logs from the browser and database forever.");
      if (confirmed) {
        stateManager.reset();
        notifications.show('Account Wiped', 'All questionnaire data, adopted habits, and coach logs have been deleted.', '🔄', 3500);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    });

    elements.btnReset.addEventListener('animationend', () => {
      elements.btnReset.classList.remove('button-jiggle');
    });
  }

  // Change Profile Photo Action
  if (elements.btnChangeAvatar && elements.uploadInput) {
    elements.btnChangeAvatar.addEventListener('click', () => {
      elements.uploadInput.click();
    });

    elements.uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        resizeAndSaveAvatar(file);
      }
    });
  }

  // Edit Profile Name Action
  if (elements.btnEditName && elements.profileNameInput && elements.profileName) {
    const startEditing = () => {
      elements.profileName.style.display = 'none';
      elements.btnEditName.style.display = 'none';
      elements.profileNameInput.style.display = 'inline-block';
      elements.profileNameInput.value = stateManager.customName || (stateManager.currentUser ? stateManager.currentUser.displayName : 'Forest Protector');
      elements.profileNameInput.focus();
      elements.profileNameInput.select();
    };

    const finishEditing = (saveChanges) => {
      if (saveChanges) {
        const value = elements.profileNameInput.value.trim();
        if (value && value !== (stateManager.customName || (stateManager.currentUser ? stateManager.currentUser.displayName : 'Forest Protector'))) {
          stateManager.customName = value;
          stateManager.save();
          notifications.show('Name Updated', 'Your profile name has been updated and synced.', '📝', 3000);
        }
      }
      elements.profileNameInput.style.display = 'none';
      elements.profileName.style.display = 'inline-block';
      elements.btnEditName.style.display = 'inline-block';
    };

    elements.btnEditName.addEventListener('click', startEditing);
    elements.profileName.addEventListener('dblclick', startEditing);

    elements.profileNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEditing(true);
      } else if (e.key === 'Escape') {
        finishEditing(false);
      }
    });

    elements.profileNameInput.addEventListener('blur', () => {
      finishEditing(true);
    });
  }
}

function resizeAndSaveAvatar(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 150;
      canvas.width = size;
      canvas.height = size;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      stateManager.customAvatar = compressedDataUrl;
      stateManager.save();
      notifications.show('Photo Updated', 'Your profile picture has been updated and synced.', '📸', 3000);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function updateProfileUI() {
  const stats = stateManager.getStats();
  const netTotal = stats.netTotal;
  const savings = stats.savings;

  // Header Footprint Score
  if (elements.headerFootprint) {
    animateNumber(elements.headerFootprint, netTotal, 500, 2);
  }

  // XP Progress Card
  const levelInfo = getLevelInfo(savings.xp);
  if (elements.xpUserTitle) elements.xpUserTitle.textContent = levelInfo.title;
  if (elements.xpLevelNum) elements.xpLevelNum.textContent = levelInfo.level;
  if (elements.xpCurrentVal) animateNumber(elements.xpCurrentVal, levelInfo.xpInCurrentLevel, 500, 0);
  if (elements.xpNeededVal) animateNumber(elements.xpNeededVal, levelInfo.xpRequiredForNext, 500, 0);
  if (elements.xpFillProgress) elements.xpFillProgress.style.width = `${levelInfo.progressPercent}%`;

  if (levelInfo.level > currentLevel) {
    currentLevel = levelInfo.level;
    notifications.show('Level Up!', `Congratulations! You reached Level ${levelInfo.level} — ${levelInfo.title}!`, '🏆', 5000);
  } else if (levelInfo.level < currentLevel) {
    currentLevel = levelInfo.level;
  }
}

function setupAuthHeader() {
  const container = elements.authHeaderContainer;
  if (!container) return;

  const renderHeader = (user, isInitialized) => {
    if (!user) {
      // User is logged out: profile page is restricted. Redirect to home only if auth has resolved.
      if (isInitialized) {
        window.location.href = 'index.html';
      }
      return;
    }

    // Populate profile details
    if (elements.profileAvatar) elements.profileAvatar.src = stateManager.customAvatar || user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (elements.profileName) elements.profileName.textContent = stateManager.customName || user.displayName || 'Forest Protector';
    if (elements.profileEmail) elements.profileEmail.textContent = user.email || '';

    // Render Sync Banner status
    const isDemo = !isFirebaseConfigured;
    if (elements.syncBox) {
      elements.syncBox.className = `settings-sync-box ${isDemo ? 'demo' : 'connected'}`;
    }
    if (elements.syncStatusHeader) {
      elements.syncStatusHeader.textContent = isDemo ? 'Running in Local Demo Mode' : 'Cloud Sync Connected';
    }
    if (elements.syncStatusDesc) {
      elements.syncStatusDesc.textContent = isDemo
        ? 'Firebase is unconfigured. Your progress is simulated locally and backed up inside the browser cache.'
        : 'All changes are synchronized in real-time to your Cloud Firestore profile document.';
    }

    // Render header badge (same as other pages)
    container.innerHTML = '';
    const badge = document.createElement('div');
    badge.className = 'auth-user-badge';
    
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
        <a href="profile.html" class="auth-dropdown-link active">
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

    badge.addEventListener('click', (e) => {
      if (e.target.closest('.auth-dropdown-btn') || e.target.closest('.auth-dropdown-link')) return;
      badge.classList.toggle('active');
      e.stopPropagation();
    });

    container.appendChild(badge);

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
  };

  stateManager.subscribeToAuthChanges((user, isInitialized) => {
    renderHeader(user, isInitialized);
  });

  stateManager.subscribeToDataChanges(() => {
    renderHeader(stateManager.currentUser, stateManager.authInitialized);
  });

  document.addEventListener('click', () => {
    const activeBadge = document.querySelector('.auth-user-badge.active');
    if (activeBadge) {
      activeBadge.classList.remove('active');
    }
  });
}

// Start setup
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
