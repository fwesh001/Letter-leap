// =======================
// DIFFICULTY CONFIGURATION
// =======================
const DIFFICULTY_CONFIG = {
  easy: {
    timeLimit: 60,
    minWordLength: 2,
    bonusTime: 10
  },
  medium: {
    timeLimit: 40,
    minWordLength: 3,
    bonusTime: 5
  },
  hard: {
    timeLimit: 30,
    minWordLength: 4,
    bonusTime: 5
  }
};

// Get difficulty from localStorage (default to 'easy')
const gameDifficulty = localStorage.getItem('gameDifficulty') || 'easy';
const difficultySettings = DIFFICULTY_CONFIG[gameDifficulty] || DIFFICULTY_CONFIG.easy;

// =======================
// DOM ELEMENTS
// =======================
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

// =======================
// GAME STATE VARIABLES
// =======================
let words = [];
let currentLetter = '';
let wordChain = [];
let usedWords = new Set();
let score = 0;
let timeLeft = difficultySettings.timeLimit;
let totalTimeSpent = difficultySettings.timeLimit;
let timerInterval = null;
let gameOver = false;
let minWordLength = difficultySettings.minWordLength;
let totalWordsExchanged = 0;
let playerAttempts = 0;
let incorrectWordsCount = 0;
let achievements = [];
let lastTimeWarning = null;

// =======================
// WORD LIST FETCH
// =======================
fetch('../data/words.txt')
  .then(res => res.text())
  .then(text => {
    words = text.split('\n').map(w => w.trim().toUpperCase()).filter(Boolean);
    startGame();
  })
  .catch(err => {
    console.error('Failed to load word list:', err);
    showPopup('Failed to load words list. Game cannot start.', 5000, 'penalty');
  });

// =======================
// 🔊 SOUND FX
// =======================
function playClickSound() {
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

// =======================
// 🟢 GAME INIT + RESTART
// =======================
function startGame() {
  document.querySelector('.game-container').style.display = 'block';
  document.getElementById('game-over-screen').classList.add('hidden');

  wordChain = [];
  usedWords.clear();
  score = 0;
  gameOver = false;
  wordInput.disabled = false;
  submitBtn.disabled = false;
  wordInput.value = '';
  timeLeft = difficultySettings.timeLimit;
  totalTimeSpent = difficultySettings.timeLimit;
  minWordLength = difficultySettings.minWordLength;
  totalWordsExchanged = 0;
  playerAttempts = 0;
  incorrectWordsCount = 0;
  lastTimeWarning = null;

  currentLetter = getRandomLetter();
  letterElement.textContent = currentLetter;
  updateTimerDisplay();
  updateGame();
  updateLastWords();

  showPopup('Game starting! Good luck.', 2000, 'info');

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showPopup('Time is up!', 2000, 'penalty');
      endGame();
    }
  }, 1000);
}

