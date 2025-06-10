const popup = document.getElementById('levelInfoPopup');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');
const startBtn = document.getElementById('startLevelBtn');
const closeBtn = document.getElementById('closePopupBtn');

let selectedLevelUrl = '';

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

function showPopup(levelKey) {
  const level = levelsData[levelKey];
  popupTitle.textContent = level.title;

  // Build list with emojis as list items
  popupDesc.innerHTML = '<ul>' + level.descriptionList.map(item => `<li>${item}</li>`).join('') + '</ul>' +
                        `<blockquote>${level.flavorText}</blockquote>`;

  selectedLevelUrl = level.url;
  popup.classList.add('show');
  popup.classList.remove('hidden');
}

function hidePopup() {
  popup.classList.remove('show');
  popup.classList.add('hidden');
}

// Difficulty level divs (make sure your difficulty divs have these IDs)
document.getElementById('easyLevel').addEventListener('click', () => showPopup('easy'));
document.getElementById('normalLevel').addEventListener('click', () => showPopup('normal'));
document.getElementById('hardLevel').addEventListener('click', () => showPopup('hard'));

startBtn.addEventListener('click', () => {
  window.location.href = selectedLevelUrl;
});

closeBtn.addEventListener('click', hidePopup);
