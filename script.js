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

let words = []; // Words list

// Game State
let currentLetter = '';
let wordChain = [];
let usedWords = new Set();
let score = 0;
let timeLeft = 60;
let timerInterval = null;
let gameOver = false;

// Minimum word length leveling variables
let minWordLength = 1;  // Start with 1, increase over time
let totalWordsExchanged = 0;

// Load words.txt
fetch('words.txt')
  .then(response => response.text())
  .then(text => {
    words = text
      .split('\n')
      .map(w => w.trim().toUpperCase())
      .filter(Boolean);
    startGame();
  })
  .catch(err => {
    console.error('Failed to load word list:', err);
    showPopup('⚠️ Failed to load words list. Game cannot start.', 5000);
  });

function startGame() {
  wordChain = [];
  usedWords.clear();
  score = 0;
  gameOver = false;
  wordInput.disabled = false;
  submitBtn.disabled = false;
  wordInput.value = '';
  timeLeft = 60;
  minWordLength = 1; // reset minimum word length
  totalWordsExchanged = 0;

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
  if (timeLeft > 40) {
    timerElement.style.color = 'green';
  } else if (timeLeft > 10) {
    timerElement.style.color = 'yellow';
  } else {
    timerElement.style.color = 'red';
  }
}

function getRandomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

// Validate word with minimum length
function isValidWord(word) {
  if (!word.startsWith(currentLetter)) return false;
  if (usedWords.has(word)) return false;
  if (!words.includes(word)) return false;
  if (word.length < minWordLength) return false;
  return true;
}

function updateGame() {
  wordChainElement.innerHTML = wordChain.map((word, index) => {
    const speaker = index % 2 === 0 ? '👤You' : '🤖AI';
    return `<li><b>${speaker}:</b> ${word}</li>`;
  }).join('');
  scoreElement.textContent = score;
  letterElement.textContent = currentLetter;
  updateLastWords();
}

// Show last player and AI words below timer
function updateLastWords() {
  const playerWord = wordChain.length >= 2 ? wordChain[wordChain.length - 2] : 'None';
  const aiWord = wordChain.length >= 1 ? wordChain[wordChain.length - 1] : 'None';

  lastWordsElement.innerHTML = `
    <p>⛓️ : <b>${playerWord}</b>➡️
  ${aiWord}</b></p>
  `;
}

function showPopup(message, duration = 3000) {
  popup.textContent = message;
  popup.style.display = 'block';

  setTimeout(() => {
    popup.style.display = 'none';
  }, duration);
}

function endGame() {
  gameOver = true;
  showPopup("⏱️ Time's up! Game Over 😵", 4000);
  wordInput.disabled = true;
  submitBtn.disabled = true;
}

hintBtn.addEventListener('click', () => {
  showPopup("🧠 Hint system coming soon!");
});

function aiPickWord(startLetter) {
  const candidates = words.filter(w =>
    w.startsWith(startLetter) &&
    !usedWords.has(w) &&
    w.length >= minWordLength
  );
  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function handleSubmission() {
  if (gameOver) {
    showPopup("⛔ Game is over! Hit restart to play again.");
    return;
  }

  const playerWord = wordInput.value.trim().toUpperCase();
  if (!playerWord) return;

  if (!isValidWord(playerWord)) {
    showPopup(`🚫 Invalid! Word must start with "${currentLetter}", be unused, real, and at least ${minWordLength} letters.`);
    wordInput.value = '';
    return;
  }

  // Player's word accepted
  wordChain.push(playerWord);
  usedWords.add(playerWord);
  score++;
  timeLeft += 3; // time reward
  totalWordsExchanged++;
  currentLetter = playerWord.slice(-1);

  // Increase min word length based on total words exchanged
  if (totalWordsExchanged === 20) {
    minWordLength = 4;
    showPopup(`🎉 Minimum word length now set to ${minWordLength}!`);
  } else if (totalWordsExchanged > 20 && totalWordsExchanged % 20 === 0) {
    minWordLength++;
    showPopup(`🎉 Minimum word length increased to ${minWordLength}!`);
  }

  updateGame();
  updateTimerDisplay();
  wordInput.value = '';
  wordInput.focus();

  // AI turn
  const aiWord = aiPickWord(currentLetter);
  if (!aiWord) {
    showPopup("🎉 You Win! AI couldn't find a word.", 5000);
    endGame();
    return;
  }

  setTimeout(() => {
    wordChain.push(aiWord);
    usedWords.add(aiWord);
    totalWordsExchanged++;
    currentLetter = aiWord.slice(-1);

    // Same min length check for AI
    if (totalWordsExchanged === 20) {
      minWordLength = 4;
      showPopup(`🎉 Minimum word length now set to ${minWordLength}!`);
    } else if (totalWordsExchanged > 20 && totalWordsExchanged % 20 === 0) {
      minWordLength++;
      showPopup(`🎉 Minimum word length increased to ${minWordLength}!`);
    }

    updateGame();
    updateTimerDisplay();
  }, 1200);
}

submitBtn.addEventListener('click', handleSubmission);
wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSubmission();
  }
});

restartBtn.addEventListener('click', startGame);
