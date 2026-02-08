document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  let username = '';
  let isCreator = false;
  let currentRoom = '';
  let usernames = {};
  let scoresState = {};
  let currentTurnIdState = null;
  let waitingForOpponent = false;
  let lastMinLength = 2;

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
      username = (value || 'Player').trim();
      callback(username);
    }, false, true, 'Your name');
  }

  // Create room
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
        showWaitingMessage();
      });
    } else {
      showToast('Please enter a room name!');
    }
  };

  // Join room
  document.getElementById('join-room-btn').onclick = () => {
    const roomName = document.getElementById('join-room-name').value.trim();
    if (roomName) {
      isCreator = false;
      currentRoom = roomName;
      getUsername((uname) => {
        socket.emit('joinRoom', { roomName, username: uname });
        showWaitingMessage();
      });
    }
  };

  // Listen for room creation or joining
  socket.on('playerCountUpdate', (count) => {
    const counter = document.getElementById('player-counter');
    if (counter) {
      counter.textContent = `${count} / 6 players in the room`;
    }
  });

  socket.on('playerJoined', (name) => {
    showToast(`${name} just joined!`, currentRoom);
  });

  // Start game
  document.getElementById('choose-letter-btn').onclick = () => {
    const letter = startLetterSelect.value;
    socket.emit('chooseStartLetter', { roomName: currentRoom, letter });
    document.getElementById('choose-letter-section').style.display = 'none';
    document.getElementById('waiting-message').textContent = 'Waiting for opponent to join...';
  };

  function enterGameRoom(roomName) {
    document.getElementById('room-system').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('room-name-display').textContent = `Room: ${roomName}`;
    hideWaitingMessage();
  }

  socket.on('roomCreated', () => {
    waitingForOpponent = true;
    showWaitingMessage();
  });

  socket.on('roomJoined', () => {
    waitingForOpponent = true;
    showWaitingMessage();
  });

  socket.on('startGame', (startLetter) => {
    enterGameRoom(currentRoom);
    updateNextLetter(startLetter);

    socket.emit('startGameConfirmed', currentRoom);
  });

  document.getElementById('submit-word-btn').onclick = () => {
    const word = document.getElementById('word-input').value.trim();
    console.log('[client] submit clicked:', word);
    if (word) {
      socket.emit('submitWord', word);
      document.getElementById('word-input').value = '';
      playSound('click');
    }
  };

  socket.on('updateUsernames', (userObj) => {
    usernames = userObj;
    if (Object.values(userObj).includes('AI Bot')) {
      document.getElementById('ai-indicator').style.display = 'block';
    }
    renderScoreboard();
  });

  socket.on('turnChanged', (currentTurnId) => {
    currentTurnIdState = currentTurnId;
    renderScoreboard();
  });

  socket.on('updateScores', (scores) => {
    scoresState = scores || {};
    renderScoreboard();
  });

  socket.on('turnChanged', (currentTurnId) => {
    console.log('[client] turnChanged:', currentTurnId, 'you:', socket.id);
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

  // 💡 IMPROVED TOAST (stacking, robust duration)
  function showToast(message, duration = 3000) {
    // If a non-number sneaks in (e.g., a string like roomName), default safely
    if (typeof duration !== 'number' || !isFinite(duration) || duration < 0) {
      duration = 3000;
    }

    // Create or reuse a top-right toast container
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '12px';
      container.style.right = '12px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'flex-end';
      container.style.gap = '8px';
      container.style.zIndex = '2147483647'; // stay above everything
      container.style.pointerEvents = 'none'; // avoid blocking UI
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.background = 'linear-gradient(135deg, #ff007f, #ff4d4f)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 22px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 0 15px rgba(255,0,100,0.9), 0 0 30px rgba(255,50,150,0.6)';
    toast.style.fontSize = '15px';
    toast.style.fontWeight = 'bold';
    toast.style.maxWidth = '75vw';
    toast.style.textAlign = 'center';
    toast.style.pointerEvents = 'auto';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'opacity 160ms ease, transform 160ms ease';

    // Add and animate in
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Auto remove with fade-out, then cleanup
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        // Optional: remove container if empty
        if (container && container.children.length === 0 && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 200);
    }, duration);
  }

  // 🔥 Pop animation (make sure to add in your CSS)
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes popInOut {
      0% { transform: scale(0.5); opacity: 0; }
      10% { transform: scale(1.1); opacity: 1; }
      80% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  socket.on('gameOver', ({ winner, reason, scores, wordChain, usernames, incorrect = {}, extraStats = {} }) => {
    localStorage.setItem('gameResults', JSON.stringify({ winner, reason, scores, wordChain, usernames, incorrect, extraStats }));
    window.location.href = 'resultmm.html';
  });

  socket.on('penalty', (message) => {
    showToast(message);
  });

  socket.on('wordRejected', (msg) => {
    try {
      console.log('[client] wordRejected:', msg);
      showToast(msg);
      blinkEffect('red');
      playSound('wrong');
    } catch (err) {
      console.error('[client] error handling wordRejected:', err);
    }
  });

  socket.on('toast', (message) => {
    showToast(message);
  });

  socket.on('roomFull', (msg) => {
    console.warn('[client] roomFull:', msg);
    showToast(msg);
  });
  socket.on('roomNotFound', (msg) => {
    console.warn('[client] roomNotFound:', msg);
    showToast(msg);
  });

  socket.on('achievementUnlocked', ({ id, name, emoji }) => {
    showToast(`${name || 'Achievement unlocked'}`);
  });

  socket.on('playerAchievement', ({ playerId, username, id, name, emoji }) => {
    if (playerId === socket.id) return;
    showToast(name);
  });

  socket.on('opponentLeft', (name) => {
    showToast(`${name} has left the game.`);
    setTimeout(() => window.location.reload(), 3000);
  });

  function updateNextLetter(letter) {
    document.getElementById('next-letter-display').textContent =
      letter ? `Next word must start with: "${letter.toUpperCase()}"` : '';
  }

  function updateMinLengthIndicator(wordChain) {
    const minLength = (wordChain.length >= 10) ? 3 : 2;
    document.getElementById('min-length-indicator').textContent =
      `Minimum word length: ${minLength} `;
  }

  function updateMinLengthModal(wordChain) {
    const minLength = (wordChain.length >= 10) ? 3 : 2;
    if (minLength !== lastMinLength && minLength === 3) {
      showToast('Minimum word length has increased to 3!');
    }
    lastMinLength = minLength;
  }

  socket.on('updateWordChain', (wordChain) => {
    const list = document.getElementById('word-chain-list');
    list.innerHTML = '';
    let lastLetter = '';

    wordChain.forEach((entry, idx) => {
      const li = document.createElement('li');
      li.textContent = `${entry.word.toUpperCase()} (${usernames[entry.playerId] || 'Player'})`;
      if (entry.playerId === socket.id) {
        li.classList.add('your-word');
      }
      if (idx === wordChain.length - 1) {
        li.classList.add('new-word');
        lastLetter = entry.word[entry.word.length - 1];
      }
      list.appendChild(li);
    });

    list.scrollTop = list.scrollHeight;
    updateNextLetter(lastLetter);
    updateMinLengthModal(wordChain);

    const prev = wordChain.length >= 2 ? wordChain[wordChain.length - 2].word : 'none';
    const curr = wordChain.length >= 1 ? wordChain[wordChain.length - 1].word : 'none';
    document.getElementById('last-word-prev').textContent = prev.toUpperCase();
    document.getElementById('last-word-current').textContent = curr.toUpperCase();
    try {
      blinkEffect('green');
      playSound('correct');
    } catch (err) {
      console.error('[client] error handling updateWordChain sound:', err);
    }
  });

  socket.on('waitingForOpponent', () => {
    document.getElementById('waiting-message').style.display = 'block';
  });

  document.getElementById('word-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !this.disabled) {
      document.getElementById('submit-word-btn').click();
    }
  });

  socket.on('notEnoughPlayers', () => {
    showToast('At least 2 players are required to start the game!');
  });

  const aiToggle = document.getElementById('ai-toggle');
  let aiEnabled = false;

  aiToggle.addEventListener('change', function () {
    aiEnabled = this.checked;
    if (window.currentRoomName) {
      if (aiEnabled) {
        socket.emit('addAI', { roomName: window.currentRoomName });
        document.getElementById('ai-indicator').style.display = 'block';
      } else {
        socket.emit('removeAI', { roomName: window.currentRoomName });
        document.getElementById('ai-indicator').style.display = 'none';
      }
    }
  });

  document.getElementById('add-ai-btn').onclick = () => {
    if (!currentRoom) {
      showToast('Create a room first!');
      return;
    }
    socket.emit('addAI', { roomName: currentRoom });
  };

  socket.on('aiAdded', () => {
    showToast('AI opponent has been added to this room!');
    document.getElementById('ai-indicator').style.display = 'block';
  });

  socket.on('aiRemoved', () => {
    showToast('AI opponent has been removed from this room!');
    document.getElementById('ai-indicator').style.display = 'none';
  });

  function showModal(message, callback, showRematch = false, showInput = false, inputPlaceholder = '') {
    const overlay = document.getElementById('modal-overlay');
    const msg = document.getElementById('modal-message');
    const btn = document.getElementById('modal-close-btn');
    const input = document.getElementById('modal-input');
    msg.textContent = message;
    overlay.style.display = 'flex';
    btn.textContent = showRematch ? 'Rematch' : 'OK';

    if (showInput) {
      input.style.display = 'block';
      input.value = '';
      input.placeholder = inputPlaceholder || '';
      setTimeout(() => input.focus(), 100);
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

    document.onkeydown = (e) => {
      if (e.key === 'Enter') btn.click();
    };
  }

  function renderScoreboard() {
    try {
      const board = document.getElementById('scoreboard');
      if (!board) return;
      const ids = new Set([
        ...Object.keys(usernames || {}),
        ...Object.keys(scoresState || {}),
      ]);
      const list = Array.from(ids);
      board.innerHTML = '';
      list.forEach((id) => {
        const row = document.createElement('div');
        row.className = 'player-score';
        row.id = `player - ${id} `;
        if (id === currentTurnIdState) row.classList.add('active');
        const name = usernames[id] || (id === socket.id ? 'You' : 'Player');
        const score = (scoresState && typeof scoresState[id] === 'number') ? scoresState[id] : 0;
        const crownDisplay = id === currentTurnIdState ? 'inline' : 'none';
        row.innerHTML = `
  < span class="player-name" > ${name}</span >
    <span class="player-crown" style="display: ${crownDisplay};"><i class="ph ph-crown"></i> </span>
          : <span class="player-score-value">${score}</span>
`;
        board.appendChild(row);
      });
    } catch (e) {
      console.error('[client] renderScoreboard error:', e);
    }
  }

  function showWaitingMessage() {
    document.getElementById('waiting-message').style.display = 'block';
  }

  function hideWaitingMessage() {
    document.getElementById('waiting-message').style.display = 'none';
  }
});

//Animations for blinking effects
function blinkEffect(color) {
  document.body.classList.remove('blink-green', 'blink-red');
  void document.body.offsetWidth;
  document.body.classList.add(`blink - ${color} `);
}

// Global error logging
window.addEventListener('error', (event) => {
  console.error('[client] window error:', event.message, 'at', event.filename, event.lineno + ':' + event.colno, event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[client] unhandledrejection:', event.reason);
});

// Unified sound player
function playSound(kind) {
  try {
    const id = kind === 'correct' ? 'sound-correct'
      : kind === 'wrong' ? 'sound-wrong'
        : kind === 'click' ? 'sound-click'
          : null;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) {
      console.warn('[client] audio element not found:', id);
      return;
    }
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => console.warn('[client] audio play blocked or failed for', id, err));
    }
  } catch (e) {
    console.error('[client] playSound error:', e);
  }
}
// Backward compatibility
const playsound = playSound;