// =======================
// ⏱️ TIMER + DISPLAY
// =======================
function updateTimerDisplay() {
  timerElement.innerHTML = `<i class="ph ph-timer"></i> Time left: ${timeLeft}s`;
  timerElement.style.color = timeLeft > 40 ? 'green' : timeLeft > 10 ? 'yellow' : 'red';

  if ((timeLeft === 10 || timeLeft === 5) && lastTimeWarning !== timeLeft) {
    lastTimeWarning = timeLeft;
    showPopup(`Hurry! ${timeLeft}s left.`, 1500, 'info');
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
}

// =======================
// 🔠 WORD HANDLING
// =======================
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

function aiPickWord(startLetter) {
  const candidates = words.filter(w =>
    w.startsWith(startLetter) &&
    !usedWords.has(w) &&
    w.length >= minWordLength
  );
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

// =======================
// 📈 GAME UPDATE + DISPLAY
// =======================
function updateGame() {
  wordChainElement.innerHTML = wordChain.map((word, i) => {
    const speaker = i % 2 === 0 ? 'You' : 'AI';
    return `<li><b>${speaker}:</b> ${word}</li>`;
  }).join('');
  scoreElement.textContent = score;
  letterElement.textContent = currentLetter;
  updateLastWords();
}

function updateLastWords() {
  const playerWord = wordChain.length >= 2 ? wordChain[wordChain.length - 2] : 'None';
  const aiWord = wordChain.length >= 1 ? wordChain[wordChain.length - 1] : 'None';
  lastWordsElement.innerHTML = `<i class="ph ph-link"></i> <b>${playerWord}</b> <i class="ph ph-arrow-right"></i> <b>${aiWord}</b>`;
}

function showPopup(msg, duration = 2000, type = 'info') {
  popup.textContent = msg;
  popup.style.display = 'block';
  popup.style.backgroundColor = '';

  if (window.showToast) {
    window.showToast(msg, type);
  }

  setTimeout(() => popup.style.display = 'none', duration);
}

function popAchievementBadge(badgeName, duration = 2000) {
  popup.textContent = `Achievement Unlocked: ${badgeName}`;
  popup.style.display = 'block';
  popup.style.backgroundColor = '#FFD700';

  if (window.showToast) {
    window.showToast(`Achievement Unlocked: ${badgeName}`, 'achievement');
  }

  setTimeout(() => {
    popup.style.display = 'none';
    popup.style.backgroundColor = ''; // Reset color after
  }, duration);
}



// =======================
// 🧠 MAIN GAME LOOP
// =======================
function handleSubmission() {
  if (gameOver) {
    showPopup("Game is over! Hit restart to play again.", 2000, 'info');
    return;
  }

  const playerWord = wordInput.value.trim().toUpperCase();
  playerAttempts++;

  if (!playerWord) {
    showPopup("Blank Input - You typed nothing.", 2000, 'penalty');
    wrongSound.currentTime = 0; wrongSound.play();
    incorrectWordsCount++; wordInput.value = ''; return;
  }

  if (usedWords.has(playerWord)) {
    showPopup("Already Used - Try a different word.", 2000, 'penalty');
    wrongSound.currentTime = 0; wrongSound.play();
    incorrectWordsCount++; wordInput.value = ''; return;
  }

  if (playerWord.length < minWordLength) {
    showPopup(`Too Short - Use at least ${minWordLength} letters!`, 2000, 'penalty');
    wrongSound.currentTime = 0; wrongSound.play();
    incorrectWordsCount++; wordInput.value = ''; return;
  }

  if (!playerWord.startsWith(currentLetter)) {
    showPopup(`Wrong Start Letter - Must start with "${currentLetter}"`, 2000, 'penalty');
    wrongSound.currentTime = 0; wrongSound.play();
    incorrectWordsCount++; wordInput.value = ''; return;
  }


  if (!isValidWord(playerWord)) {
    showPopup(`Invalid Word - "${playerWord}" is not in the dictionary.`, 2000, 'penalty');
    wrongSound.currentTime = 0; wrongSound.play();
    incorrectWordsCount++; wordInput.value = ''; return;
  }

  // 🔥 VALID ENTRY
  correctSound.currentTime = 0; correctSound.play();
  wordChain.push(playerWord); usedWords.add(playerWord);
  score++; totalWordsExchanged++;
  currentLetter = playerWord.slice(-1);
  timeLeft += difficultySettings.bonusTime; 
  totalTimeSpent += difficultySettings.bonusTime;
  const gameState = {
    wordChain,
    timeTaken: 3, // 🔧 Replace this later with real time tracking if needed
    lastAIWord: wordChain[wordChain.length - 2] || '',
    lastWord: wordChain[wordChain.length - 3] || '',
    streakWithoutTimerDrop: 0 // 🔧 Optional: implement streak logic if needed
  };

  checkAchievements(playerWord, gameState);


  if (totalWordsExchanged % 10 === 0) {
    minWordLength++;
    showPopup(`Minimum word length increased to ${minWordLength}!`, 2000, 'info');
  }


  if (score === 3) showPopup("Trifecta 🎯");
  if (score === 5) popAchievementBadge("Halfway Hero 🏅");
  if (score === 10) popAchievementBadge("Dictionary expert 🧙");
  if (playerWord.length >= 12) popAchievementBadge("Keyboard Warrior");
  if (score >= 5 && timeLeft < 10) popAchievementBadge("Late Bloomer 🌙");



  updateGame(); updateTimerDisplay();
  wordInput.value = ''; wordInput.focus();

  const thinkingIndicator = document.getElementById('thinking-indicator');
  thinkingIndicator.style.display = 'inline-block';
  letterElement.style.display = 'none';

  setTimeout(() => {
    const aiWord = aiPickWord(currentLetter);
    thinkingIndicator.style.display = 'none';
    letterElement.style.display = 'block';

    if (!aiWord) {
      showPopup("You Win! AI could not find a word.", 2000, 'achievement');
      endGame(); return;
    }

    wordChain.push(aiWord); usedWords.add(aiWord);
    totalWordsExchanged++; currentLetter = aiWord.slice(-1);

    if (totalWordsExchanged % 10 === 0) {
      minWordLength++;
      showPopup(`🎉 Minimum word length now set to ${minWordLength}!`, 2000, 'info');
    }

    updateGame(); updateTimerDisplay();
  }, 3000);
}

// =======================
// 🏆 ACHIEVEMENT CHECKER 
// =======================
function checkAchievements(word, gameState) {
  const achievements = [
    {
      id: "double_trouble",
      name: "Double Trouble",
      emoji: "🅰🅰", // Internal ref, visible emojis are already handled by Phosphor script in HTML if it was injected there, but here it is used in popAchievementBadge.
      // Let''s change these to text or icon class names if we want to be thorough.
      // For now, let''s just use clean text.
      description: "Use a word that has two consecutive identical letters.",
      checkCondition: (word, gameState) => /(.)\1/.test(word),
    },

    {
      id: "vowel_master",
      name: "Vowel Master",
      emoji: "🎤",
      description: "Play a word with at least 4 vowels.",
      checkCondition: (word, gameState) =>
        (word.match(/[aeiou]/gi) || []).length >= 4,
    },
    {
      id: "consonant_crusher",
      name: "Consonant Crusher",
      emoji: "🔨",
      description: "Play a word with 5 or more consonants.",
      checkCondition: (word, gameState) =>
        (word.match(/[^aeiou]/gi) || []).length >= 5,
    },
    {
      id: "quick_thinker",
      name: "Quick Thinker",
      emoji: "🧠💡",
      description:
        "Play 20 words in a row without letting the timer drop below 30 seconds.",
      checkCondition: (word, gameState) =>
        gameState.streakWithoutTimerDrop >= 20,
    },
    {
      id: "rebounder",
      name: "Rebounder",
      emoji: "🔁",
      description:
        "Play a word that starts with the last letter of the AI’s word and is longer.",
      checkCondition: (word, gameState) =>
        gameState.lastAIWord &&
        word[0].toLowerCase() ===
        gameState.lastAIWord.slice(-1).toLowerCase() &&
        word.length > gameState.lastAIWord.length,
    },
    {
      id: "silent_but_deadly",
      name: "Silent but Deadly",
      emoji: "🤫",
      description: "Use a word with no traditional vowels.",
      checkCondition: (word) => !/[aeiou]/i.test(word),
    },
    {
      id: "wildcard",
      name: "Wildcard",
      emoji: "🃏",
      description: "Use a word that contains all 5 vowels.",
      checkCondition: (word) =>
        ["a", "e", "i", "o", "u"].every((v) => word.includes(v)),
    },
    {
      id: "letter_jumper",
      name: "Letter Jumper",
      emoji: "🦘",
      description:
        "Play a word that skips the next alphabetical letter from the previous word's end.",
      checkCondition: (word, gameState) => {
        if (!gameState.lastWord) return false;
        const prevEnd = gameState.lastWord.slice(-1).toLowerCase().charCodeAt(0);
        const nextStart = word[0].toLowerCase().charCodeAt(0);
        return nextStart - prevEnd > 1;
      },
    },
  ];
  achievements.forEach(achievement => {
    if (achievement.checkCondition(word, gameState)) {
      popAchievementBadge(achievement.name);
    }
  });
}

// =======================
// GAME OVER SCREEN
// =======================
function showGameOverScreen() {
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('game-over-screen').classList.remove('hidden');

  const quotes = [
    "Game Over", "Oops! That escalated quickly...",
    "Your vocabulary went on vacation", "Time wins again",
    "That was... something", "You tried your best.",
    "Word on the street is... you need more practice.", "That is not how you spell victory.",
    "Letters were thrown.", "You and the keyboard had a disagreement.",
    "Grammar police are on their way.", "Your brain: 404 - Word Not Found.",
    "Well... that was a journey.", "Let’s pretend that didn’t happen."
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  typewriterEffect(randomQuote, 'game-over-quote');

  document.getElementById('final-score').textContent = score;
  document.getElementById('word-count').textContent = wordChain.length;
  document.getElementById('incorrect-words-count').textContent = incorrectWordsCount;
  document.getElementById('time-spent').textContent = formatTime(totalTimeSpent);
  document.getElementById('accuracy').textContent = Math.round((score / (playerAttempts || 1)) * 100) + '%';

  const list = document.getElementById('word-list');
  list.innerHTML = '';
  wordChain.forEach(w => {
    const li = document.createElement('li');
    li.textContent = w;
    list.appendChild(li);
  });

  if (typeof challenges !== 'undefined' && challenges.length) {
    const challengeText = challenges[Math.floor(Math.random() * challenges.length)];
    document.getElementById('game-over-challenge').textContent = `🎮 Challenge for next round: ${challengeText}`;
  }

  const longestWord = wordChain.reduce((longest, word) =>
    word.length > longest.length ? word : longest, ''
  );
  document.getElementById('longest-word').textContent = longestWord || "None";
}

// =======================
// 💾 SAVE TO LOCAL STORAGE
// =======================
function saveGameResult() {
  const data = {
    score,
    accuracy: Math.round((score / (playerAttempts || 1)) * 100),
    wordsPlayed: [...wordChain],
    longestWord: wordChain.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
    timeSpent: totalTimeSpent,
    incorrectWords: incorrectWordsCount,
    timestamp: new Date().toISOString(),
  };
  const history = JSON.parse(localStorage.getItem('gameHistory')) || [];
  history.push(data);
  localStorage.setItem('gameHistory', JSON.stringify(history));
}

// =======================
// 🧠 END GAME
// =======================
function endGame() {
  gameOver = true;
  wordInput.disabled = true;
  submitBtn.disabled = true;
  gameoverSound.currentTime = 0;
  gameoverSound.play();
  saveGameResult();
  showGameOverScreen();
}

// =======================
// 🤖 EVENT LISTENERS
// =======================
hintBtn.addEventListener('click', () => {
  playClickSound();
  showPopup("🧠 Hint system coming soon!", 2000, 'info');
});

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

if (startBtn) {
  startBtn.addEventListener('click', () => {
    playClickSound();
    startGame();
  });
}

// =======================
// ✍️ TYPEWRITER EFFECT
// =======================
function typewriterEffect(text, targetId) {
  const target = document.getElementById(targetId);
  target.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    target.textContent += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 50);
}
