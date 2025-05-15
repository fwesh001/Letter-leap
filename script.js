// DOM Elements
const letterElement = document.getElementById('letter');
const wordInput = document.getElementById('word-input');
const submitBtn = document.getElementById('submit-btn');
const wordChainElement = document.getElementById('word-chain');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const popup = document.getElementById('popup-message');

let words = []; // The big word list from words.txt

// Game State
let currentLetter = '';
let wordChain = [];
let usedWords = new Set();
let score = 0;
let timeLeft = 60; // 1 minute timer
let timerInterval = null;
let gameOver = false;

// Word length leveling variables
let maxWordLength = Infinity;  // Start with no max length limit
let totalWordsExchanged = 0;   // Count of words from both sides

// Load words from words.txt (one word per line)
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

// Start Game
function startGame() {
  wordChain = [];
  usedWords.clear();
  score = 0;
  gameOver = false;
  wordInput.disabled = false;
  submitBtn.disabled = false;
  wordInput.value = '';
  timeLeft = 60;
  maxWordLength = Infinity; // reset max length limit
  totalWordsExchanged = 0;

  currentLetter = getRandomLetter();
  letterElement.textContent = currentLetter;
  updateTimerDisplay();
  updateGame();

  clearInterval(timerInterval); // Clear old timer if restarting
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Update Timer UI
function updateTimerDisplay() {
  timerElement.textContent = `Time left: ${timeLeft}s`;
  timerElement.style.color = timeLeft <= 10 ? 'red' : 'black';
}

// Generate a random letter
function getRandomLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

// Validate word: must start with currentLetter, not used before, exist in words list,
// and obey maxWordLength only if limit is finite
function isValidWord(word) {
  if (!word.startsWith(currentLetter)) return false;
  if (usedWords.has(word)) return false;
  if (!words.includes(word)) return false;
  if (maxWordLength !== Infinity && word.length > maxWordLength) return false;
  return true;
}

// Update the game UI
function updateGame() {
  wordChainElement.innerHTML = wordChain.map((word, index) => {
    const speaker = index % 2 === 0 ? 'You' : 'AI';  // Player starts first
    return `<li><b>${speaker}:</b> ${word}</li>`;
  }).join('');
  scoreElement.textContent = score;
  letterElement.textContent = currentLetter;
}

// Show popup message
function showPopup(message, duration = 3000) {
  popup.textContent = message;
  popup.style.display = 'block';

  setTimeout(() => {
    popup.style.display = 'none';
  }, duration);
}

// End game
function endGame() {
  gameOver = true;
  showPopup("⏱️ Time's up! Game Over 😵", 4000);
  wordInput.disabled = true;
  submitBtn.disabled = true;
}

// AI picks a valid word starting with given letter and not used before,
// obeying maxWordLength if finite
function aiPickWord(startLetter) {
  const candidates = words.filter(w =>
    w.startsWith(startLetter) &&
    !usedWords.has(w) &&
    (maxWordLength === Infinity || w.length <= maxWordLength)
  );

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Handle player submission
function handleSubmission() {
  if (gameOver) {
    showPopup("⛔ Game is over! Hit restart to play again.");
    return;
  }

  const playerWord = wordInput.value.trim().toUpperCase();
  if (!playerWord) return; // ignore empty input

  if (!isValidWord(playerWord)) {
    showPopup(`🚫 Invalid! Word must start with "${currentLetter}", be unused, real, and max length ${maxWordLength === Infinity ? '∞' : maxWordLength}.`);
    wordInput.value = '';
    return;
  }

  // Player's valid word
  wordChain.push(playerWord);
  usedWords.add(playerWord);
  score++;
  timeLeft += 3; // reward extra time for correct word
  totalWordsExchanged++;
  currentLetter = playerWord.slice(-1);

  // Check if maxWordLength should be enforced or increased
  if (totalWordsExchanged === 20) {
    maxWordLength = 4;
    showPopup(`🎉 Max word length now set to ${maxWordLength}!`);
  } else if (totalWordsExchanged > 20 && totalWordsExchanged % 20 === 0) {
    maxWordLength++;
    showPopup(`🎉 Max word length increased to ${maxWordLength}!`);
  }

  updateGame();
  updateTimerDisplay();
  wordInput.value = '';
  wordInput.focus();

  // AI's turn
  const aiWord = aiPickWord(currentLetter);
  if (!aiWord) {
    showPopup("🎉 You Win! AI couldn't find a word.", 5000);
    endGame();
    return;
  }

  setTimeout(() => {
    wordChain.push(aiWord);
    usedWords.add(aiWord);
    score++;
    timeLeft += 3; // AI reward time too
    totalWordsExchanged++;
    currentLetter = aiWord.slice(-1);

    // Same max length check for AI
    if (totalWordsExchanged === 20) {
      maxWordLength = 4;
      showPopup(`🎉 Max word length now set to ${maxWordLength}!`);
    } else if (totalWordsExchanged > 20 && totalWordsExchanged % 20 === 0) {
      maxWordLength++;
      showPopup(`🎉 Max word length increased to ${maxWordLength}!`);
    }

    updateGame();
    updateTimerDisplay();
  }, 1200);
}

// Event listeners
submitBtn.addEventListener('click', handleSubmission);
wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSubmission();
  }
});

restartBtn.addEventListener('click', startGame);
