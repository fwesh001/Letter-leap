// filepath: c:\Users\zabdiel\Desktop\multiplayer-game\src\client\main.js
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let username = '';
  let isCreator = false;
  let currentRoom = '';
  let usernames = {};
  let waitingForOpponent = false;
  let lastMinLength = 2;
  const roomTimeLeft = {};

  // Fill A-Z in the select
  const startLetterSelect = document.getElementById('start-letter');
  for (let i = 65; i <= 90; i++) {
    const opt = document.createElement('option');
    opt.value = String.fromCharCode(i).toLowerCase();
    opt.textContent = String.fromCharCode(i);
    startLetterSelect.appendChild(opt);
  }

  function getUsername(callback) {
    if (username) {
      callback(username);
      return;
    }
    showModal('Enter your username:', (value) => {
      username = value || 'Player';
      callback(username);
    }, false, true, 'Your name');
  }

  // Handle room creation
  document.getElementById('create-room-btn').onclick = () => {
    const roomName = document.getElementById('create-room-name').value.trim();
    if (roomName) {
      isCreator = true;
      currentRoom = roomName;
      getUsername((uname) => {
        socket.emit('createRoom', { roomName, username: uname });
        window.currentRoomName = roomName;
        if (aiToggle.checked) {
          socket.emit('addAI', { roomName });
        }
        document.getElementById('choose-letter-section').style.display = 'block';
        showWaitingMessage(); // <--- use here
      });
    } else {
      showModal('Please enter a room name!');
    }
  };

  // Handle room joining
  document.getElementById('join-room-btn').onclick = () => {
    const roomName = document.getElementById('join-room-name').value.trim();
    if (roomName) {
      isCreator = false;
      currentRoom = roomName;
      getUsername((uname) => {
        socket.emit('joinRoom', { roomName, username: uname });
        showWaitingMessage(); // <--- use here
      });
    }
  };

  // Handle starting letter selection (creator only)
  document.getElementById('choose-letter-btn').onclick = () => {
    const letter = startLetterSelect.value;
    socket.emit('chooseStartLetter', { roomName: currentRoom, letter });
    document.getElementById('choose-letter-section').style.display = 'none';
    document.getElementById('waiting-message').textContent = 'Waiting for opponent to join...';
  };

  // Show game area and room name when entering a room
  function enterGameRoom(roomName) {
    document.getElementById('room-system').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('room-name-display').textContent = `Room: ${roomName}`;
    hideWaitingMessage(); // <--- use here
  }

  socket.on('roomCreated', (roomName) => {
    waitingForOpponent = true;
    document.getElementById('waiting-message').style.display = 'block';
  });

  socket.on('roomJoined', (roomName) => {
    waitingForOpponent = true;
    document.getElementById('waiting-message').style.display = 'block';
  });

  socket.on('startGame', (startLetter) => {
    enterGameRoom(currentRoom);
    updateNextLetter(startLetter);
  });

  // Handle word submission
  document.getElementById('submit-word-btn').onclick = () => {
    const word = document.getElementById('word-input').value.trim();
    if (word) {
      socket.emit('submitWord', word);
      document.getElementById('word-input').value = '';
    }
  };

  socket.on('updateUsernames', (userObj) => {
    usernames = userObj;
    if (Object.values(userObj).includes('AI Bot')) {
      document.getElementById('ai-indicator').style.display = 'block';
    }
  });

  // Update scores
  socket.on('updateScores', (scores) => {
    const yourId = socket.id;
    let yourScore = 0;
    let opponentScore = 0;
    let opponentName = 'Opponent';
    Object.keys(scores).forEach(id => {
      if (id === yourId) {
        yourScore = scores[id];
      } else {
        opponentScore = scores[id];
        opponentName = usernames[id] || 'Opponent';
      }
    });
    document.getElementById('your-score').textContent = yourScore;
    document.getElementById('opponent-score').textContent = opponentScore;
    document.getElementById('opponent-name').textContent = opponentName;
  });

  socket.on('turnChanged', (currentTurnId) => {
    const input = document.getElementById('word-input');
    if (socket.id === currentTurnId) {
      input.disabled = false;
      input.focus();
    } else {
      input.disabled = true;
    }
  });

  socket.on('timerUpdate', (timeLeft) => {
    const timerElem = document.getElementById('timer-value');
    timerElem.textContent = timeLeft;
    timerElem.style.color = timeLeft <= 10 ? '#ff4d4f' : '#fff';
  });

  // Game over modal with reason and redirect to end page
  socket.on('gameOver', ({ winner, reason }) => {
    showModal(
      `Game Over! Winner: ${winner}\n${reason || ''}`,
      null,
      true // This enables the Rematch button
    );
  });

  // Show modal helper
  function showModal(message, callback, showRematch = false, showInput = false, inputPlaceholder = '') {
    const overlay = document.getElementById('modal-overlay');
    const msg = document.getElementById('modal-message');
    const btn = document.getElementById('modal-close-btn');
    const input = document.getElementById('modal-input');
    msg.textContent = message;
    overlay.style.display = 'flex';
    btn.textContent = showRematch ? 'Rematch' : 'OK';

    // Show/hide input
    if (showInput) {
      input.style.display = 'block';
      input.value = '';
      input.placeholder = inputPlaceholder || '';
      setTimeout(() => input.focus(), 100); // Focus input after showing
    } else {
      input.style.display = 'none';
    }

    document.onkeydown = null;

    btn.onclick = () => {
      overlay.style.display = 'none';
      document.onkeydown = null;
      if (callback) {
        if (showInput) {
          callback(input.value.trim());
        } else {
          callback();
        }
      }
      if (showRematch) socket.emit('rematchRequest');
    };

    // Allow Enter key to trigger the modal button
    document.onkeydown = (e) => {
      if (e.key === 'Enter') {
        btn.click();
      }
    };
  }

  // Game over modal with rematch
  socket.on('gameOver', ({ winner, score }) => {
    showModal(`Game Over! Winner: ${winner} (${score} points)`, null, true);
  });

  // Word rejected modal
  socket.on('wordRejected', (msg) => {
    showModal(msg);
  });

  // Opponent left modal
  socket.on('opponentLeft', (name) => {
    showModal(`${name} has left the game.`, () => window.location.reload());
  });

  // Word chain with player names and next letter
  function updateNextLetter(letter) {
    document.getElementById('next-letter-display').textContent =
      letter ? `Next word must start with: "${letter.toUpperCase()}"` : '';
  }

  function updateMinLengthIndicator(wordChain) {
    const minLength = (wordChain.length >= 10) ? 3 : 2;
    document.getElementById('min-length-indicator').textContent =
      `Minimum word length: ${minLength}`;
  }

  function updateMinLengthModal(wordChain) {
    const minLength = (wordChain.length >= 10) ? 3 : 2;
    if (minLength !== lastMinLength && minLength === 3) {
      showModal('Minimum word length has increased to 3!');
    }
    lastMinLength = minLength;
  }

  socket.on('updateWordChain', (wordChain) => {
    const list = document.getElementById('word-chain-list');
    list.innerHTML = '';
    let lastLetter = '';
    wordChain.forEach((entry, idx) => {
      const li = document.createElement('li');
      li.textContent = `${entry.word} (${usernames[entry.playerId] || 'Player'})`;
      if (idx === wordChain.length - 1) {
        li.classList.add('new-word');
        lastLetter = entry.word[entry.word.length - 1];
      }
      list.appendChild(li);
    });
    updateNextLetter(lastLetter);
    updateMinLengthModal(wordChain);

    // Update last words display
    const prev = wordChain.length >= 2 ? wordChain[wordChain.length - 2].word : 'none';
    const curr = wordChain.length >= 1 ? wordChain[wordChain.length - 1].word : 'none';
    document.getElementById('last-word-prev').textContent = prev;
    document.getElementById('last-word-current').textContent = curr;
  });

  // Show waiting message if only one player
  socket.on('waitingForOpponent', () => {
    document.getElementById('waiting-message').style.display = 'block';
  });

  socket.on('startGame', (startLetter) => {
    enterGameRoom(currentRoom);
    updateNextLetter(startLetter);
  });

  // Allow Enter key to submit the word
  document.getElementById('word-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !this.disabled) {
      document.getElementById('submit-word-btn').click();
    }
  });

  socket.on('notEnoughPlayers', () => {
    showModal('At least 2 players are required to start the game!');
  });

  // AI toggle logic
  const aiToggle = document.getElementById('ai-toggle');
  let aiEnabled = false;

  aiToggle.addEventListener('change', function() {
    aiEnabled = this.checked;
    if (aiEnabled) {
      if (window.currentRoomName) {
        socket.emit('addAI', { roomName: window.currentRoomName });
      }
      document.getElementById('ai-indicator').style.display = 'block';
    } else {
      if (window.currentRoomName) {
        socket.emit('removeAI', { roomName: window.currentRoomName });
      }
      document.getElementById('ai-indicator').style.display = 'none';
    }
  });

  document.getElementById('add-ai-btn').onclick = () => {
    if (!currentRoom) {
      showModal('Create a room first!');
      return;
    }
    socket.emit('addAI', { roomName: currentRoom });
  };

  socket.on('aiAdded', () => {
    showModal('AI opponent has been added to this room!');
    document.getElementById('ai-indicator').style.display = 'block';
  });

  socket.on('aiRemoved', () => {
    showModal('AI opponent has been removed from this room!');
    document.getElementById('ai-indicator').style.display = 'none';
  });
});