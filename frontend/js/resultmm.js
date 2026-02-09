// Dynamic results renderer for up to 6 players 
(function () {
  try {
    const resultsRaw = localStorage.getItem('gameResults');
    if (!resultsRaw) {
      console.warn('[results] No gameResults in localStorage; redirecting');
      window.location.href = 'mm.html';
      return;
    }

    const results = JSON.parse(resultsRaw);
    const { winner, reason, scores = {}, wordChain = [], usernames = {}, incorrect = {}, extraStats = {} } = results;

    // Winner & reason
    const winnerEl = document.getElementById('winner-announcement');
    if (winnerEl) {
      const reasonText = reason || 'Match finished';
      winnerEl.innerHTML = `<i class="ph ph-crown" style="color: var(--accent-color);"></i> <strong>${escapeHtml(winner || 'Winner')}</strong> wins! Reason: ${escapeHtml(reasonText)}`;
    }

    // Compute per-player stats
    const playerIds = Object.keys(scores);
    const byPlayerWords = (id) => wordChain.filter((e) => e.playerId === id).map((e) => e.word);
    const longestWord = (words) => words.reduce((a, b) => (b && b.length > (a?.length || 0) ? b : a), '');
    const accuracy = (id) => {
      const correct = byPlayerWords(id).length;
      const total = correct + (incorrect?.[id] || 0);
      if (!total) return '0%';
      return `${Math.round((correct / total) * 100)}%`;
    };

    // Sort by score desc
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
          accuracy: accuracy(id),
          longest: longestWord(words),
          maxStreak: es.maxStreak || 0,
          longWords: es.longWords || 0,
          rareLetters: es.rareLetters || 0,
          achievements: es.achievements || 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Render players
    const container = document.getElementById('players-container');
    if (container) {
      container.innerHTML = '';
      players.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
          <h3>${escapeHtml(p.name)} ${idx === 0 ? '<i class="ph ph-medal" style="color: #ffd700;"></i>' : idx === 1 ? '<i class="ph ph-medal" style="color: #c0c0c0;"></i>' : idx === 2 ? '<i class="ph ph-medal" style="color: #cd7f32;"></i>' : ''}</h3>
          <ul>
            <li>Score: <span>${p.score}</span></li>
            <li>Total Words: <span>${p.totalWords}</span></li>
            <li>Accuracy: <span>${p.accuracy}</span></li>
            <li>Longest Word: <span>"${escapeHtml(p.longest || '')}"</span></li>
            <li>Max Streak: <span>${p.maxStreak}</span></li>
            <li>Long Words: <span>${p.longWords}</span></li>
            <li>Rare Letters: <span>${p.rareLetters}</span></li>
            <li>Achievements: <span>${p.achievements}</span></li>
          </ul>
        `;
        container.appendChild(card);
      });
    } else {
      console.warn('[results] #players-container not found');
    }

    // Word chain recap
    const list = document.getElementById('word-chain-list');
    if (list) {
      list.innerHTML = '';
      wordChain.forEach((entry) => {
        const li = document.createElement('li');
        const name = usernames[entry.playerId] || 'Player';
        li.innerHTML = `<strong>${escapeHtml(name)}:</strong> ${escapeHtml(entry.word)}`;
        list.appendChild(li);
      });
    }

    // Sleek competitive dynamic badges
    const badgeList = document.getElementById('badge-list');
    if (badgeList) {
      badgeList.innerHTML = '';

      const addBadge = (icon, title, desc) => {
        const card = document.createElement('div');
        card.className = 'badge-card';
        card.innerHTML = `
          <div class="icon">${icon}</div>
          <div class="details">
            <div class="title">${escapeHtml(title)}</div>
            <div class="desc">${escapeHtml(desc)}</div>
          </div>
        `;
        badgeList.appendChild(card);
      };

      if (players.length) {
        addBadge('<i class="ph ph-trophy"></i>', 'Top Scorer', `${players[0].name} scored ${players[0].score} pts`);
      }

      // Dictionary Expert - longest word played
      if (wordChain.length) {
        const longestEntry = wordChain.reduce((best, current) =>
          current.word.length > (best.word?.length || 0) ? current : best
        );
        if (longestEntry && longestEntry.word) {
          const playerName = usernames[longestEntry.playerId] || 'Player';
          addBadge('<i class="ph ph-book"></i>', 'Dictionary Expert', `${playerName} played "${longestEntry.word}" (${longestEntry.word.length} letters)`);
        }
      }

      // Accuracy Master - highest accuracy percentage
      if (players.length) {
        const accuracyWinner = players.reduce((best, current) => {
          const bestAcc = parseFloat(best.accuracy) || 0;
          const currentAcc = parseFloat(current.accuracy) || 0;
          return currentAcc > bestAcc ? current : best;
        });
        addBadge('<i class="ph ph-crown"></i>', 'Accuracy Master', `${accuracyWinner.name} achieved ${accuracyWinner.accuracy} accuracy`);
      }

      // Iron Fingers - longest streak without messing up
      if (players.length) {
        const streakWinner = players.reduce((best, current) =>
          current.maxStreak > best.maxStreak ? current : best
        );
        if (streakWinner.maxStreak > 0) {
          addBadge('<i class="ph ph-keyboard"></i>', 'Iron Fingers', `${streakWinner.name} had a ${streakWinner.maxStreak}-word streak`);
        }
      }

      // Fastest Fingers - player with highest totalWords count
      if (players.length) {
        const fastestPlayer = players.reduce((best, current) =>
          current.totalWords > best.totalWords ? current : best
        );
        if (fastestPlayer.totalWords > 0) {
          addBadge('<i class="ph ph-lightning"></i>', 'Fastest Fingers', `${fastestPlayer.name} played ${fastestPlayer.totalWords} words`);
        }
      }

      // Trap Master - player with most rare-letter words
      if (players.length && wordChain.length) {
        const rareRegex = /[qxzwvy]/i;
        const rareCounts = {};

        // Count rare-letter words per player
        wordChain.forEach((entry) => {
          if (rareRegex.test(entry.word)) {
            const playerName = usernames[entry.playerId] || 'Player';
            rareCounts[playerName] = (rareCounts[playerName] || 0) + 1;
          }
        });

        // Find player with most rare words
        const rareEntries = Object.entries(rareCounts);
        if (rareEntries.length > 0) {
          const trapMaster = rareEntries.reduce((best, current) =>
            current[1] > best[1] ? current : best
          );
          addBadge('<i class="ph ph-ghost"></i>', 'Trap Master', `${trapMaster[0]} used ${trapMaster[1]} rare-letter words`);
        }
      }
    }

    // Dynamic funny quote & coach roast with randomization
    (function renderCommentary() {
      const quoteEl = document.getElementById('funny-quote');
      const coachEl = document.getElementById('coach-quote');
      if (!players || players.length === 0 || (!quoteEl && !coachEl)) return;
      const p = players[0];

      const acc = parseFloat(p.accuracy) || 0;
      const lw = (p.longest || '');
      const lwLen = lw.length;

      // helper
      function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      // Build highlight (funny quote)
      let highlightOptions = [];

      if (p.maxStreak >= 8) {
        highlightOptions = [
          `went full combo—${p.maxStreak} streak, no brakes`,
          `turned the keyboard into a speedrun controller (${p.maxStreak} streak)`,
          `comboed so hard even the dictionary asked for mercy (${p.maxStreak} streak)`
        ];
      } else if (lwLen >= 10) {
        highlightOptions = [
          `dropped "${lw}" like a final boss (${lwLen} letters)`,
          `casually flexed "${lw}"—longer than most essays`,
          `"${lw}" is basically a whole password at this point`
        ];
      } else if (acc >= 90) {
        highlightOptions = [
          `ran aimbot spelling with ${p.accuracy}% accuracy`,
          `${p.accuracy}% accuracy — pure laser beam typing`,
          `flawless aim, dictionary speedrun unlocked (${p.accuracy}%)`
        ];
      } else if (p.rareLetters >= 3) {
        highlightOptions = [
          `farmed rare letters like loot—${p.rareLetters} times`,
          `casually flexed Qs and Zs like they were vowels`,
          `turned the rare letters into common ones (${p.rareLetters} finds)`
        ];
      } else {
        highlightOptions = [
          `cranked ${p.totalWords} words for ${p.score} pts`,
          `typed ${p.totalWords} words and walked away with ${p.score} points`,
          `${p.totalWords} words, ${p.score} pts — pure grindset`
        ];
      }

      // add lead comparison if multiplayer
      let leadText = '';
      if (players.length > 1) {
        const lead = p.score - players[1].score;
        if (lead >= 20) leadText = ' by a mile';
        else if (lead >= 10) leadText = ' with breathing room';
        else if (lead <= 2) leadText = '…barely survived that one';
      }

      const funny = `Clip it: ${p.name} ${pick(highlightOptions)}${leadText}.`;

      // Build roast (coach)
      let roastOptions = [];

      if (acc < 60) {
        roastOptions = [
          `Alphabet soup accuracy at ${p.accuracy}%. Try aiming at letters, not vibes.`,
          `${p.accuracy}% accuracy? Bro typed with elbows.`,
          `Accuracy ${p.accuracy}% — RNG carried harder than skill.`
        ];
      } else if (p.maxStreak <= 2 && p.totalWords >= 5) {
        roastOptions = [
          `Streak ${p.maxStreak}? Tutorial boss just parried you.`,
          `Couldn’t even chain words — ${p.maxStreak} streak max.`,
          `Consistency.exe not found (streak capped at ${p.maxStreak}).`
        ];
      } else if (lwLen && lwLen <= 4) {
        roastOptions = [
          `Longest word under 5 letters? Dictionaries fear you… for the wrong reasons.`,
          `Tiny words only? Even toddlers are judging you.`,
          `"${lw}" as longest word? That’s just lazy.`
        ];
      } else if (p.rareLetters === 0) {
        roastOptions = [
          `Zero Qs or Zs? Stop dodging side quests.`,
          `Didn’t touch rare letters — missed all the style points.`,
          `Q, Z, X? You left them on the bench.`
        ];
      } else if (players.length > 1 && (p.score - players[1].score) <= 2) {
        roastOptions = [
          `You won, but barely. A sneeze could’ve tied it.`,
          `Victory margin so small it needed a magnifying glass.`,
          `That was less a win, more a coin flip.`
        ];
      } else {
        roastOptions = [
          `Nice run. Now do it again without sweating on the keyboard.`,
          `Solid game, but don’t let it get to your head.`,
          `Decent performance. Dictionary still not impressed.`
        ];
      }

      const roast = pick(roastOptions);

      // Render to DOM
      if (quoteEl) quoteEl.textContent = funny;
      if (coachEl) coachEl.textContent = `Coach says: ${roast}`;
    })();

  } catch (err) {
    console.error('[results] render error:', err);
    try { alert('Error rendering results. Returning to lobby.'); } catch (_) { }
    window.location.href = 'mm.html';
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
