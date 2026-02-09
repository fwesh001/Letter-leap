// Letter Leap — Global UI & Settings logic
document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENT REFERENCES
  const sidebar = document.getElementById('settingsSidebar');
  const toggleBtn = document.getElementById('settingsToggleBtn');
  const muteBtn = document.getElementById('muteBtn');
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
  if (muteBtn) {
    // Initial state from localStorage
    let isMuted = localStorage.getItem('isMuted') === 'true';
    updateMuteUI(isMuted);

    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem('isMuted', isMuted);
      updateMuteUI(isMuted);
    });
  }

  function updateMuteUI(muted) {
    if (!muteBtn) return;
    const icon = muteBtn.querySelector('i');
    const text = muteBtn.querySelector('span');

    if (muted) {
      if (icon) icon.className = 'ph ph-speaker-slash';
      if (text) text.textContent = 'Unmute';
      muteBtn.setAttribute('aria-pressed', 'true');
    } else {
      if (icon) icon.className = 'ph ph-speaker-simple-high';
      if (text) text.textContent = 'Mute';
      muteBtn.setAttribute('aria-pressed', 'false');
    }
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
