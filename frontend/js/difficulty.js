// ==========================
// DOM ELEMENT REFERENCES
// ==========================
const popup = document.getElementById('levelInfoPopup');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');
const startBtn = document.getElementById('startLevelBtn');
const closeBtn = document.getElementById('closePopupBtn');

// ==========================
// GLOBAL VARIABLES
// ==========================
let selectedLevelUrl = '';

// ==========================
// LEVELS DATA CONFIGURATION
// ==========================
const levelsData = {
  easy: {
    title: 'Level Easy: Easy Peasy',
    descriptionList: [
      '<i class="ph ph-timer"></i> Time Limit: 60 seconds',
      '<i class="ph ph-text-aa"></i> Minimum Words: 2',
      '<i class="ph ph-plus-circle"></i> Bonus Time per Word: +15 seconds',
      '<i class="ph ph-lightbulb"></i> Tips: None',
      '<i class="ph ph-medal"></i> Achievement: Unlock “Word Rookie” with 5+ words',
    ],
    flavorText: '“For fun.”',
    url: 'sm.html'
  },
  normal: {
    title: 'Level Normal: Word Warrior',
    descriptionList: [
      '<i class="ph ph-timer"></i> Time Limit: 40 seconds',
      '<i class="ph ph-text-aa"></i> Minimum Words: 3',
      '<i class="ph ph-plus-circle"></i> Bonus Time per Word: +10 seconds',
      '<i class="ph ph-lightbulb"></i> Tips: None',
      '<i class="ph ph-medal"></i> Achievement: Unlock “Keyboard Samurai” with 12+ words',
    ],
    flavorText: '“Focus up, it\'s getting real now! Precision is key.”',
    url: 'sm-normal.html'
  },
  hard: {
    title: 'Level Hard: Word Expert',
    descriptionList: [
      '<i class="ph ph-timer"></i> Time Limit: 30 seconds',
      '<i class="ph ph-text-aa"></i> Minimum Words: 5',
      '<i class="ph ph-plus-circle"></i> Bonus Time per Word: +5 seconds',
      '<i class="ph ph-lightbulb"></i> Tips: None',
      '<i class="ph ph-medal"></i> Achievement: Unlock “Keyboard Warrior” with 12+ words',
    ],
    flavorText: '“Type fast. Think faster. No second chances in Word Expert mode!”',
    url: 'sm-hard.html'
  }
};

// ==========================
// POPUP HANDLING FUNCTIONS
// ==========================

/**
 * Displays the popup with the selected level's information.
 * @param {string} levelKey - The key for the selected level ('easy', 'normal', 'hard')
 */
function showPopup(levelKey) {
  const level = levelsData[levelKey];
  popupTitle.textContent = level.title;

  // Build description list and flavor text
  popupDesc.innerHTML = '<ul>' +
    level.descriptionList.map(item => `<li>${item}</li>`).join('') +
    '</ul>' +
    `<blockquote>${level.flavorText}</blockquote>`;

  selectedLevelUrl = level.url;
  popup.classList.add('show');
  popup.classList.remove('hidden');
}

/**
 * Hides the popup.
 */
function hidePopup() {
  popup.classList.remove('show');
  popup.classList.add('hidden');
}

// ==========================
// EVENT LISTENERS
// ==========================

// Difficulty level divs (make sure your HTML has these IDs)
document.getElementById('easyLevel').addEventListener('click', () => showPopup('easy'));
document.getElementById('normalLevel').addEventListener('click', () => showPopup('normal'));
document.getElementById('hardLevel').addEventListener('click', () => showPopup('hard'));

// Start button: navigates to the selected level's URL
startBtn.addEventListener('click', () => {
  window.location.href = selectedLevelUrl;
});

// Close button: hides the popup
closeBtn.addEventListener('click', hidePopup);
