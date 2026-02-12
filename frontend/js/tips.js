// ==========================
// GLOBAL VARIABLES & CONSTANTS
// ==========================
let allGroupedWords = {};   // Stores words grouped by first letter
let wordOffsets = {};       // Tracks pagination offset for each letter
const wordsPerPage = 5;     // Number of words to show per letter column

// Flashcard State
let currentLetter = '';
let currentWordIndex = 0;

// ==========================
// LOAD & GROUP WORDS FUNCTION
// ==========================
/**
 * Loads words from 'words.txt', groups them by first letter, and initializes offsets.
 */
async function loadWords() {
  try {
    const response = await fetch('../data/words.txt');
    const text = await response.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Group words by first letter (uppercase)
    const grouped = {};
    lines.forEach(word => {
      const letter = word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(word.trim());
    });

    allGroupedWords = grouped;

    // Initialize offsets for each letter
    wordOffsets = {};
    Object.keys(allGroupedWords).forEach(letter => {
      wordOffsets[letter] = 0;
    });

    renderGroupedColumns(allGroupedWords, wordOffsets);
  } catch (err) {
    console.error('Error loading words:', err);
    document.getElementById('wordListContainer').textContent = 'Failed to load words.';
  }
}

// ==========================
// RENDERING FUNCTION (LIST)
// ==========================
/**
 * Renders columns of words grouped by letter, paginated by offset.
 */
function renderGroupedColumns(groupedWords, offsets) {
  const container = document.getElementById('wordListContainer');
  container.innerHTML = '';

  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    const col = document.createElement('div');
    col.className = 'column';

    const header = document.createElement('div');
    header.className = 'letter-header';
    header.textContent = letter;
    header.style.cursor = 'pointer'; // Make it look clickable
    header.title = `Train with "${letter}" words`;
    header.onclick = () => openFlashcardModal(letter);
    col.appendChild(header);

    const words = groupedWords[letter] || [];
    const offset = offsets && offsets[letter] ? offsets[letter] : 0;

    if (words.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'word';
      emptyMsg.style.fontSize = '0.8rem';
      emptyMsg.style.opacity = '0.5';
      emptyMsg.textContent = 'None';
      col.appendChild(emptyMsg);
    } else {
      for (let j = 0; j < wordsPerPage; j++) {
        const idx = (offset + j) % words.length;
        const w = document.createElement('div');
        w.className = 'word';
        w.textContent = words[idx];
        w.onclick = () => {
          openFlashcardModal(letter);
          currentWordIndex = idx;
          renderCurrentCard();
        };
        col.appendChild(w);
      }
    }

    container.appendChild(col);
  }
}

// ==========================
// FLASHCARD MODAL LOGIC
// ==========================
const modal = document.getElementById('flashcardModal');
const wordDisplay = document.getElementById('wordDisplay');
const wordStats = document.getElementById('wordStats');
const cardProgress = document.getElementById('cardProgress');
const flashcard = document.getElementById('flashcard');

function openFlashcardModal(letter) {
  currentLetter = letter;
  currentWordIndex = 0;

  const words = allGroupedWords[letter] || [];

  if (words.length === 0) {
    showEmptyState();
  } else {
    renderCurrentCard();
  }

  modal.classList.add('active');
  modal.ariaHidden = "false";
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function showEmptyState() {
  wordDisplay.textContent = "No secrets here... yet!";
  wordDisplay.style.fontSize = "1.5rem";
  wordStats.innerHTML = '';
  cardProgress.textContent = "0 / 0";
  document.getElementById('copyBtn').style.display = 'none';
}

function renderCurrentCard(direction = '') {
  const words = allGroupedWords[currentLetter] || [];
  const word = words[currentWordIndex];

  document.getElementById('copyBtn').style.display = 'flex';
  wordDisplay.textContent = word;
  wordDisplay.style.fontSize = word.length > 10 ? "2.5rem" : "3.5rem";

  // Progress
  cardProgress.textContent = `${currentWordIndex + 1} / ${words.length}`;

  // Stats Badges
  wordStats.innerHTML = '';

  // Length Badge
  const lengthBadge = document.createElement('span');
  lengthBadge.className = 'badge';
  lengthBadge.textContent = `${word.length} Letters`;
  wordStats.appendChild(lengthBadge);

  // Score Badge (Mock logic: Rare letters Z, Q, J, X give "High Score")
  const rareLetters = /[ZQJX]/i;
  if (rareLetters.test(word)) {
    const scoreBadge = document.createElement('span');
    scoreBadge.className = 'badge';
    scoreBadge.style.borderColor = '#ffd700';
    scoreBadge.style.color = '#ffd700';
    scoreBadge.textContent = 'High Score';
    wordStats.appendChild(scoreBadge);
  }

  // Animation
  flashcard.classList.remove('animate-next', 'animate-prev');
  void flashcard.offsetWidth; // Trigger reflow
  if (direction === 'next') flashcard.classList.add('animate-next');
  if (direction === 'prev') flashcard.classList.add('animate-prev');
}

function nextCard() {
  const words = allGroupedWords[currentLetter] || [];
  if (words.length === 0) return;
  currentWordIndex = (currentWordIndex + 1) % words.length;
  renderCurrentCard('next');
}

function prevCard() {
  const words = allGroupedWords[currentLetter] || [];
  if (words.length === 0) return;
  currentWordIndex = (currentWordIndex - 1 + words.length) % words.length;
  renderCurrentCard('prev');
}

function closeFlashcardModal() {
  modal.classList.remove('active');
  modal.ariaHidden = "true";
  document.body.style.overflow = '';
}

// ==========================
// EVENT LISTENERS
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // Original refresh logic
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      Object.keys(allGroupedWords).forEach(letter => {
        const len = allGroupedWords[letter].length;
        if (len > 0) {
          wordOffsets[letter] = (wordOffsets[letter] + wordsPerPage) % len;
        }
      });
      renderGroupedColumns(allGroupedWords, wordOffsets);
    });
  }

  // Modal navigation
  document.getElementById('nextBtn').onclick = nextCard;
  document.getElementById('prevBtn').onclick = prevCard;
  document.getElementById('closeModal').onclick = closeFlashcardModal;

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target.classList.contains('flashcard-modal-overlay')) closeFlashcardModal();
  };

  // Copy to clipboard
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.onclick = () => {
    const word = wordDisplay.textContent;
    navigator.clipboard.writeText(word).then(() => {
      const icon = copyBtn.querySelector('i');
      icon.className = 'ph ph-check';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        icon.className = 'ph ph-copy';
        copyBtn.classList.remove('copied');
      }, 1000);
    });
  };

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    if (e.key === 'ArrowRight') nextCard();
    if (e.key === 'ArrowLeft') prevCard();
    if (e.key === 'Escape') closeFlashcardModal();
  });
});

// ==========================
// INITIAL LOAD
// ==========================
loadWords();
