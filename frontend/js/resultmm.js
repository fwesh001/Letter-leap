// ==========================================
// MULTIPLAYER RESULTS PAGE LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  populateMultiplayerResults();
});

function populateMultiplayerResults() {
  const resultsRaw = localStorage.getItem('gameResults');
  if (!resultsRaw) {
    console.warn('[MP Results] No gameResults in localStorage');
    if (window.showToast) {
      window.showToast('No match data found. Returning to lobby.', 'penalty');
    }
    window.location.href = 'mm.html';
    return;
  }

  const results = JSON.parse(resultsRaw);
  const { winner, reason, scores = {}, wordChain = [], usernames = {}, incorrect = {}, extraStats = {} } = results;

  const playerIds = Object.keys(scores);
  const byPlayerWords = (id) => wordChain
    .filter((e) => e && e.playerId === id && e.word)
    .map((e) => e.word);

  const longestWord = (words) => words.reduce((a, b) => (b && b.length > (a?.length || 0) ? b : a), '');
  const accuracy = (id) => {
    const correct = byPlayerWords(id).length;
    const total = correct + (incorrect?.[id] || 0);
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  };

  const players = playerIds
    .map((id) => {
      const name = usernames[id] || 'Player';
      const words = byPlayerWords(id);
      const es = extraStats[id] || {};
      return {
        id,
        name,
        score: scores[id] || 0,
        totalWords: words.length,
        accuracyPct: accuracy(id),
        longest: longestWord(words),
        maxStreak: es.maxStreak || 0,
        longWords: es.longWords || 0,
        rareLetters: es.rareLetters || 0,
        achievements: es.achievements || 0,
        errors: incorrect?.[id] || 0
      };
    })
    .sort((a, b) => b.score - a.score);

  // Winner announcement
  const winnerEl = document.getElementById('winner-announcement');
  if (winnerEl) {
    winnerEl.textContent = `🏆 ${escapeHtml(winner || 'Winner')} Wins!`;
  }
  const reasonEl = document.getElementById('winner-reason');
  if (reasonEl) {
    reasonEl.textContent = reason || 'Match finished';
  }

  // Head-to-Head
  const h2hGrid = document.getElementById('comparison-grid');
  if (h2hGrid && players.length >= 1) {
    h2hGrid.innerHTML = '';
    const p1 = players[0];
    const p2 = players[1] || null;

    const card1 = document.createElement('div');
    card1.className = 'h2h-card winner';
    card1.innerHTML = `
      <div class="medal-badge"><i class="ph-fill ph-medal" style="color: #ffd700;"></i> 1st</div>
      <h4>${escapeHtml(p1.name)}</h4>
      <div class="stat-row"><span class="stat-label">Score</span><span class="stat-value">${p1.score}</span></div>
      <div class="stat-row"><span class="stat-label">Words</span><span class="stat-value">${p1.totalWords}</span></div>
      <div class="stat-row"><span class="stat-label">Accuracy</span><span class="stat-value">${p1.accuracyPct}%</span></div>
      <div class="stat-row"><span class="stat-label">Longest</span><span class="stat-value">${escapeHtml(p1.longest || '—')}</span></div>
    `;
    h2hGrid.appendChild(card1);

    const vs = document.createElement('div');
    vs.className = 'vs-divider';
    vs.textContent = 'VS';
    h2hGrid.appendChild(vs);

    if (p2) {
      const card2 = document.createElement('div');
      card2.className = 'h2h-card';
      card2.innerHTML = `
        <div class="medal-badge"><i class="ph-fill ph-medal" style="color: #c0c0c0;"></i> 2nd</div>
        <h4>${escapeHtml(p2.name)}</h4>
        <div class="stat-row"><span class="stat-label">Score</span><span class="stat-value">${p2.score}</span></div>
        <div class="stat-row"><span class="stat-label">Words</span><span class="stat-value">${p2.totalWords}</span></div>
        <div class="stat-row"><span class="stat-label">Accuracy</span><span class="stat-value">${p2.accuracyPct}%</span></div>
        <div class="stat-row"><span class="stat-label">Longest</span><span class="stat-value">${escapeHtml(p2.longest || '—')}</span></div>
      `;
      h2hGrid.appendChild(card2);
    }
  }

  // Leaderboard
  const leaderboardList = document.getElementById('leaderboard-list');
  if (leaderboardList) {
    leaderboardList.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉'];
    players.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      row.innerHTML = `
        <div class="rank"><span class="medal">${medals[idx] || (idx + 1)}</span></div>
        <div class="player-info">
          <div class="player-name">${escapeHtml(p.name)}</div>
          <div class="player-meta"><span>${p.totalWords} words</span> • <span>${p.accuracyPct}% accuracy</span></div>
        </div>
        <div class="player-score">${p.score}</div>
      `;
      leaderboardList.appendChild(row);
    });
  }

  // Word chain replay
  const replayContainer = document.getElementById('word-chain-container');
  if (replayContainer) {
    replayContainer.innerHTML = '';
    if (wordChain.length > 0) {
      wordChain.forEach((entry, idx) => {
        const word = typeof entry === 'string' ? entry : entry.word;
        const playerName = typeof entry === 'string' ? 'Player' : (usernames[entry.playerId] || 'Player');
        const card = document.createElement('div');
        card.className = 'word-replay-card';
        card.innerHTML = `
          <div class="word-number">${idx + 1}</div>
          <div class="word-text">${escapeHtml(word || '')}</div>
          <div class="word-player" style="color: var(--primary-color); font-size: 0.8rem;">${escapeHtml(playerName)}</div>
        `;
        replayContainer.appendChild(card);
      });
    } else {
      replayContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No words played.</p>';
    }
  }

  // Badges
  const badgeContainer = document.getElementById('badge-list');
  if (badgeContainer) {
    badgeContainer.innerHTML = '';

    const addBadge = (icon, title, desc, color) => {
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '0.5rem';
      badge.style.padding = '0.75rem 1.25rem';
      badge.style.background = 'rgba(255,255,255,0.05)';
      badge.style.border = `2px solid ${color}`;
      badge.style.borderRadius = '20px';
      badge.style.color = color;
      badge.style.fontWeight = 'bold';
      badge.style.marginRight = '0.75rem';
      badge.style.marginBottom = '0.75rem';
      badge.title = desc;
      badge.innerHTML = `<i class="ph-fill ${icon}"></i> ${title}`;
      badgeContainer.appendChild(badge);
    };

    let hasBadges = false;

    if (players.length > 0) {
      addBadge('ph-trophy', 'Top Scorer', `${players[0].name} scored ${players[0].score} pts`, '#ffd700');
      hasBadges = true;
    }

    if (wordChain.length > 0) {
      const longestEntry = wordChain.reduce((best, current) =>
        (current.word || '').length > (best.word || '').length ? current : best, { word: '' }
      );
      if ((longestEntry.word || '').length >= 8) {
        const playerName = usernames[longestEntry.playerId] || 'Player';
        addBadge('ph-book-open', 'Dictionary Expert', `${playerName} played "${longestEntry.word}"`, '#9b59b6');
        hasBadges = true;
      }
    }

    const accuracyWinner = players.reduce((best, current) =>
      (current.accuracyPct > (best?.accuracyPct || 0)) ? current : best
    , null);
    if (accuracyWinner && accuracyWinner.accuracyPct >= 90) {
      addBadge('ph-crosshair', 'Accuracy Master', `${accuracyWinner.name} achieved ${accuracyWinner.accuracyPct}% accuracy`, '#2ecc71');
      hasBadges = true;
    }

    const streakWinner = players.reduce((best, current) =>
      (current.maxStreak > (best?.maxStreak || 0)) ? current : best
    , null);
    if (streakWinner && streakWinner.maxStreak >= 5) {
      addBadge('ph-keyboard', 'Iron Fingers', `${streakWinner.name} had a ${streakWinner.maxStreak}-word streak`, '#3498db');
      hasBadges = true;
    }

    const fastestPlayer = players.reduce((best, current) =>
      (current.totalWords > (best?.totalWords || 0)) ? current : best
    , null);
    if (fastestPlayer && fastestPlayer.totalWords >= 15) {
      addBadge('ph-lightning', 'Fastest Fingers', `${fastestPlayer.name} played ${fastestPlayer.totalWords} words`, '#e74c3c');
      hasBadges = true;
    }

    const rareRegex = /[qxzwvy]/i;
    const rareCounts = {};
    wordChain.forEach((entry) => {
      if (entry && entry.word && rareRegex.test(entry.word)) {
        const pid = entry.playerId;
        rareCounts[pid] = (rareCounts[pid] || 0) + 1;
      }
    });
    let maxRare = 0;
    let rarePlayerId = null;
    Object.entries(rareCounts).forEach(([pid, count]) => {
      if (count > maxRare) {
        maxRare = count;
        rarePlayerId = pid;
      }
    });
    if (maxRare >= 3) {
      const name = usernames[rarePlayerId] || 'Player';
      addBadge('ph-skull', 'Trap Master', `${name} used ${maxRare} rare-letter words`, '#ff7675');
      hasBadges = true;
    }

    if (!hasBadges) {
      badgeContainer.innerHTML = '<p style="color: var(--text-secondary);">No special achievements this match.</p>';
    }
  }

  // Competitive breakdown
  const statsBreakdown = document.getElementById('stats-breakdown');
  if (statsBreakdown) {
    statsBreakdown.innerHTML = '';
    const p1 = players[0];
    const p2 = players[1];

    const statRow = (label, p1Val, p2Val) => {
      const row = document.createElement('div');
      row.className = 'stat-comparison-row';
      row.innerHTML = `
        <span class="stat-label">${label}</span>
        <span class="p1-value">${p1Val}</span>
        <span class="divider">:</span>
        ${p2 ? `<span class="p2-value">${p2Val}</span>` : '<span class="p2-value">—</span>'}
      `;
      statsBreakdown.appendChild(row);
    };

    if (p1) {
      statRow('Total Words', p1.totalWords, p2?.totalWords || '—');
      statRow('Accuracy', `${p1.accuracyPct}%`, p2 ? `${p2.accuracyPct}%` : '—');
      statRow('Errors', p1.errors, p2?.errors || '—');
      statRow('Max Streak', p1.maxStreak, p2?.maxStreak || '—');
      statRow('Long Words', p1.longWords, p2?.longWords || '—');
      statRow('Rare Letters', p1.rareLetters, p2?.rareLetters || '—');
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
