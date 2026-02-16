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
  let playerStatuses = {};

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
    showRoomActions();
  });

  socket.on('roomJoined', () => {
    waitingForOpponent = true;
    showWaitingMessage();
    showRoomActions();
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

  socket.on('updatePlayerStatus', (statusObj) => {
    playerStatuses = statusObj || {};
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

  // 💡 Global toast wrapper
  function showToast(message, type = 'info') {
    const allowed = ['achievement', 'penalty', 'info'];
    const safeType = allowed.includes(type) ? type : 'info';

    if (window.showToast) {
      window.showToast(message, safeType);
      return;
    }

    console.log('[toast]', message);
  }

  socket.on('gameOver', ({ winner, reason, scores, wordChain, usernames, incorrect = {}, extraStats = {} }) => {
    localStorage.setItem('gameResults', JSON.stringify({ winner, reason, scores, wordChain, usernames, incorrect, extraStats }));
    if (window.showGameLoader) {
      window.showGameLoader('resultmm.html', 3000);
    } else {
      window.location.href = 'resultmm.html';
    }
  });

  socket.on('penalty', (message) => {
    showToast(message, 'penalty');
  });

  socket.on('wordRejected', (msg) => {
    try {
      console.log('[client] wordRejected:', msg);
      showToast(msg, 'penalty');
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
    showToast(msg, 'penalty');
  });
  socket.on('roomNotFound', (msg) => {
    console.warn('[client] roomNotFound:', msg);
    showToast(msg, 'penalty');
  });

  socket.on('achievementUnlocked', ({ id, name, emoji }) => {
    showToast(`${name || 'Achievement unlocked'}`, 'achievement');
  });

  socket.on('playerAchievement', ({ playerId, username, id, name, emoji }) => {
    if (playerId === socket.id) return;
    showToast(name);
  });

  socket.on('opponentLeft', (name) => {
    showToast(`${name} has left the game.`);
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
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const input = document.getElementById('modal-input');
    msg.textContent = message;
    overlay.style.display = 'flex';
    btn.textContent = showRematch ? 'Rematch' : 'OK';
    if (cancelBtn) cancelBtn.style.display = 'none';

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

  function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.getElementById('modal-overlay');
    const msg = document.getElementById('modal-message');
    const btn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const input = document.getElementById('modal-input');

    msg.textContent = message;
    overlay.style.display = 'flex';
    btn.textContent = 'Leave';
    if (input) input.style.display = 'none';
    if (cancelBtn) {
      cancelBtn.textContent = 'Stay';
      cancelBtn.style.display = 'inline-flex';
    }

    btn.onclick = () => {
      overlay.style.display = 'none';
      document.onkeydown = null;
      if (onConfirm) onConfirm();
    };

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        overlay.style.display = 'none';
        document.onkeydown = null;
        if (onCancel) onCancel();
      };
    }

    document.onkeydown = (e) => {
      if (e.key === 'Escape' && cancelBtn) cancelBtn.click();
      if (e.key === 'Enter') btn.click();
    };
  }

  function requestLeave() {
    showConfirm('Leave the room? Your match will end for you.', () => {
      if (currentRoom) {
        socket.emit('leaveRoom', { roomName: currentRoom });
      }
      window.location.href = 'index.html';
    });
  }

  const leaveBtn = document.getElementById('leave-room-btn');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      requestLeave();
    });
  }

  const headerBackBtn = document.querySelector('header a[href="index.html"]');
  if (headerBackBtn) {
    headerBackBtn.addEventListener('click', (e) => {
      if (currentRoom) {
        e.preventDefault();
        requestLeave();
      }
    });
  }

  function showRoomActions() {
    const actions = document.getElementById('room-actions');
    if (actions) actions.style.display = 'flex';
  }

  function hideRoomActions() {
    const actions = document.getElementById('room-actions');
    if (actions) actions.style.display = 'none';
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
        row.id = `player-${id}`;
        if (id === currentTurnIdState) row.classList.add('active');
        const status = playerStatuses?.[id] || 'active';
        if (status === 'left') row.classList.add('left');
        if (status === 'eliminated') row.classList.add('eliminated');
        const name = usernames[id] || (id === socket.id ? 'You' : 'Player');
        const score = (scoresState && typeof scoresState[id] === 'number') ? scoresState[id] : 0;
        const crownDisplay = id === currentTurnIdState ? 'inline' : 'none';
        const statusLabel = status === 'left' ? 'LEFT' : status === 'eliminated' ? 'OUT' : '';
        row.style.setProperty('--player-accent', getPlayerColor(id));
        row.innerHTML = `
          <span class="player-name">${name}</span>
          ${statusLabel ? `<span class="player-status">${statusLabel}</span>` : ''}
          <span class="player-crown" style="display: ${crownDisplay};"><i class="ph ph-crown"></i></span>
          : <span class="player-score-value">${score}</span>
        `;
        board.appendChild(row);
      });
    } catch (e) {
      console.error('[client] renderScoreboard error:', e);
    }
  }

  function getPlayerColor(id) {
    const palette = ['#00d1ff', '#ffb347', '#7cff7c', '#c084fc', '#ff6b6b', '#facc15'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
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
  document.body.classList.add(`blink-${color}`);
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
