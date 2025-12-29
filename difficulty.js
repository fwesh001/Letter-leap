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
      '🕒 Time Limit: 60 seconds',
      '🔤 Minimum Words: 2',
      '⏳ Bonus Time per Word: +15 seconds',
      '💡 Tips: None',
      '🏅 Achievement Unlock Tip: Type 5+ correct words to unlock “Word Rookie” badge',
    ],
    flavorText: '“For fun.”',
    url: 'sm.html'
  },
  normal: {
    title: 'Level Normal: Word Warrior',
    descriptionList: [
      '🕒 Time Limit: 40 seconds',
      '🔤 Minimum Words: 3',
      '⏳ Bonus Time per Word: +10 seconds',
      '💡 Tips: None',
      '🏅 Achievement Unlock Tip: Type 12+ correct words to earn “Keyboard Samurai” badge',
    ],
    flavorText: '“Focus up, it\'s getting real now! Precision is key.”',
    url: 'sm-normal.html'
  },
  hard: {
    title: 'Level Hard: Word Expert',
    descriptionList: [
      '🕒 Time Limit: 30 seconds',
      '🔤 Minimum Words: 5',
      '⏳ Bonus Time per Word: +5 seconds',
      '💡 Tips: None',
      '🏅 Achievement Unlock Tip: Type 12+ correct words to earn “Keyboard Warrior” badge',
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
