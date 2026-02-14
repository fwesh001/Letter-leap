// ==========================
// 📊 LOAD GAME HISTORY & POPULATE
// ==========================

document.addEventListener('DOMContentLoaded', () => {
    populateResultPage();
});

function populateResultPage() {
    // 1. Retrieve Game Data
    const gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
    if (gameHistory.length === 0) {
        console.warn("No game history found.");
        // Optional: Redirect to home or show demo state
        // window.location.href = 'index.html';
        return;
    }

    const lastGame = gameHistory[gameHistory.length - 1];
    
    // Default values if data is missing
    const stats = {
        words: lastGame.wordsPlayed || [],
        incorrectCount: lastGame.incorrectWords || 0,
        accuracy: lastGame.accuracy || 0,
        time: lastGame.timeSpent || 0,
        longestWord: lastGame.longestWord || "—",
        score: lastGame.score || 0
    };

    // --- SECTION 1: Game Over Quote ---
    const quotes = [
        "Game Over! But the alphabet isn't done with you yet.",
        "That's a wrap! The letters are resting now.",
        "Finished! Your keyboard can finally cool down."
    ];
    let quoteText = quotes[Math.floor(Math.random() * quotes.length)];
    
    // MP Specialist Override
    if (lastGame.mode === 'multiplayer') {
        if (lastGame.isWinner) {
             quoteText = "VICTORY! You outsmarted your opponent!";
        } else {
             quoteText = "DEFEAT... But you'll get them next time!";
             if (lastGame.winner) quoteText += ` (Winner: ${lastGame.winner})`;
        }
    }

    const quoteEl = document.getElementById('quote-text');
    if (quoteEl) quoteEl.textContent = quoteText;

    // --- SECTION 2: Stats Summary ---
    setText('word-count', stats.words.length);
    setText('time-spent', formatTime(stats.time));
    setText('accuracy', stats.accuracy + '%');
    setText('longest-word', stats.longestWord || "—");

    // --- SECTION 3: Play Style ---
    const playStyle = determinePlayStyle(stats);
    setText('style-title', playStyle.title);
    setText('style-description', playStyle.desc);

    // --- SECTION 4: Incorrect Words / Roast ---
    setText('incorrect-count', `${stats.incorrectCount} mistakes`);
    setText('incorrect-roast', getRoast(stats.accuracy));

    // --- SECTION 5: Correct Words List ---
    const wordListEl = document.getElementById('word-list');
    if (wordListEl) {
        wordListEl.innerHTML = '';
        stats.words.slice(0, 20).forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            wordListEl.appendChild(li);
        });
        if (stats.words.length > 20) {
            const moreLi = document.createElement('li');
            moreLi.textContent = `...and ${stats.words.length - 20} more`;
            moreLi.style.fontStyle = 'italic';
            moreLi.style.opacity = '0.7';
            wordListEl.appendChild(moreLi);
        }
    }

    // --- SECTION 6: Rare Words ---
    const rareWords = stats.words.filter(w => w.length >= 7 || /[jqxz]/i.test(w));
    const rareListEl = document.getElementById('rare-words-list');
    if (rareListEl) {
        rareListEl.innerHTML = '';
        if (rareWords.length > 0) {
            rareWords.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                rareListEl.appendChild(li);
            });
        } else {
            rareListEl.innerHTML = '<li>No rare gems this time.</li>';
        }
    }

    // --- SECTION 7: Milestones ---
    const milestones = [];
    if (stats.words.length >= 10) milestones.push("Double Digits: Found 10+ words");
    if (stats.words.length >= 20) milestones.push("Word Hoarder: Found 20+ words");
    if (stats.accuracy === 100 && stats.words.length > 5) milestones.push("Perfectionist: 100% Accuracy");
    if (stats.time < 60 && stats.words.length > 5) milestones.push("Sprinter: Finished in under 1 min");

    const milestoneListEl = document.getElementById('milestone-list');
    if (milestoneListEl) {
        milestoneListEl.innerHTML = '';
        if (milestones.length > 0) {
            milestones.forEach(m => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="ph-fill ph-check-circle" style="color: var(--success-color);"></i> ${m}`;
                milestoneListEl.appendChild(li);
            });
        } else {
            milestoneListEl.innerHTML = '<li>Keep playing to hit milestones!</li>';
        }
    }

    // --- SECTION 8: Badges ---
    const badges = [];
    if (stats.accuracy === 100) badges.push({ icon: "ph-target", label: "Sniper", color: "#2ecc71" });
    if (stats.words.length >= 25) badges.push({ icon: "ph-crown", label: "Word King", color: "#f1c40f" });
    if (stats.longestWord.length >= 8) badges.push({ icon: "ph-graduation-cap", label: "Scholar", color: "#9b59b6" });

    const badgeContainer = document.getElementById('badge-container');
    const noBadgesMsg = document.getElementById('no-badges');
    
    if (badgeContainer) {
        badgeContainer.innerHTML = '';
        if (badges.length > 0) {
            if (noBadgesMsg) noBadgesMsg.style.display = 'none';
            badges.forEach(b => {
                const badge = document.createElement('div');
                badge.className = 'badge';
                // Inline styles for dynamic generation
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '0.5rem';
                badge.style.padding = '0.5rem 1rem';
                badge.style.background = 'rgba(255,255,255,0.05)';
                badge.style.border = `1px solid ${b.color}`;
                badge.style.borderRadius = '20px';
                badge.style.color = b.color;
                badge.style.fontWeight = 'bold';
                badge.style.marginRight = '0.5rem';
                badge.style.marginBottom = '0.5rem';

                badge.innerHTML = `<i class="ph-fill ${b.icon}"></i> ${b.label}`;
                badgeContainer.appendChild(badge);
            });
        } else {
            if (noBadgesMsg) noBadgesMsg.style.display = 'block';
        }
    }

    // --- SECTION 9: AI Coach ---
    setText('coach-comment', getCoachComment(stats));

    // --- SECTION 10: Next Challenge ---
    setText('challenge-text', generateChallenge(stats));
}

// Helper: Set Text Safely
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Helper: Format Time
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Logic: Play Style
function determinePlayStyle(stats) {
    if (stats.accuracy === 100) return { title: "The Surgeon", desc: "Precise, calculated, and flawless." };
    if (stats.words.length > 20 && stats.accuracy < 80) return { title: "The Machine Gun", desc: "Spray and pray! You got lots of words, but made a mess." };
    if (stats.words.length < 5) return { title: "The Tourist", desc: "Just passing through, enjoying the view." };
    if (stats.longestWord.length > 8) return { title: "The Professor", desc: "You prefer quality complex words over simple ones." };
    return { title: "The Balanced Leaper", desc: "A solid mix of speed and caution." };
}

// Logic: Roast
function getRoast(accuracy) {
    if (accuracy === 100) return "Okay, show off. We get it, you're perfect.";
    if (accuracy >= 80) return "Not bad! A few slips, but you're still standing.";
    if (accuracy >= 50) return "Your keyboard probably needs a hug after that.";
    return "Did you play with your elbows? That was rough.";
}

// Logic: Coach Comment
function getCoachComment(stats) {
    if (stats.accuracy < 60) return "Focus on accuracy first. Speed will come later. Take a breath!";
    if (stats.words.length < 8) return "Good accuracy, but try to push the pace next time. Don't be afraid to leap!";
    return "You're doing great! Try to maintain this rhythm while hunting for longer words.";
}

// Logic: Challenge
function generateChallenge(stats) {
    if (stats.accuracy < 90) return "Goal: Finish a game with > 90% accuracy.";
    if (stats.words.length < 15) return "Goal: Find at least 15 words next game.";
    return "Goal: Find a word with 8+ letters.";
}