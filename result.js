// ==========================
// 📊 LOAD GAME HISTORY
// ==========================
const history = JSON.parse(localStorage.getItem('gameHistory')) || [];
const latestResult = history[history.length - 1];

// ==========================
// ⏱️ TIME FORMATTER
// ==========================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================
// 📝 POPULATE RESULT DATA
// ==========================
if (latestResult) {
  // 🎯 Stats
  document.getElementById('total-attempts').textContent = latestResult.wordsPlayed.length || 0;
  document.getElementById('time-spent').textContent = formatTime(latestResult.timeSpent || 0);
  document.getElementById('accuracy').textContent = (latestResult.accuracy || 0) + '%';
  document.getElementById('longest-word').textContent = latestResult.longestWord || '(None)';

  // ❌ Incorrect Words
  document.getElementById('incorrect-count').textContent = `${latestResult.incorrectWords || 0} wrong attempts`;
  document.getElementById('funny-roast').textContent = "“Coming soon”";

  // 🎭 Funny Quote
  document.getElementById('quote-text').textContent = "Coming soon";

  // 📖 Rare Words
  const rareList = document.getElementById('rare-word-list');
  rareList.innerHTML = '<li>Coming soon</li>';

  // ✅ Correct Words
  const correctList = document.getElementById('correct-word-list');
  correctList.innerHTML = '';
  (latestResult.wordsPlayed || []).forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    correctList.appendChild(li);
  });

  // 🏆 Achievements
  const milestoneList = document.getElementById('milestone-list');
  milestoneList.innerHTML = '<li class="achievement-item"><i class="fas fa-spinner"></i> <div>Coming soon</div></li>';

  // 🧩 Badges
  const badgeWrap = document.getElementById('badge-container');
  badgeWrap.innerHTML = '<div class="badge">Coming soon</div>';

  // 💬 AI Coach
  document.getElementById('coach-quote').textContent = "Coming soon";

  // 🎲 Next Challenge
  document.getElementById('challenge-text').textContent = "Coming soon";
}

// ==========================
// 🕹️ PLAY STYLE FEEDBACK
// ==========================
const playStyle = determinePlayStyle(latestResult?.accuracy || 0);
document.getElementById('style-description').textContent = playStyle.title;
document.getElementById('playstyle-feedback').querySelector('p:nth-of-type(2)').textContent = playStyle.message;

/**
 * Determines play style based on accuracy.
 * @param {number} accuracy
 * @returns {{title: string, message: string}}
 */
function determinePlayStyle(accuracy) {
  if (accuracy >= 100) {
    return {
      title: "The Dictionary Expert",
      message: "Even the AI was shocked."
    };
  } else if (accuracy >= 90) {
    return {
      title: "The Precision Ninja",
      message: "You sliced through words with deadly accuracy. No typos, no mercy."
    };
  } else if (accuracy >= 70) {
    return {
      title: "The Balanced Brawler",
      message: "You held your ground well — a nice mix of speed and precision."
    };
  } else if (accuracy >= 40) {
    return {
      title: "The Speedy Typo Tornado",
      message: "You typed like your keyboard was on fire! Speed was your friend, but accuracy took a vacation."
    };
  } else {
    return {
      title: "The Button Masher",
      message: "You typed like you were trying to hack into the Matrix… blindfolded. Pure chaos!"
    };
  }
}