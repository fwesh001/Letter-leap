// Letter Leap — Global UI & Settings logic

// ============================================
// GLOBAL AUDIO MANAGER
// ============================================
const MUTE_STORAGE_KEY = 'letterLeapMuted';
const LEGACY_MUTE_STORAGE_KEY = 'isMuted';

window.audioManager = {
  isMuted: false,
  
  init: function() {
    // Initialize from current key, with fallback migration from legacy key
    const stored = localStorage.getItem(MUTE_STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_MUTE_STORAGE_KEY);

    if (stored === null && legacy !== null) {
      this.isMuted = legacy === 'true';
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.isMuted));
      localStorage.removeItem(LEGACY_MUTE_STORAGE_KEY);
    } else {
      this.isMuted = stored === 'true';
    }
  },
  
  setMuted: function(muted) {
    this.isMuted = Boolean(muted);
    localStorage.setItem(MUTE_STORAGE_KEY, String(this.isMuted));
    localStorage.removeItem(LEGACY_MUTE_STORAGE_KEY);
    if (this.isMuted) {
      this.pauseAllAudio();
    }
  },
  
  toggleMute: function() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  },
  
  shouldPlaySound: function() {
    return !this.isMuted;
  },
  
  pauseAllAudio: function() {
    // Pause all audio elements on the page
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
};

// Initialize audio manager on load
window.audioManager.init();

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENT REFERENCES
  const sidebar = document.getElementById('settingsSidebar');
  const toggleBtn = document.getElementById('settingsToggleBtn');
  const muteButtons = Array.from(document.querySelectorAll('#muteBtn, [data-mute-toggle], .mute-btn'));
  const darkModeBtn = document.getElementById('darkModeBtn');

  // 1. SIDEBAR TOGGLE
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    // Close sidebar if clicking outside
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // 2. MUTE LOGIC
  if (muteButtons.length) {
    // Init UI based on global audio manager
    updateMuteUI(window.audioManager.isMuted);

    muteButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const newMutedState = window.audioManager.toggleMute();
        updateMuteUI(newMutedState);
      });
    });
  }

  function updateMuteUI(muted) {
    if (!muteButtons.length) return;
    muteButtons.forEach((button) => {
      const icon = button.querySelector('i');
      const text = button.querySelector('span');

      if (muted) {
        if (icon) icon.className = 'ph ph-speaker-slash';
        if (text) text.textContent = 'Unmute';
        button.setAttribute('aria-pressed', 'true');
      } else {
        if (icon) icon.className = 'ph ph-speaker-simple-high';
        if (text) text.textContent = 'Mute';
        button.setAttribute('aria-pressed', 'false');
      }
    });
  }

  // 3. DARK MODE LOGIC
  let isDarkMode = localStorage.getItem('darkMode') !== 'false';
  applyTheme(isDarkMode);
  updateDarkModeUI(isDarkMode);

  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      localStorage.setItem('darkMode', isDarkMode);
      applyTheme(isDarkMode);
      updateDarkModeUI(isDarkMode);
    });
  }

  function applyTheme(dark) {
    document.body.classList.toggle('light-mode', !dark);
  }
  function updateDarkModeUI(dark) {
    if (!darkModeBtn) return;
    const icon = darkModeBtn.querySelector('i');
    const text = darkModeBtn.querySelector('span');

        if (dark) {
      if (icon) icon.className = 'ph ph-moon';
      if (text) text.textContent = 'Dark Mode';
      darkModeBtn.setAttribute('aria-pressed', 'true');
    } else {
      if (icon) icon.className = 'ph ph-sun';
      if (text) text.textContent = 'Light Mode';
      darkModeBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // 4. SMALL-SCREEN UI SCALE
  const SMALL_SCREEN_MAX = 412;
  let resizeRaf = null;

  function applySmallScreenScale() {
    if (!document.body) return;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const scale = viewportWidth <= SMALL_SCREEN_MAX ? viewportWidth / SMALL_SCREEN_MAX : 1;

    document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));
    document.body.classList.toggle('is-small-ui', scale < 1);
  }

  function scheduleSmallScreenScale() {
    if (resizeRaf !== null) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = null;
      applySmallScreenScale();
    });
  }

  applySmallScreenScale();
  window.addEventListener('resize', scheduleSmallScreenScale, { passive: true });
  window.addEventListener('orientationchange', scheduleSmallScreenScale);
});
