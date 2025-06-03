// Elements
const sidebar = document.getElementById('settingsSidebar');
const toggleBtn = document.getElementById('settingsToggleBtn');
const muteBtn = document.getElementById('muteBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const restartBtn = document.getElementById('restartBtn');

// Toggle sidebar open/close
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Mute toggle
let isMuted = false;
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔈 Unmute' : '🔇 Mute';
  muteBtn.setAttribute('aria-pressed', isMuted);
  console.log(isMuted ? 'Sound muted' : 'Sound unmuted');
});

// Dark mode toggle
let isDarkMode = true;
darkModeBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('light-mode', !isDarkMode);
  darkModeBtn.textContent = isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode';
  darkModeBtn.setAttribute('aria-pressed', isDarkMode);
});

// Feedback button placeholder
feedbackBtn.addEventListener('click', () => {
  alert('Thanks for your feedback! (Not implemented yet)');
});

// Restart button placeholder
restartBtn.addEventListener('click', () => {
  alert('Restarting game... (Hook this to your actual game reset)');
});

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('darkModeToggle');
  const prefersDark = localStorage.getItem('darkMode') === 'true';

  if (prefersDark) {
    document.body.classList.add('dark-mode');
    toggle.checked = true;
  }

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    document.body.classList.toggle('dark-mode', enabled);
    localStorage.setItem('darkMode', enabled);
  });
});
