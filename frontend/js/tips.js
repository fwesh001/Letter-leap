const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const MAX_WORDS_PER_LETTER = 80;
const COPY_FEEDBACK_MS = 900;

let groupedWords = {};
let activeLetterIndex = 0;
let activeWord = '';

const letterGrid = document.getElementById('letterGrid');
const letterModal = document.getElementById('letterModal');
const activeLetterLabel = document.getElementById('activeLetter');
const letterWordGrid = document.getElementById('letterWordGrid');
const prevLetterBtn = document.getElementById('prevLetterBtn');
const nextLetterBtn = document.getElementById('nextLetterBtn');
const letterModalClose = document.getElementById('letterModalClose');

const wordModal = document.getElementById('wordModal');
const wordModalTitle = document.getElementById('wordModalTitle');
const ttsBtn = document.getElementById('ttsBtn');
const copyWordBtn = document.getElementById('copyWordBtn');
const wordModalBack = document.getElementById('wordModalBack');
const wordCopyFeedback = document.getElementById('wordCopyFeedback');

const refreshBtn = document.getElementById('refreshBtn');

function loadWords() {
  return fetch('/data/words.txt')
    .then((response) => response.text())
    .then((text) => {
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      groupedWords = groupWords(lines);
      renderLetterGrid();
    })
    .catch((err) => {
      console.error('Error loading words:', err);
      if (letterGrid) {
        letterGrid.textContent = 'Failed to load words.';
      }
    });
}

