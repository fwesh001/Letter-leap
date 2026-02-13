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
// FLASHCARD MODAL LOGIC (WORD EXPERIMENTS)
// ==========================
const modal = document.getElementById('flashcardModal');
const wordList = document.getElementById('wordExperimentList');
const currentLetterDisplay = document.getElementById('currentLetterDisplay');

const experimentIcons = [
  { icon: 'ph-star', color: 'icon-rare', tag: 'Rare Letters' },
  { icon: 'ph-dna', color: 'icon-dna', tag: 'Long Word' },
  { icon: 'ph-shield', color: 'icon-shield', tag: '5+ Consonants' },
  { icon: 'ph-drop', color: 'icon-vowel', tag: 'Many Vowels' },
  { icon: 'ph-fire', color: 'icon-fire', tag: 'Hot Word' }
];

function openFlashcardModal(letter) {
  currentLetter = letter;
  currentLetterDisplay.textContent = letter;

  renderWordExperiments();

  modal.classList.add('active');
  modal.ariaHidden = "false";
  document.body.style.overflow = 'hidden';
}

function renderWordExperiments() {
  const words = allGroupedWords[currentLetter] || [];
  wordList.innerHTML = '';

  if (words.length === 0) {
    wordList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #8a9bb8; padding: 40px;">No secrets here... yet!</div>';
    return;
  }

  // Limit to some words for the preview feel in the image, or show all with scroll
  words.forEach((word, index) => {
    const item = document.createElement('div');
    item.className = 'experiment-item';

    // Randomize icon/tag for variety like in the image
    const config = experimentIcons[index % experimentIcons.length];

    item.innerHTML = `
            <i class="ph ${config.icon} experiment-icon ${config.color}"></i>
            <span class="experiment-word">${word}</span>
            <span class="experiment-tag">${config.tag}</span>
        `;

    item.onclick = () => {
      navigator.clipboard.writeText(word);
      // Optional: add a tiny visual feedback here
      const wordSpan = item.querySelector('.experiment-word');
      const originalText = wordSpan.textContent;
      wordSpan.textContent = 'Copied!';
      wordSpan.style.color = '#4CAF50';
      setTimeout(() => {
        wordSpan.textContent = originalText;
        wordSpan.style.color = '#fff';
      }, 800);
    };

    wordList.appendChild(item);
  });
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

  document.getElementById('closeModal').onclick = closeFlashcardModal;

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target.classList.contains('flashcard-modal-overlay')) closeFlashcardModal();
  };

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeFlashcardModal();
  });
});

// ==========================
// INITIAL LOAD
// ==========================
loadWords();
