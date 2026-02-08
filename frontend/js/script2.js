// ==========================
// DOM ELEMENT REFERENCES
// ==========================
const sidebar = document.getElementById('settingsSidebar');
const toggleBtn = document.getElementById('settingsToggleBtn');
const muteBtn = document.getElementById('muteBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const restartBtn = document.getElementById('restartBtn');

// ==========================
// SIDEBAR TOGGLE
// ==========================
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ==========================
// MUTE TOGGLE
// ==========================
let isMuted = false;
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.innerHTML = isMuted ? '<i class="ph ph-speaker-high"></i> Unmute' : '<i class="ph ph-speaker-slash"></i> Mute';
  muteBtn.setAttribute('aria-pressed', isMuted);
  console.log(isMuted ? 'Sound muted' : 'Sound unmuted');
  localStorage.setItem('isMuted', isMuted); // Save preference
});

// ==========================
// DARK MODE TOGGLE BUTTON 
// ==========================
let isDarkMode = true;
darkModeBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('light-mode', !isDarkMode);
  darkModeBtn.innerHTML = isDarkMode ? '<i class="ph ph-moon"></i> Dark Mode' : '<i class="ph ph-sun"></i> Light Mode';
  darkModeBtn.setAttribute('aria-pressed', isDarkMode);
});

// ==========================
// RESTART BUTTON PLACEHOLDER
// ==========================
restartBtn.addEventListener('click', () => {
  alert('Restarting game...');
});

// ==========================
// DARK MODE TOGGLE SWITCH (Checkbox)
// ==========================
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

// ==========================
// LOAD/SAVE MUTE PREFERENCE
// ==========================
window.addEventListener('DOMContentLoaded', () => {
  const savedMute = localStorage.getItem('isMuted') === 'true';
  isMuted = savedMute;
  toggleMute(isMuted);
  const muteToggle = document.getElementById('muteToggle');
  if (muteToggle) muteToggle.innerHTML = isMuted ? '<i class="ph ph-speaker-slash"></i>' : '<i class="ph ph-speaker-high"></i>';
});

// ==========================
// MUTE HELPER FUNCTION
// ==========================
function toggleMute(mute) {
  // Implement mute logic
}

