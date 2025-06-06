// Simulated game data - in a real app this would come from localStorage
    const gameData = {
      score: 19,
      totalWords: 24,
      correctWords: 19,
      incorrectWords: 5,
      timeSpent: "2:45",
      accuracy: 79,
      longestWord: "Extraordinary",
      rareWords: ["Serendipity", "Quixotic", "Ephemeral", "Labyrinthine", "Pulchritude"],
      correctWordsList: ["Amazing", "Brilliant", "Creative", "Dazzling", "Eloquent", "Fantastic", "Glorious", "Harmony"],
      playStyle: "The Speedy Typo Tornado",
      coachComment: "“You type like you're dodging lava—chaotic, but entertaining.”",
      roast: "“Did you mean ‘giraffe’ or did your keyboard sneeze?”",
      badges: ["Word Wizard", "Keyboard Warrior", "Speedster", "Lexicon Dragon"]
    };

    // Populate the results page with data
    document.addEventListener('DOMContentLoaded', () => {
      // Set game over quote
      const quotes = [
        "You didn't lose... you just prematurely celebrated.",
        "Well, that was... something.",
        "Your keyboard survived, but barely.",
        "RIP, your vocabulary dreams.",
        "That was a valiant effort!",
        "Better luck next time, word warrior!",
        "Your brain cells need a vacation after that.",
        "You fought the words and the words won."
      ];
      document.getElementById('quote-text').textContent = "${quotes[Math.floor(Math.random() * quotes.length)]}";
      
      // Set play style
      document.getElementById('style-description').textContent = gameData.playStyle;
      
      // Set rare words
      const rareWordList = document.getElementById('rare-word-list');
      rareWordList.innerHTML = '';
      gameData.rareWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        rareWordList.appendChild(li);
      });
      
      // Set incorrect words
      document.getElementById('incorrect-count').textContent = ${gameData.incorrectWords} wrong attempts;
      document.getElementById('funny-roast').textContent = gameData.roast;
      
      // Set stats
      document.getElementById('total-attempts').textContent = gameData.totalWords;
      document.getElementById('time-spent').textContent = gameData.timeSpent;
      document.getElementById('accuracy').textContent = ${gameData.accuracy}%;
      document.getElementById('longest-word').textContent = "${gameData.longestWord}";
      
      // Set correct words
      const correctWordList = document.getElementById('correct-word-list');
      correctWordList.innerHTML = '';
      gameData.correctWordsList.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        correctWordList.appendChild(li);
      });
      
      // Set coach comment
      document.getElementById('coach-quote').textContent = gameData.coachComment;
      
      // Set next challenge
      const challenges = [
        "Try getting 3 five-letter words in under 30 seconds.",
        "Score 20 points without any incorrect words.",
        "Use at least 3 words with 8+ letters.",
        "Achieve 90% accuracy in your next game.",
        "Chain 5 words together without any mistakes."
      ];
      document.getElementById('challenge-text').textContent = challenges[Math.floor(Math.random() * challenges.length)];
      
      // Set badges
      const badgeContainer = document.getElementById('badge-container');
      badgeContainer.innerHTML = '';
      gameData.badges.forEach(badge => {
        const div = document.createElement('div');
        div.className = 'badge';
        div.innerHTML = <i class="fas fa-${getBadgeIcon(badge)}"></i> ${badge};
        badgeContainer.appendChild(div);
      });
      
      // Button event listeners
      document.getElementById('screenshot-btn').addEventListener('click', () => {
        alert('Screenshot saved! (This is a demo - in a real app, this would capture the screen)');
      });
      
      document.getElementById('share-btn').addEventListener('click', () => {
        alert('Results shared! (This is a demo - in a real app, this would share to social media)');
      });
      
      document.getElementById('replay-btn').addEventListener('click', () => {
        alert('Starting a new game! (This is a demo)');
      });
      
      document.getElementById('home-btn').addEventListener('click', () => {
        alert('Returning to home screen! (This is a demo)');
      });
    });
    
    // Helper function to get icon for badge
    function getBadgeIcon(badge) {
      const icons = {
        "Word Wizard": "hat-wizard",
        "Keyboard Warrior": "keyboard",
        "Speedster": "bolt",
        "Lexicon Dragon": "dragon",
        "Vocabulary King": "crown",
        "Accuracy Master": "bullseye"
      };
      return icons[badge] || "medal";
    }