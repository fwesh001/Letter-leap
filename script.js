// DOM Elements
const letterElement = document.getElementById('letter');
const wordInput = document.getElementById('word-input');
const submitBtn = document.getElementById('submit-btn');
const wordChainElement = document.getElementById('word-chain');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const hintBtn = document.getElementById('hint-btn');
const popup = document.getElementById('popup-message');
const lastWordsElement = document.getElementById('last-words');
const startBtn = document.getElementById('start-btn');
const clickSound = document.getElementById('click-sound');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const gameoverSound = document.getElementById('gameover-sound');

let words = []; // Words list

// Game State
let currentLetter = '';
let wordChain = [];
let usedWords = new Set();
let score = 0;
let timeLeft = 60;
let totalTimeSpent = 60;
let timerInterval = null;
let gameOver = false;

let minWordLength = 2;
let totalWordsExchanged = 0;
let playerAttempts = 0;  // <-- NEW: Track total player submissions
let incorrectWordsCount = 0; // Track incorrect attempts

fetch('words.txt')
  .then(res => res.text())
  .then(text => {
    words = text.split('\n').map(w => w.trim().toUpperCase()).filter(Boolean);
    startGame();
  })
  .catch(err => {
    console.error('Failed to load word list:', err);
    showPopup('⚠️ Failed to load words list. Game cannot start.', 5000);
  });

function playClickSound() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

function startGame() {
  // 👇 Fix the screen switching first
  document.querySelector('.game-container').style.display = 'block';
  document.getElementById('game-over-screen').classList.add('hidden');

  wordChain = [];
  usedWords.clear();
  score = 0;
  gameOver = false;
  wordInput.disabled = false;
  submitBtn.disabled = false;
  wordInput.value = '';
  timeLeft = 60;
  totalTimeSpent = 60;
  minWordLength = 2;
  totalWordsExchanged = 0;
  playerAttempts = 0;  // Reset attempts

  currentLetter = getRandomLetter();
  letterElement.textContent = currentLetter;
  updateTimerDisplay();
  updateGame();
  updateLastWords();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerElement.textContent = `⏳ Time left: ${timeLeft}s`;
  timerElement.style.color = timeLeft > 40 ? 'green' : timeLeft > 10 ? 'yellow' : 'red';
}

function getRandomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

function isValidWord(word) {
  return word.startsWith(currentLetter) &&
         !usedWords.has(word) &&
         words.includes(word) &&
         word.length >= minWordLength;
}

function updateGame() {
  wordChainElement.innerHTML = wordChain.map((word, i) => {
    const speaker = i % 2 === 0 ? '👤You' : '🤖AI';
    return `<li><b>${speaker}:</b> ${word}</li>`;
  }).join('');
  scoreElement.textContent = score;
  letterElement.textContent = currentLetter;
  updateLastWords();
}

function updateLastWords() {
  const playerWord = wordChain.length >= 2 ? wordChain[wordChain.length - 2] : 'None';
  const aiWord = wordChain.length >= 1 ? wordChain[wordChain.length - 1] : 'None';

  lastWordsElement.innerHTML = `<p>⛓️ : <b>${playerWord}</b>➡️ ${aiWord}</p>`;
}

function showPopup(msg, duration = 5000) {
  popup.textContent = msg;
  popup.style.display = 'block';
  popup.style.backgroundColor = ''; // reset
  setTimeout(() => popup.style.display = 'none', duration);
}


hintBtn.addEventListener('click', () => {
  playClickSound();
  showPopup("🧠 Hint system coming soon!");
});