function groupWords(words) {
  const grouped = {};
  words.forEach((word) => {
    const letter = word[0].toUpperCase();
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(word);
  });
  return grouped;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function refreshWords() {
  Object.values(groupedWords).forEach((list) => shuffleArray(list));
  renderLetterGrid();
  if (isModalOpen(letterModal)) {
    renderLetterWords();
  }
}

function renderLetterGrid() {
  if (!letterGrid) return;
  letterGrid.innerHTML = '';

  LETTERS.forEach((letter, index) => {
    const count = (groupedWords[letter] || []).length;
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'letter-tile';
    tile.dataset.index = String(index);
    tile.dataset.letter = letter;
    tile.setAttribute('aria-label', `Letter ${letter}, ${count} words`);
    tile.innerHTML = `${letter}<span class="letter-tile__count">${count}</span>`;
    tile.addEventListener('click', () => openLetterModal(index));
    letterGrid.appendChild(tile);
  });
}

function openLetterModal(index) {
  activeLetterIndex = index;
  updateActiveLetter();
  renderLetterWords();
  openModal(letterModal);
}

function closeLetterModal() {
  closeModal(letterModal);
}

function updateActiveLetter() {
  const letter = LETTERS[activeLetterIndex] || 'A';
  if (activeLetterLabel) {
    activeLetterLabel.textContent = letter;
  }
}

function renderLetterWords() {
  if (!letterWordGrid) return;
  const letter = LETTERS[activeLetterIndex] || 'A';
  const words = groupedWords[letter] || [];
  const visibleWords = words.slice(0, MAX_WORDS_PER_LETTER);

  letterWordGrid.innerHTML = '';

  if (visibleWords.length === 0) {
    letterWordGrid.innerHTML = '<div class="word-row">No words yet.</div>';
    return;
  }

  visibleWords.forEach((word) => {
    const row = document.createElement('div');
    row.className = 'word-row';

    const wordBtn = document.createElement('button');
    wordBtn.type = 'button';
    wordBtn.className = 'word-btn';
    wordBtn.textContent = word;
    wordBtn.addEventListener('click', () => openWordModal(word));

    const achCount = document.createElement('span');
    achCount.className = 'ach-count';
    achCount.textContent = `x${getAchievementCount(word)}`;

    const badge = document.createElement('span');
    badge.className = 'ach-badge';
    badge.innerHTML = '<i class="ph ph-medal"></i>';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('aria-label', `Copy ${word}`);
    copyBtn.innerHTML = '<i class="ph ph-copy"></i>';

    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.textContent = 'Copied';

    copyBtn.addEventListener('click', () => copyWord(word, feedback));

    row.appendChild(wordBtn);
    row.appendChild(achCount);
    row.appendChild(badge);
    row.appendChild(copyBtn);
    row.appendChild(feedback);

    letterWordGrid.appendChild(row);
  });
}

function openWordModal(word) {
  activeWord = word;
  if (wordModalTitle) {
    wordModalTitle.textContent = word;
  }
  closeModal(letterModal);
  openModal(wordModal);
}

function closeWordModal() {
  closeModal(wordModal);
  openModal(letterModal);
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function isModalOpen(modal) {
  return modal && modal.classList.contains('is-open');
}

function copyWord(word, feedbackEl) {
  if (!word) return;
  navigator.clipboard.writeText(word).then(() => {
    if (!feedbackEl) return;
    feedbackEl.classList.add('show');
    clearTimeout(feedbackEl._hideTimer);
    feedbackEl._hideTimer = setTimeout(() => {
      feedbackEl.classList.remove('show');
    }, COPY_FEEDBACK_MS);
  });
}

function speakWord(word) {
  if (!word || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  window.speechSynthesis.speak(utterance);
}

function getAchievementCount(word) {
  const checks = [
    (w) => /(.)\1/.test(w),
    (w) => (w.match(/[aeiou]/gi) || []).length >= 4,
    (w) => (w.match(/[^aeiou]/gi) || []).length >= 5,
    (w) => !/[aeiou]/i.test(w),
    (w) => ['a', 'e', 'i', 'o', 'u'].every((v) => w.toLowerCase().includes(v)),
  ];
  return checks.reduce((count, fn) => count + (fn(word) ? 1 : 0), 0);
}

function shiftLetter(step) {
  activeLetterIndex = (activeLetterIndex + step + LETTERS.length) % LETTERS.length;
  updateActiveLetter();
  renderLetterWords();
}

function handleGridKeydown(event) {
  const target = event.target;
  if (!target || !target.classList.contains('letter-tile')) return;
  const index = Number(target.dataset.index || 0);
  const columns = getGridColumns();

  let nextIndex = index;
  if (event.key === 'ArrowRight') nextIndex = index + 1;
  if (event.key === 'ArrowLeft') nextIndex = index - 1;
  if (event.key === 'ArrowDown') nextIndex = index + columns;
  if (event.key === 'ArrowUp') nextIndex = index - columns;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openLetterModal(index);
    return;
  }

  if (nextIndex !== index) {
    event.preventDefault();
    const next = letterGrid.querySelector(`[data-index="${nextIndex}"]`);
    if (next) next.focus();
  }
}

function getGridColumns() {
  const tile = letterGrid ? letterGrid.querySelector('.letter-tile') : null;
  if (!tile || !letterGrid) return 6;
  const tileWidth = tile.getBoundingClientRect().width || 1;
  return Math.max(1, Math.floor(letterGrid.clientWidth / tileWidth));
}

document.addEventListener('DOMContentLoaded', () => {
  loadWords();

  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshWords);
  }

  if (letterGrid) {
    letterGrid.addEventListener('keydown', handleGridKeydown);
  }

  if (prevLetterBtn) prevLetterBtn.addEventListener('click', () => shiftLetter(-1));
  if (nextLetterBtn) nextLetterBtn.addEventListener('click', () => shiftLetter(1));
  if (letterModalClose) letterModalClose.addEventListener('click', closeLetterModal);

  if (letterModal) {
    letterModal.addEventListener('click', (event) => {
      if (event.target === letterModal) closeLetterModal();
    });
  }

  if (wordModalBack) wordModalBack.addEventListener('click', closeWordModal);
  if (copyWordBtn) copyWordBtn.addEventListener('click', () => copyWord(activeWord, wordCopyFeedback));
  if (ttsBtn) ttsBtn.addEventListener('click', () => speakWord(activeWord));

  if (wordModal) {
    wordModal.addEventListener('click', (event) => {
      if (event.target === wordModal) closeWordModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (isModalOpen(wordModal)) {
        event.preventDefault();
        closeWordModal();
        return;
      }
      if (isModalOpen(letterModal)) {
        event.preventDefault();
        closeLetterModal();
      }
      return;
    }

    if (isModalOpen(letterModal) && !isModalOpen(wordModal)) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        shiftLetter(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        shiftLetter(1);
      }
    }
  });
});
