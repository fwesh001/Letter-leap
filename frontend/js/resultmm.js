// ==========================================
// MULTIPLAYER RESULTS PAGE LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    populateMultiplayerResults();
});

function populateMultiplayerResults() {
    // 1. Retrieve Multiplayer Game Data
    const resultsRaw = localStorage.getItem('gameResults');
    if (!resultsRaw) {
        console.warn('[MP Results] No gameResults in localStorage');
        // Fallback: redirect to mm.html
        // window.location.href = 'mm.html';
        return;
    }

    const results = JSON.parse(resultsRaw);
    const { winner, reason, scores = {}, wordChain = [], usernames = {}, incorrect = {}, extraStats = {} } = results;

    // 2. Compute Player Stats
    const playerIds = Object.keys(scores);
    const byPlayerWords = (id) => wordChain.filter((e) => e.playerId === id).map((e) => e.word);
    const longestWord = (words) => words.reduce((a, b) => (b && b.length > (a?.length || 0) ? b : a), '');
    const accuracy = (id) => {
        const correct = byPlayerWords(id).length;
        const total = correct + (incorrect?.[id] || 0);
        if (!total) return 0;
        return Math.round((correct / total) * 100);
    };

    // Build players array
    const players = playerIds
        .map((id) => {
            const name = usernames[id] || 'Unknown Player';
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

    // --- SECTION 1: Winner Announcement ---
    const winnerEl = document.getElementById('winner-announcement');
    if (winnerEl) {
        winnerEl.textContent = `🏆 ${escapeHtml(winner || 'Winner')} Wins!`;
    }
    const reasonEl = document.getElementById('winner-reason');
    if (reasonEl) {
        reasonEl.textContent = reason || 'Match finished';
    }

    // --- SECTION 2: Head-to-Head (Top 2) ---
    const h2hGrid = document.getElementById('comparison-grid');
    if (h2hGrid && players.length >= 1) {
        h2hGrid.innerHTML = '';
        // Show top 2 players in head-to-head view
        const p1 = players[0];
        const p2 = players[1] || null;

        // Player 1 (Winner)
        const card1 = document.createElement('div');
        card1.className = 'h2h-card winner';
        card1.innerHTML = `
            <div class="medal-badge"><i class="ph-fill ph-medal" style="color: #ffd700;"></i> 1st</div>
            <h4>${escapeHtml(p1.name)}</h4>
            <div class="stat-row">
                <span class="stat-label">Score</span>
                <span class="stat-value">${p1.score}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Words</span>
                <span class="stat-value">${p1.totalWords}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Accuracy</span>
                <span class="stat-value">${p1.accuracyPct}%</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Longest</span>
                <span class="stat-value">${escapeHtml(p1.longest || '—')}</span>
            </div>
        `;
        h2hGrid.appendChild(card1);

        // VS divider
        const vs = document.createElement('div');
        vs.className = 'vs-divider';
        vs.textContent = 'VS';
        h2hGrid.appendChild(vs);

        // Player 2 (Runner-up)
        if (p2) {
            const card2 = document.createElement('div');
            card2.className = 'h2h-card';
            card2.innerHTML = `
                <div class="medal-badge"><i class="ph-fill ph-medal" style="color: #c0c0c0;"></i> 2nd</div>
                <h4>${escapeHtml(p2.name)}</h4>
                <div class="stat-row">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">${p2.score}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Words</span>
                    <span class="stat-value">${p2.totalWords}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Accuracy</span>
                    <span class="stat-value">${p2.accuracyPct}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Longest</span>
                    <span class="stat-value">${escapeHtml(p2.longest || '—')}</span>
                </div>
            `;
            h2hGrid.appendChild(card2);
        }
    }

    // --- SECTION 3: Full Leaderboard ---
    const leaderboardList = document.getElementById('leaderboard-list');
    if (leaderboardList) {
        leaderboardList.innerHTML = '';
        const medals = ['🥇', '🥈', '🥉'];
        players.forEach((p, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            row.innerHTML = `
                <div class="rank">
                    <span class="medal">${medals[idx] || (idx + 1)}</span>
                </div>
                <div class="player-info">
                    <div class="player-name">${escapeHtml(p.name)}</div>
                    <div class="player-meta">
                        <span>${p.totalWords} words</span> • 
                        <span>${p.accuracyPct}% accuracy</span>
                    </div>
                </div>
                <div class="player-score">${p.score}</div>
            `;
            leaderboardList.appendChild(row);
        });
    }

    // --- SECTION 4: Word Chain Replay ---
    const replayContainer = document.getElementById('word-chain-container');
    if (replayContainer) {
        replayContainer.innerHTML = '';
        if (wordChain.length > 0) {
            wordChain.forEach((entry, idx) => {
                const playerName = usernames[entry.playerId] || 'Unknown';
                const card = document.createElement('div');
                card.className = 'word-replay-card';
                card.innerHTML = `
                    <div class="word-number">${idx + 1}</div>
                    <div class="word-text">${escapeHtml(entry.word)}</div>
                    <div class="word-player" style="color: var(--primary-color); font-size: 0.8rem;">${escapeHtml(playerName)}</div>
                `;
                replayContainer.appendChild(card);
            });
        } else {
            replayContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No words played.</p>';
        }
    }

    // --- SECTION 5: Battle Achievements ---
    const badgeContainer = document.getElementById('badge-list');
    if (badgeContainer) {
        badgeContainer.innerHTML = '';
        
        const addBadge = (icon, title, desc, color) => {
            const badge = document.createElement('div');
            badge.className = 'badge';
            // Inline styles for glassmorphism look
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
            
            // Tooltip or subtitle approach (since badge is small)
            // We'll put the desc in a title attribute for hover, 
            // or render a more complex card if space allows.
            // For now, let's stick to the "Pill" style with a tooltip.
            badge.title = desc;

            badge.innerHTML = `<i class="ph-fill ${icon}"></i> ${title}`;
            badgeContainer.appendChild(badge);
        };

        let hasBadges = false;

        // 1. Top Scorer 🏆
        if (players.length > 0) {
            addBadge('ph-trophy', 'Top Scorer', `${players[0].name} scored ${players[0].score} pts`, '#ffd700');
            hasBadges = true;
        }

        // 2. Dictionary Expert 📖 (Longest word in chain)
        if (wordChain.length > 0) {
            const longestEntry = wordChain.reduce((best, current) =>
                current.word.length > (best.word?.length || 0) ? current : best, { word: '' }
            );
            if (longestEntry.word.length >= 8) { // Only if it's somewhat long
                const playerName = usernames[longestEntry.playerId] || 'Player';
                addBadge('ph-book-open', 'Dictionary Expert', `${playerName} played "${longestEntry.word}"`, '#9b59b6');
                hasBadges = true;
            }
        }

        // 3. Accuracy Master 👑
        const accuracyWinner = players.reduce((best, current) => {
            return (current.accuracyPct > (best?.accuracyPct || 0)) ? current : best;
        }, null);
        if (accuracyWinner && accuracyWinner.accuracyPct >= 90) {
            addBadge('ph-crosshair', 'Accuracy Master', `${accuracyWinner.name} achieved ${accuracyWinner.accuracyPct}% accuracy`, '#2ecc71');
            hasBadges = true;
        }

        // 4. Iron Fingers ⌨️ (Max Streak)
        const streakWinner = players.reduce((best, current) => 
            (current.maxStreak > (best?.maxStreak || 0)) ? current : best
        , null);
        if (streakWinner && streakWinner.maxStreak >= 5) {
            addBadge('ph-keyboard', 'Iron Fingers', `${streakWinner.name} had a ${streakWinner.maxStreak}-word streak`, '#3498db');
            hasBadges = true;
        }

        // 5. Fastest Fingers ⚡ (Total Words)
        const fastestPlayer = players.reduce((best, current) => 
          (current.totalWords > (best?.totalWords || 0)) ? current : best
        , null);
        if (fastestPlayer && fastestPlayer.totalWords >= 15) {
            addBadge('ph-lightning', 'Fastest Fingers', `${fastestPlayer.name} played ${fastestPlayer.totalWords} words`, '#e74c3c');
            hasBadges = true;
        }

        // 6. Trap Master 🐉 (Rare Letters)
        const rareRegex = /[qxzwvy]/i;
        const rareCounts = {};
        wordChain.forEach((entry) => {
            if (rareRegex.test(entry.word)) {
                const pid = entry.playerId;
                rareCounts[pid] = (rareCounts[pid] || 0) + 1;
            }
        });
        // Find max rare
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

    // --- SECTION 6: Competitive Breakdown Stats ---
    const statsBreakdown = document.getElementById('stats-breakdown');
    if (statsBreakdown) {
        statsBreakdown.innerHTML = '';
        
        // Comparison stats
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

// Helper: HTML safe escape
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
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
    if (window.showToast) {
      window.showToast('Error rendering results. Returning to lobby.', 'penalty');
    }
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
