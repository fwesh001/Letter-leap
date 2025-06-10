// ==========================
// GLOBAL VARIABLES & CONSTANTS
// ==========================
let allGroupedWords = {};   // Stores words grouped by first letter
let wordOffsets = {};       // Tracks pagination offset for each letter
const wordsPerPage = 5;     // Number of words to show per letter column

// ==========================
// LOAD & GROUP WORDS FUNCTION
// ==========================
/**
 * Loads words from 'words.txt', groups them by first letter, and initializes offsets.
 */
async function loadWords() {
  try {
    const response = await fetch('words.txt');
    const text = await response.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Group words by first letter (uppercase)
    const grouped = {};
    lines.forEach(word => {
      const letter = word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(word);
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
// RENDERING FUNCTION
// ==========================
/**
 * Renders columns of words grouped by letter, paginated by offset.
 * @param {Object} groupedWords - Words grouped by letter
 * @param {Object} offsets - Current offset for each letter
 */
function renderGroupedColumns(groupedWords, offsets) {
  const container = document.getElementById('wordListContainer');
  container.innerHTML = '';

  // Create columns for each letter A-Z
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i); // 65 is 'A'
    const col = document.createElement('div');
    col.className = 'column';

    // Letter header
    const header = document.createElement('div');
    header.className = 'letter-header';
    header.textContent = letter;
    col.appendChild(header);

    // Words for this letter, paginated
    const words = groupedWords[letter] || [];
    const offset = offsets && offsets[letter] ? offsets[letter] : 0;
    for (let j = 0; j < wordsPerPage; j++) {
      if (words.length === 0) break;
      const idx = (offset + j) % words.length;
      const w = document.createElement('div');
      w.className = 'word';
      w.textContent = words[idx];
      col.appendChild(w);
    }

    container.appendChild(col);
  }
}

// ==========================
// REFRESH BUTTON LOGIC
// ==========================
/**
 * Advances the offset for each letter and re-renders the columns.
 */
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // Advance offset for each letter
      Object.keys(allGroupedWords).forEach(letter => {
        const len = allGroupedWords[letter].length;
        if (len > 0) {
          wordOffsets[letter] = (wordOffsets[letter] + wordsPerPage) % len;
        }
      });
      renderGroupedColumns(allGroupedWords, wordOffsets);
    });
  }
});

// ==========================
// INITIAL LOAD
// ==========================
loadWords();