function aiPickWord(startLetter) {
  const candidates = words.filter(w =>
    w.startsWith(startLetter) &&
    !usedWords.has(w) &&
    w.length >= minWordLength
  );
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

function handleSubmission() {
  if (gameOver) {
    showPopup("⛔ Game is over! Hit restart to play again.");
    return;
  }

  const playerWord = wordInput.value.trim().toUpperCase();
  playerAttempts++; // Count every player attempt, even invalid ones

  if (!playerWord) {
    showPopup("💤 Blank Input — You typed nothing and expected greatness?");
    wrongSound.currentTime = 0;
    wrongSound.play();
    incorrectWordsCount++;  // Increment incorrect words here
    wordInput.value = '';
    return;
  }

  if (usedWords.has(playerWord)) {
    showPopup("📛 Already Used — Nice try, but we’ve seen that one.");
    wrongSound.currentTime = 0;
    wrongSound.play();
    incorrectWordsCount++;  // Increment here too
    wordInput.value = '';
    return;
  }

  if (playerWord.length < minWordLength) {
    showPopup(`🔤 Too Short — Use at least ${minWordLength} letters! Feed me more letters! 🍔📚💪.`);
    wrongSound.currentTime = 0;
    wrongSound.play();
    incorrectWordsCount++;  // And here
    wordInput.value = '';
    return;
  }

  if (!playerWord.startsWith(currentLetter)) {
    showPopup(`🅰 Wrong Start Letter — Oops! Word must start with ‘${currentLetter}’. Not ‘${playerWord[0]}’.`);
    wrongSound.currentTime = 0;
    wrongSound.play();
    incorrectWordsCount++;  // Yep, here too
    wordInput.value = '';
    return;
  }

  if (!isValidWord(playerWord)) {
    showPopup(`❌ Invalid Word — ‘${playerWord}’? Oga 😭,That’s not even in alien dictionaries`);
    wrongSound.currentTime = 0;
    wrongSound.play();
    incorrectWordsCount++;  // And here
    wordInput.value = '';
    return;
  }

  // Valid word! Increase score, update state, etc.
  correctSound.currentTime = 0;
  correctSound.play();

  wordChain.push(playerWord);
  usedWords.add(playerWord);
  score++;
  totalWordsExchanged++;
  currentLetter = playerWord.slice(-1);
  timeLeft += 5;
  totalTimeSpent += 5;

  if (totalWordsExchanged === 10 || (totalWordsExchanged > 10 && totalWordsExchanged % 10 === 0)) {
    minWordLength++;
    showPopup(`🎉 Minimum word length now set to ${minWordLength}!`);
  }

  if (score === 1) popAchievementBadge("First Blood 🩸");
  if (score === 3) popAchievementBadge("Trifecta 🎯");
  if (score === 5) popAchievementBadge("Halfway Hero 🏅");
  if (score === 10) popAchievementBadge("Word Wizard 🧙");
  if (playerWord.length >= 12) popAchievementBadge("Keyboard Warrior 💪");
  if (score >= 5 && timeLeft < 10) popAchievementBadge("Late Bloomer 🌙");

  updateGame();
  updateTimerDisplay();
  wordInput.value = '';
  wordInput.focus();



  const thinkingIndicator = document.getElementById('thinking-indicator');
thinkingIndicator.style.display = 'inline-block';
letterElement.style.display = 'none'; // Hide current letter

setTimeout(() => {
  const aiWord = aiPickWord(currentLetter);
  thinkingIndicator.style.display = 'none';
  letterElement.style.display = 'block';

  if (!aiWord) {
    showPopup("🎉 You Win! AI couldn't find a word.", 5000);
    endGame();
    return;
  }

  wordChain.push(aiWord);
  usedWords.add(aiWord);
  totalWordsExchanged++;
  currentLetter = aiWord.slice(-1);

  if (totalWordsExchanged === 10 || (totalWordsExchanged > 10 && totalWordsExchanged % 10 === 0)) {
    minWordLength++;
    showPopup(`🎉 Minimum word length now set to ${minWordLength}!`);
  }

  updateGame();
  updateTimerDisplay();
}, 3000); // AI 'thinks' for 3 seconds
}

wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    playClickSound();
    handleSubmission();
  }
});

submitBtn.addEventListener('click', () => {
  playClickSound();
  handleSubmission();
});

restartBtn.addEventListener('click', () => {
  playClickSound();
  startGame();
});

startBtn.addEventListener('click', () => {
  playClickSound();
  startGame();
});

function showGameOverScreen() {
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('game-over-screen').classList.remove('hidden');

  const quotes = [
    "RIP, Brain Cells 💀", "Oops! That escalated quickly...",
    "Your vocabulary went on vacation 🌴", "You vs Time: Time wins again ⏳😵",
    "That was... something 😅", "You tried... and the letters laughed. 😂",
    "Word on the street is... you need more practice.😅", "That's not how you spell 'victory'. 😅",
    "Letters were thrown. No survivors. 💀", "You and the keyboard had a disagreement. 👊⌨️",
    "Grammar police are on their way. 🚨📝", "Your brain: 404 - Word Not Found. 🧠❌",
    "Well... that was a journey. 🛣️", "Let’s pretend that didn’t happen.😅"
  ];
  document.getElementById('game-over-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

  document.getElementById('final-score').textContent = score;
  document.getElementById('word-count').textContent = wordChain.length;
  document.getElementById('incorrect-words-count').textContent = incorrectWordsCount;
  document.getElementById('time-spent').textContent = formatTime(totalTimeSpent);

  // Calculate accuracy based on valid words / total player attempts (not totalWordsExchanged)
  const accuracy = Math.round((score / (playerAttempts || 1)) * 100);
  document.getElementById('accuracy').textContent = accuracy + '%';

  const list = document.getElementById('word-list');
  list.innerHTML = '';
  wordChain.forEach(w => {
    const li = document.createElement('li');
    li.textContent = w;
    list.appendChild(li);
  });

  // Pick a random challenge (make sure 'challenges' array is defined somewhere else in your code)
  if (typeof challenges !== 'undefined' && challenges.length) {
    const challengeText = challenges[Math.floor(Math.random() * challenges.length)];
    const challengeElement = document.getElementById('game-over-challenge');
    challengeElement.textContent = `🎮 Challenge for next round: ${challengeText}`;
  }

  // Show longest word played
  const longestWord = wordChain.reduce((longest, word) =>
    word.length > longest.length ? word : longest, ''
  );
  document.getElementById('longest-word').textContent = longestWord || "None";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
}

function popAchievementBadge(badgeName) {
  const popup = document.getElementById('popup-message');
  popup.textContent = `🏆 Achievement Unlocked: ${badgeName}`;
  popup.style.display = 'block';
  popup.style.backgroundColor = '#FFD700';} // Gold-ish to stand

function endGame() {
  gameOver = true;
  wordInput.disabled = true;
  submitBtn.disabled = true;
  gameoverSound.currentTime = 0;
  gameoverSound.play();
  showGameOverScreen();
}
