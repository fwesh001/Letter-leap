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

  // Alphabet groups of 4 letters each (last group has 2 letters)
  const letterGroups = [
    ['A','H','O','U'],
    ['B','I','P','V'],
    ['C','J','Q','W'],
    ['D','K','R','X'],
    ['E','L','S','Y'],
    ['F','M','T','Z'],
    ['G','N']
  ];

  letterGroups.forEach(group => {
    const col = document.createElement('div');
    col.className = 'column';

    group.forEach(letter => {
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

      // Add a little gap between letters
      const spacer = document.createElement('div');
      spacer.style.height = '30px';
      col.appendChild(spacer);
    });

    container.appendChild(col);
  });
}

loadWords();
