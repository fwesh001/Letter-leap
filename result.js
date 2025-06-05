// result.js

export function showGameOverScreen(wordChain, score, totalTimeSpent, totalWordsExchanged) {
  // Hide game container, show game over screen
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('game-over-screen').classList.remove('hidden');

  // Funny quotes to lighten the mood
  const quotes = [
    "RIP, Brain Cells 💀", "Oops! That escalated quickly...",
    "Your vocabulary went on vacation 🌴", "You vs Time: Time wins again ⏳😵",
    "That was... something 😅", "You tried... and the letters laughed. 😂",
    "Word on the street is... you need more practice.😅", "That's not how you spell 'victory'. 😅",
    "Letters were thrown. No survivors. 💀", "You and the keyboard had a disagreement. 👊⌨️",
    "Grammar police are on their way. 🚨📝", "Your brain: 404 - Word Not Found. 🧠❌",
    "Well... that was a journey. 🛣️", "Let’s pretend that didn’t happen.😅"
  ];

  // Pick a random quote and show it
  document.getElementById('game-over-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

  // Show final stats
  document.getElementById('final-score').textContent = score;
  document.getElementById('word-count').textContent = wordChain.length;
  document.getElementById('time-spent').textContent = formatTime(totalTimeSpent);

  // Calculate accuracy percentage
  const accuracy = Math.round((score / (totalWordsExchanged || 1)) * 100);
  document.getElementById('accuracy').textContent = accuracy + '%';

  // List all correct words played
  const list = document.getElementById('word-list');
  list.innerHTML = '';
  wordChain.forEach(w => {
    const li = document.createElement('li');
    li.textContent = w;
    list.appendChild(li);
  });

  // Random challenge for next round
  const challenges = [
    "Use only words longer than 5 letters!",
    "No words with the letter 'E'!",
    "Try to score 15 points!",
    "Only animal names allowed!",
    "Use words starting with vowels only!"
  ];
  document.getElementById('game-over-challenge').textContent = `🎮 Challenge for next round: ${challenges[Math.floor(Math.random() * challenges.length)]}`;

  // Show longest word played
  const longestWord = wordChain.reduce((longest, word) => word.length > longest.length ? word : longest, '');
  document.getElementById('longest-word').textContent = longestWord || "None";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
}
