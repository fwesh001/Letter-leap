async function loadWords() {
  try {
    const response = await fetch('words.txt');
    const text = await response.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Group words by first letter uppercase
    const grouped = {};
    lines.forEach(word => {
      const letter = word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      if (grouped[letter].length < 5) {
        grouped[letter].push(word);
      }
    });

    renderGroupedColumns(grouped);
  } catch (err) {
    console.error('Error loading words:', err);
    document.getElementById('wordListContainer').textContent = 'Failed to load words.';
  }
}

function renderGroupedColumns(groupedWords) {
  const container = document.getElementById('wordListContainer');
  container.innerHTML = '';

  // Create columns for each letter A-Z
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i); // 65 is 'A'
    const col = document.createElement('div');
    col.className = 'column';

    const header = document.createElement('div');
    header.className = 'letter-header';
    header.textContent = letter;
    col.appendChild(header);

    const words = groupedWords[letter] || [];
    words.forEach(word => {
      const w = document.createElement('div');
      w.className = 'word';
      w.textContent = word;
      col.appendChild(w);
    });

    container.appendChild(col);
  }
}

loadWords();
