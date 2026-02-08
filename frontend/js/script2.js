// ==========================
// SETTINGS LOGIC - CONSOLIDATED
// ==========================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('settingsSidebar');
  const toggleBtn = document.getElementById('settingsToggleBtn');
  const muteBtn = document.getElementById('muteBtn');
  const darkModeBtn = document.getElementById('darkModeBtn');

  // ==========================
  // SIDEBAR TOGGLE
  // ==========================
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('open');
    });
  }

  // ==========================
  // LOAD INITIAL STATE FROM STORAGE
  // ==========================
  const savedMute = localStorage.getItem('isMuted') === 'true';
  const savedDarkMode = localStorage.getItem('darkMode') !== 'false'; // default true

  // Initialize mute state
  if (savedMute && muteBtn) {
    muteBtn.setAttribute('aria-pressed', 'true');
    updateMuteIcon();
  }

  // Initialize dark mode state
  if (!savedDarkMode) {
    document.body.classList.add('light-mode');
  }
  if (darkModeBtn) {
    const isDark = !document.body.classList.contains('light-mode');
    darkModeBtn.setAttribute('aria-pressed', isDark);
    updateDarkModeIcon();
  }

  // ==========================
  // MUTE TOGGLE
  // ==========================
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = localStorage.getItem('isMuted') === 'true';
      localStorage.setItem('isMuted', !isMuted);
      updateMuteIcon();
      muteBtn.setAttribute('aria-pressed', !isMuted);
      console.log(!isMuted ? 'Sound muted' : 'Sound unmuted');
    });
  }

  // ==========================
  // DARK MODE TOGGLE
  // ==========================
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('light-mode');
      document.body.classList.toggle('light-mode', isDark);
      localStorage.setItem('darkMode', !isDark);
      updateDarkModeIcon();
      darkModeBtn.setAttribute('aria-pressed', !isDark);
    });
  }

  // ==========================
  // HELPER FUNCTIONS
  // ==========================
  function updateMuteIcon() {
    if (!muteBtn) return;
    const isMuted = localStorage.getItem('isMuted') === 'true';
    const icon = muteBtn.querySelector('i');
    const text = muteBtn.querySelector('span');
    if (icon) {
      if (isMuted) {
        icon.classList.remove('ph-speaker-simple-high');
        icon.classList.add('ph-speaker-slash');
      } else {
        icon.classList.remove('ph-speaker-slash');
        icon.classList.add('ph-speaker-simple-high');
      }
    }
    if (text) {
      text.textContent = isMuted ? 'Unmute' : 'Mute';
    }
  }

  function updateDarkModeIcon() {
    if (!darkModeBtn) return;
    const isDark = !document.body.classList.contains('light-mode');
    const icon = darkModeBtn.querySelector('i');
    const text = darkModeBtn.querySelector('span');
    if (icon) {
      if (isDark) {
        icon.classList.remove('ph-sun');
        icon.classList.add('ph-moon');
      } else {
        icon.classList.remove('ph-moon');
        icon.classList.add('ph-sun');
      }
    }
    if (text) {
      text.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }
  }
});

