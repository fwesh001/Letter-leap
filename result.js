const history = JSON.parse(localStorage.getItem('gameHistory')) || [];
const latestResult = history[history.length - 1];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

if (latestResult) {
  // 🎯 Stats
  document.getElementById('total-attempts').textContent = latestResult.wordsPlayed.length || 0;
  document.getElementById('time-spent').textContent = formatTime(latestResult.timeSpent || 0);
  document.getElementById('accuracy').textContent = (latestResult.accuracy || 0) + '%';
  document.getElementById('longest-word').textContent = latestResult.longestWord || '(None)';

  // ❌ Incorrect Words
  document.getElementById('incorrect-count').textContent = `${latestResult.incorrectWords || 0} wrong attempts`;
  document.getElementById('funny-roast').textContent = "“Coming soon”";

  // 🎭 Funny Quote
  document.getElementById('quote-text').textContent = "Coming soon";

  // 🧠 Play Style
  document.getElementById('style-description').textContent = "Coming soon";
  document.getElementById('playstyle-feedback').querySelector('p:nth-of-type(2)').textContent = "Coming soon";

  // 📖 Rare Words
  const rareList = document.getElementById('rare-word-list');
  rareList.innerHTML = '<li>Coming soon</li>';

  // ✅ Correct Words
  const correctList = document.getElementById('correct-word-list');
  correctList.innerHTML = '';
  (latestResult.wordsPlayed || []).forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    correctList.appendChild(li);
  });

  // 🏆 Achievements
  const milestoneList = document.getElementById('milestone-list');
  milestoneList.innerHTML = '<li class="achievement-item"><i class="fas fa-spinner"></i> <div>Coming soon</div></li>';

  // 🧩 Badges
  const badgeWrap = document.getElementById('badge-container');
  badgeWrap.innerHTML = '<div class="badge">Coming soon</div>';

  // 💬 AI Coach
  document.getElementById('coach-quote').textContent = "Coming soon";

  // 🎲 Next Challenge
  document.getElementById('challenge-text').textContent = "Coming soon";
}
