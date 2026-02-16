// =================
// ⚙️ App setup 
// =================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs'); 
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// ========================
// 🏷️ Track player states
// ========================

const playerStreaks = {};                // Tracks each player's correct streak
const playerErrors = {};                // Tracks incorrect attempts per player
const playerTotalErrors = {};          // Tracks total incorrect attempts per player for accuracy
let achievements = [];                // Tracks Achievements
const playerMaxStreak = {};          // Tracks overall streak of each player
const playerLongWords = {};         // Tracks long words of each player
const playerRareLetters = {};      //  Tracks (Q,V,X,Y,Z)
const roomAchievementCounts = {}; // Tracks total number of Achievement for each player

// ========================
// 📄 Load words from file
// ========================

const WORD_LIST = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'data', 'words.txt'), 'utf-8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

// ========================
// 🧠 Game state management
// ========================

const roomCreators = {};                 // Tracks who created each room
const roomWordChains = {};              // Tracks words exchanged
const roomScores = {};                 // Tracks scores of each player in the room
const roomTurns = {};                 // Track  turn for each player
const playerTimeLeft = {};           // Tracks amount of time left for each player
const roomTimers = {};              // Tracks room time
const roomUsernames = {};          // Tracks names of player in a room
const roomPlayerOrder = {};       // Tracks order/turn of player 
const roomMinLength = {};        // Tracks current enforced minLength per room
const roomLastAIWord = {};      // Tracks last AI word by room for achievements
const playerQuickStreak = {};  // Tracks consecutive plays with >=30s left per player per room
const roomPlayerStatus = {};   // Tracks player status per room (active, eliminated, left)
const TURN_TIME = 60;         // Tracks seconds per player
const AI_ID = 'AI_PLAYER';   // Tracks AI in room
const AI_NAME = 'Max (BOT)';// Tracks name of Bot

// =====================================
// 🔄 Backward compatibility routes (old URLs)
// =====================================
// These routes support old URLs that referenced files directly from root
// Files are now in frontend/pages/ but old links should still work
// IMPORTANT: These routes must come BEFORE static middleware to take precedence

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

app.get('/mm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'mm.html'));
});

app.get('/sm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'sm.html'));
});

app.get('/result.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'result.html'));
});

app.get('/resultmm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'resultmm.html'));
});

app.get('/lr.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'lr.html'));
});

// Redirect difficulty.html to index - difficulty selection is now inline
app.get('/difficulty.html', (req, res) => {
  res.redirect('/');
});

app.get('/tips.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'tips.html'));
});

app.get('/HTP.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'HTP.html'));
});

app.get('/loading.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'loading.html'));
});

app.get('/achivement.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'achivement.html'));
});

app.get('/feedback.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'feedback.html'));
});

// =====================================
// 📁 Serve static files (HTML/CSS/JS)
// =====================================
// Static middleware comes after specific routes so those routes take precedence
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// =====================================
//    ⏰ TURN TIMER FUNCTION
// =====================================

function startTurnTimer(roomName) {
  clearInterval(roomTimers[roomName]);

  const order = roomPlayerOrder[roomName] || [];
  if (!order.length) return;

  // Ensure current player is valid
  if (!roomTurns[roomName] || !order.includes(roomTurns[roomName])) {
    roomTurns[roomName] = order[0];
  }

  const currentPlayer = roomTurns[roomName];

  if (!playerTimeLeft[roomName]) playerTimeLeft[roomName] = {};
  if (typeof playerTimeLeft[roomName][currentPlayer] !== 'number') {
    playerTimeLeft[roomName][currentPlayer] = TURN_TIME;
  }

  let timeLeft = playerTimeLeft[roomName][currentPlayer];
  io.to(roomName).emit('turnChanged', currentPlayer);
  io.to(roomName).emit('timerUpdate', timeLeft);

  roomTimers[roomName] = setInterval(() => {
    // If current player left/eliminated, advance immediately
    const orderNow = roomPlayerOrder[roomName] || [];
    if (!orderNow.includes(roomTurns[roomName])) {
      clearInterval(roomTimers[roomName]);
      advanceTurn(roomName);
      startTurnTimer(roomName);
      return;
    }

    timeLeft--;
    playerTimeLeft[roomName][currentPlayer] = timeLeft;
    io.to(roomName).emit('timerUpdate', timeLeft);

    // Check for Last Second Hero achievement at exactly 10 seconds
    if (timeLeft === 10) {
      const currentSocket = [...io.sockets.sockets.values()].find(s => s.id === currentPlayer);
      if (currentSocket) {
        const gameState = { timeLeft: 10 };
        const lastSecondHero = {
          id: 'lastSecondHero',
          name: 'Last Second Hero',
          emoji: '⏰',
          description: 'Still alive when only 10 seconds remain!',
          check: (_, game) => game.timeLeft === 10,
        };
        
        if (lastSecondHero.check('', gameState)) {
          // Track achievement count per player
          roomAchievementCounts[roomName] = roomAchievementCounts[roomName] || {};
          roomAchievementCounts[roomName][currentPlayer] = (roomAchievementCounts[roomName][currentPlayer] || 0) + 1;

          currentSocket.emit('achievementUnlocked', {
            id: lastSecondHero.id,
            name: lastSecondHero.name,
            emoji: lastSecondHero.emoji,
            description: lastSecondHero.description,
            word: 'timer',
          });
          io.to(roomName).emit('playerAchievement', {
            playerId: currentPlayer,
            username: roomUsernames[roomName]?.[currentPlayer] || 'Player',
            id: lastSecondHero.id,
            name: lastSecondHero.name,
            emoji: lastSecondHero.emoji,
          });
        }
      }
    }

    if (timeLeft <= 0) {
      clearInterval(roomTimers[roomName]);
      const name = roomUsernames[roomName][currentPlayer] || 'Player';
      eliminatePlayer(roomName, currentPlayer, `⏳ ${name} ran out of time!`);
      return;
    }
  }, 1000);
}

function advanceTurn(roomName) {
  const order = roomPlayerOrder[roomName] || [];
  if (!order.length) return;
  const current = roomTurns[roomName];
  const idx = Math.max(0, order.indexOf(current));
  const nextIdx = (idx + 1) % order.length;
  roomTurns[roomName] = order[nextIdx];
  io.to(roomName).emit('turnChanged', roomTurns[roomName]);
}

function eliminatePlayer(roomName, playerId, reasonMsg) {
  // Remove from rotation
  roomPlayerOrder[roomName] = (roomPlayerOrder[roomName] || []).filter(id => id !== playerId);

  roomPlayerStatus[roomName] = roomPlayerStatus[roomName] || {};
  roomPlayerStatus[roomName][playerId] = 'eliminated';
  emitPlayerStatus(roomName);

  // Notify
  io.to(roomName).emit('toast', reasonMsg || `${roomUsernames[roomName][playerId] || 'Player'} eliminated`);

  // Win condition: last player standing
  const remaining = roomPlayerOrder[roomName] || [];
  if (remaining.length <= 1) {
    const winnerResult = computeWinnerResult(roomName, { type: 'timeout' });
    io.to(roomName).emit('gameOver', {
      winner: winnerResult.winner,
      reason: winnerResult.reason,
      scores: roomScores[roomName],
      wordChain: roomWordChains[roomName],
      usernames: roomUsernames[roomName],
      incorrect: playerTotalErrors[roomName] || {},
      extraStats: buildExtraStats(roomName),
    });
    return;
  }

  // Advance and continue
  advanceTurn(roomName);
  startTurnTimer(roomName);
}

// =====================================
//    🏆 ACHIEVEMENTS HELPER
// =====================================

function checkAndEmitAchievements(word, gameState, socket, roomName) {
  const defs = [
    {
      id: 'double_trouble',
      name: 'Double Trouble',
      emoji: '🅰🅰',
      description: 'Use a word that has two consecutive identical letters.',
      check: (w) => /(.)\1/.test(w),
    },
    {
      id: 'vowel_master',
      name: 'Vowel Master',
      emoji: '🎤',
      description: 'Play a word with at least 4 vowels.',
      check: (w) => (w.match(/[aeiou]/gi) || []).length >= 4,
    },
    {
      id: 'consonant_crusher',
      name: 'Consonant Crusher',
      emoji: '🔨',
      description: 'Play a word with 5 or more consonants.',
      check: (w) => (w.match(/[^aeiou]/gi) || []).length >= 5,
    },
    {
      id: 'quick_thinker',
      name: 'Quick Thinker',
      emoji: '🧠💡',
      description: 'Play 15 words in a row without letting the timer drop below 30 seconds.',
      check: (w, gs) => gs.streakWithoutTimerDrop >= 15,
    },
    {
      id: 'rebounder',
      name: 'Rebounder',
      emoji: '🔁',
      description: 'Play a word that starts with the last letter of the AI’s word and is longer.',
      check: (w, gs) => !!(gs.lastAIWord && w[0]?.toLowerCase() === gs.lastAIWord.slice(-1).toLowerCase() && w.length > gs.lastAIWord.length),
    },
    {
      id: 'silent_but_deadly',
      name: 'Silent but Deadly',
      emoji: '🤫',
      description: 'Use a word with no traditional vowels.',
      check: (w) => !/[aeiou]/i.test(w),
    },
    {
      id: 'wildcard',
      name: 'Wildcard',
      emoji: '🃏',
      description: 'Use a word that contains all 5 vowels.',
      check: (w) => ['a', 'e', 'i', 'o', 'u'].every((v) => w.includes(v)),
    },
    {
      id: 'letter_jumper',
      name: 'Letter Jumper',
      emoji: '🦘',
      description: 'Play a word that skips the next alphabetical letter from the previous word\'s end.',
      check: (w, gs) => {
        if (!gs.lastWord) return false;
        const prevEnd = gs.lastWord.slice(-1).toLowerCase().charCodeAt(0);
        const nextStart = w[0]?.toLowerCase().charCodeAt(0);
        return typeof nextStart === 'number' && nextStart - prevEnd > 1;
      },
    },
  ];

  const unlocked = [];
  defs.forEach((def) => {
    try {
      if (def.check(word, gameState)) unlocked.push(def);
    } catch (e) {
      // ignore malformed checks
    }
  });

  if (unlocked.length) {
    unlocked.forEach((def) => {
      // Track achievement count per player
      roomAchievementCounts[roomName] = roomAchievementCounts[roomName] || {};
      roomAchievementCounts[roomName][socket.id] = (roomAchievementCounts[roomName][socket.id] || 0) + 1;

      socket.emit('achievementUnlocked', {
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        description: def.description,
        word,
      });
      io.to(roomName).emit('playerAchievement', {
        playerId: socket.id,
        username: roomUsernames[roomName]?.[socket.id] || 'Player',
        id: def.id,
        name: def.name,
        emoji: def.emoji,
      });
    });
  }
}

// =====================================
//    🔌 SOCKET CONNECTION HANDLER
// =====================================

io.on('connection', (socket) => {
  console.log('🟢 A user connected:', socket.id);

  socket.on('createRoom', ({ roomName, username }) => {
    socket.join(roomName);
    roomWordChains[roomName] = [];
    roomScores[roomName] = { [socket.id]: 0 };
    roomTurns[roomName] = socket.id;
    roomPlayerOrder[roomName] = [socket.id];
    roomUsernames[roomName] = roomUsernames[roomName] || {};
    roomUsernames[roomName][socket.id] = username || 'Player';

    roomPlayerStatus[roomName] = roomPlayerStatus[roomName] || {};
    roomPlayerStatus[roomName][socket.id] = 'active';

    roomCreators[roomName] = socket.id;

    

    // Initialize per-player tracking for this room
    playerStreaks[roomName] = playerStreaks[roomName] || {};
    playerErrors[roomName] = playerErrors[roomName] || {};
    playerTotalErrors[roomName] = playerTotalErrors[roomName] || {};
    playerStreaks[roomName][socket.id] = 0;
    playerErrors[roomName][socket.id] = 0;
    playerTotalErrors[roomName][socket.id] = 0;

    playerMaxStreak[roomName] = playerMaxStreak[roomName] || {};
    playerLongWords[roomName] = playerLongWords[roomName] || {};
    playerRareLetters[roomName] = playerRareLetters[roomName] || {};
    roomAchievementCounts[roomName] = roomAchievementCounts[roomName] || {};
    playerMaxStreak[roomName][socket.id] = 0;
    playerLongWords[roomName][socket.id] = 0;
    playerRareLetters[roomName][socket.id] = 0;
    roomAchievementCounts[roomName][socket.id] = 0;

    socket.emit('roomCreated', roomName);
    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
    emitPlayerStatus(roomName);
    console.log(`🏗️ Room created: ${roomName}`);
    // Emit the count
  emitPlayerCount(roomName);
  });

  socket.on('joinRoom', ({ roomName, username }) => {
    // Validate room and capacity (max 6 players)
    if (!roomPlayerOrder[roomName]) {
      socket.emit('roomNotFound', 'Room not found');
      return;
    }
    if (roomPlayerOrder[roomName].length >= 6) {
      socket.emit('roomFull', '🚫 Room is full (max 6 players)');
      return;
    }
    socket.join(roomName);
    roomScores[roomName] = roomScores[roomName] || {};
    roomScores[roomName][socket.id] = 0;
    roomUsernames[roomName] = roomUsernames[roomName] || {};
    roomUsernames[roomName][socket.id] = username || 'Player';
    roomPlayerOrder[roomName].push(socket.id);

    roomPlayerStatus[roomName] = roomPlayerStatus[roomName] || {};
    roomPlayerStatus[roomName][socket.id] = 'active';

    // Initialize per-player tracking for this room
    playerStreaks[roomName] = playerStreaks[roomName] || {};
    playerErrors[roomName] = playerErrors[roomName] || {};
    playerTotalErrors[roomName] = playerTotalErrors[roomName] || {};
    playerStreaks[roomName][socket.id] = 0;
    playerErrors[roomName][socket.id] = 0;
    playerTotalErrors[roomName][socket.id] = 0;

    playerMaxStreak[roomName] = playerMaxStreak[roomName] || {};
    playerLongWords[roomName] = playerLongWords[roomName] || {};
    playerRareLetters[roomName] = playerRareLetters[roomName] || {};
    roomAchievementCounts[roomName] = roomAchievementCounts[roomName] || {};
    playerMaxStreak[roomName][socket.id] = 0;
    playerLongWords[roomName][socket.id] = 0;
    playerRareLetters[roomName][socket.id] = 0;
    roomAchievementCounts[roomName][socket.id] = 0;

    socket.emit('updateWordChain', roomWordChains[roomName] || []);
    socket.emit('roomJoined', roomName);
    io.to(roomName).emit('updateScores', roomScores[roomName]);
    io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
    emitPlayerStatus(roomName);
    io.to(roomName).emit('playerJoined', roomUsernames[roomName][socket.id]);
    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    socket.emit('toast', `Welcome to ${roomName}, ${roomUsernames[roomName][socket.id]}!`);
    startTurnTimer(roomName);
    console.log(`➡️ User joined room: ${roomName}`);
    // Emit the count
  emitPlayerCount(roomName);
    });

  socket.on('submitWord', (word) => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (!rooms.length) return;

    const roomName = rooms[0];
    word = word.trim().toLowerCase();

    if (!playerStreaks[roomName]) playerStreaks[roomName] = {};
    if (!playerErrors[roomName]) playerErrors[roomName] = {};
    if (!playerTotalErrors[roomName]) playerTotalErrors[roomName] = {};
    if (!playerStreaks[roomName][socket.id]) playerStreaks[roomName][socket.id] = 0;
    if (!playerErrors[roomName][socket.id]) playerErrors[roomName][socket.id] = 0;
    if (!playerTotalErrors[roomName][socket.id]) playerTotalErrors[roomName][socket.id] = 0;

    const chainLength = roomWordChains[roomName]?.length || 0;
    const minLength = Math.min(2 + Math.floor(chainLength / 10),7);
    // Notify players if minLength just increased
if (!roomMinLength[roomName]) roomMinLength[roomName] = 2;

if (minLength > roomMinLength[roomName]) {
  io.to(roomName).emit(
    'toast',
    `📏 Word length now must be at least ${minLength} letters!`
  );
  roomMinLength[roomName] = minLength;
}

if (word.length < minLength) {
  socket.emit(
    'wordRejected',
    `📏 Word must be at least ${minLength} letters long!`
  );
  return trackError();
}

if (!WORD_LIST.includes(word)) {
  socket.emit('wordRejected', '📚 Word not in dictionary!');
  return trackError();
}

if (roomWordChains[roomName].some(entry => entry.word === word)) {
  socket.emit('wordRejected', '🔁 Word already used!');
  return trackError();
}

if (roomWordChains[roomName].length > 0) {
  const lastWord = roomWordChains[roomName].at(-1).word;
  if (word[0] !== lastWord.at(-1)) {
    socket.emit(
      'wordRejected',
      `🔤 Word must start with "${lastWord.at(-1)}"`
    );
    return trackError();
  }
}

    // Word accepted
    roomWordChains[roomName].push({ word, playerId: socket.id });

let baseScore = 1;
let bonus = 0;

// Update streaks and reset error count
playerStreaks[roomName][socket.id]++;
playerErrors[roomName][socket.id] = 0;
console.log(`❌ Streak reset for ${socket.id}, now:`, playerStreaks[roomName][socket.id]);


// Define streak after updating it
const streak = playerStreaks[roomName][socket.id];
// Track max streak per player
playerMaxStreak[roomName] = playerMaxStreak[roomName] || {};
playerMaxStreak[roomName][socket.id] = Math.max(playerMaxStreak[roomName][socket.id] || 0, streak);

if (streak === 3) {
  bonus = 1;
  socket.emit('toast', '🔥 3-streak! Bonus +1');
} else if (streak === 5) {
  bonus = 3;
  socket.emit('toast', '⚡ 5-streak! Bonus +3');
}
else if (streak === 7) {
  bonus = 5;
  socket.emit('toast', '🎉 7-streak! Bonus +5');
}
else if (streak >= 10) {
  bonus =7;
  socket.emit('toast', '🚀 10-streak! Bonus +7');
}
else if (streak >= 15) {
  bonus = 10;
  socket.emit('toast', '🌟 15-streak! Bonus +10');
}
// Add bonus for rare letters/words
const rareLetters = ['q','x','u','z', 'v', 'w', 'y','leap','letter'];
if (rareLetters.some(letter => word.includes(letter))) {  
  bonus += 2;
  socket.emit('toast', `💎 Rare letters! Bonus +2`) ;
  // Track rare-letter usage
  playerRareLetters[roomName] = playerRareLetters[roomName] || {};
  playerRareLetters[roomName][socket.id] = (playerRareLetters[roomName][socket.id] || 0) + 1;
}
// Add bonus for long words 
if (word.length >= 12) {
  bonus += 3;
  socket.emit('toast', `📏 Long word! Bonus +3`);
  // Track long-word usage
  playerLongWords[roomName] = playerLongWords[roomName] || {};
  playerLongWords[roomName][socket.id] = (playerLongWords[roomName][socket.id] || 0) + 1;
}

// Achievements: update quick streak and evaluate
if (!playerQuickStreak[roomName]) playerQuickStreak[roomName] = {};
if (typeof playerQuickStreak[roomName][socket.id] !== 'number') playerQuickStreak[roomName][socket.id] = 0;
let currentTime = (playerTimeLeft[roomName] && typeof playerTimeLeft[roomName][socket.id] === 'number') ? playerTimeLeft[roomName][socket.id] : TURN_TIME;
if (currentTime >= 30) {
  playerQuickStreak[roomName][socket.id] += 1;
} else {
  playerQuickStreak[roomName][socket.id] = 0;
}
const gameState = {
  lastWord: roomWordChains[roomName].length > 1 ? roomWordChains[roomName][roomWordChains[roomName].length - 2].word : null,
  lastAIWord: roomLastAIWord[roomName] || null,
  streakWithoutTimerDrop: playerQuickStreak[roomName][socket.id],
};
checkAndEmitAchievements(word, gameState, socket, roomName);


    const totalScore = baseScore + bonus;
    roomScores[roomName][socket.id] += totalScore;

    playerTimeLeft[roomName][socket.id] += 10;
    io.to(roomName).emit('timerUpdate', playerTimeLeft[roomName][socket.id]);

    io.to(roomName).emit('updateWordChain', roomWordChains[roomName]);
    io.to(roomName).emit('updateScores', roomScores[roomName]);


    const playerIds = roomPlayerOrder[roomName];
    const currentIdx = playerIds.indexOf(socket.id);
    const nextIdx = (currentIdx + 1) % playerIds.length;
    roomTurns[roomName] = playerIds[nextIdx];

    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    startTurnTimer(roomName);

    if (roomTurns[roomName] === AI_ID) aiPlay(roomName);

    function trackError() {
      playerErrors[roomName][socket.id]++;
      playerTotalErrors[roomName][socket.id] = (playerTotalErrors[roomName][socket.id] || 0) + 1;
      playerStreaks[roomName][socket.id] = 0;

      if (playerErrors[roomName][socket.id] % 2 === 0) {
        roomScores[roomName][socket.id] = Math.max(0, roomScores[roomName][socket.id] - 1);
        socket.emit('penalty', '-1 for 2 incorrect attempts! 🚫');
        io.to(roomName).emit('updateScores', roomScores[roomName]);
      }
    }
  });



  socket.on('rematchRequest', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (!rooms.length) return;

    const roomName = rooms[0];
    roomWordChains[roomName] = [];
    Object.keys(roomScores[roomName]).forEach(id => roomScores[roomName][id] = 0);
    playerTimeLeft[roomName] = {};
    // Reset per-player tracking for a clean rematch
    playerStreaks[roomName] = {};
    playerErrors[roomName] = {};
    playerTotalErrors[roomName] = {};
    playerMaxStreak[roomName] = {};
    playerLongWords[roomName] = {};
    playerRareLetters[roomName] = {};
    roomAchievementCounts[roomName] = {};

    roomPlayerStatus[roomName] = roomPlayerStatus[roomName] || {};
    (roomPlayerOrder[roomName] || []).forEach((id) => {
      roomPlayerStatus[roomName][id] = 'active';
    });
    emitPlayerStatus(roomName);

    io.to(roomName).emit('updateWordChain', []);
    io.to(roomName).emit('updateScores', roomScores[roomName]);

    roomTurns[roomName] = socket.id;
    Object.keys(roomScores[roomName]).forEach(id => {
      playerTimeLeft[roomName][id] = TURN_TIME;
    });

    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    startTurnTimer(roomName);

    if (roomTurns[roomName] === AI_ID) aiPlay(roomName);
  });

  socket.on('chooseStartLetter', ({ roomName, letter }) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room || room.size < 2) {
      socket.emit('notEnoughPlayers');
      return;
    }

    const startLetter = letter || 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    io.to(roomName).emit('startGame', startLetter);
  });

  socket.on('startGameConfirmed', (roomName) => {
  console.log(`⏱️ Timer starting for room: ${roomName}`);
  startTurnTimer(roomName);
});

  socket.on('leaveRoom', ({ roomName }) => {
    if (!roomName || !roomUsernames[roomName]?.[socket.id]) return;
    handlePlayerExit(roomName, socket.id, 'left');
    socket.leave(roomName);
  });

// =====================================
//  🔴  SOCKET DISCONNECTION HANDLER
// =====================================

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
    for (const roomName in roomUsernames) {
      if (roomUsernames[roomName][socket.id]) {
        handlePlayerExit(roomName, socket.id, 'left');

      }
    }
  });

// =====================================
//   🤖 AI HANDLER
// =====================================

  socket.on('addAI', ({ roomName }) => {
    if (roomPlayerOrder[roomName] && roomPlayerOrder[roomName].length >= 6) {
      socket.emit('roomFull', '🚫 Room is full (max 6 players)');
      return;
    }
    if (!roomScores[roomName][AI_ID]) {
      roomScores[roomName][AI_ID] = 0;
      roomUsernames[roomName][AI_ID] = AI_NAME;
      roomPlayerOrder[roomName].push(AI_ID);
      io.to(roomName).emit('updateScores', roomScores[roomName]);
      io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
      io.to(roomName).emit('aiAdded');

      if (!roomTurns[roomName]) {
        roomTurns[roomName] = Object.keys(roomScores[roomName])[0];
      }
    }
  });

  socket.on('removeAI', ({ roomName }) => {
    if (roomScores[roomName][AI_ID]) {
      delete roomScores[roomName][AI_ID];
      delete roomUsernames[roomName][AI_ID];
      roomPlayerOrder[roomName] = roomPlayerOrder[roomName].filter(id => id !== AI_ID);
      io.to(roomName).emit('updateScores', roomScores[roomName]);
      io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
      io.to(roomName).emit('aiRemoved');
    }
  });

  function aiPlay(roomName) {
    const chain = roomWordChains[roomName] || [];
    const usedWords = new Set(chain.map(entry => entry.word));
    const nextLetter = chain.length ? chain.at(-1).word.slice(-1) : '';
    const chainLength = roomWordChains[roomName]?.length || 0;
    const minLength = Math.min(2 + Math.floor(chainLength / 10),7);

    let candidates = WORD_LIST.filter(word => 
      word.length >= minLength &&
      !usedWords.has(word) &&
      (nextLetter === '' || word[0] === nextLetter)
    );

    let maxLen = Math.max(...candidates.map(w => w.length), 0);
    let longWords = candidates.filter(w => w.length === maxLen);
    const rareLetters = ['q','u','x', 'z', 'v', 'w', 'y'];
    let trapWords = longWords.filter(word => rareLetters.includes(word.at(-1)));

    let aiWord = trapWords[0] || longWords[0] || candidates[0] || 'ai';

    setTimeout(() => {
      roomWordChains[roomName].push({ word: aiWord, playerId: AI_ID });
      roomLastAIWord[roomName] = aiWord;
      roomScores[roomName][AI_ID]++;
      io.to(roomName).emit('updateWordChain', roomWordChains[roomName]);
      io.to(roomName).emit('updateScores', roomScores[roomName]);

      const playerIds = roomPlayerOrder[roomName];
      const nextIdx = (playerIds.indexOf(AI_ID) + 1) % playerIds.length;
      roomTurns[roomName] = playerIds[nextIdx];

      io.to(roomName).emit('turnChanged', roomTurns[roomName]);
      startTurnTimer(roomName);

      if (roomTurns[roomName] === AI_ID) aiPlay(roomName);
    }, 1200);
  }
});

//Number of players in room
function emitPlayerCount(roomName) {
  const players = roomPlayerOrder[roomName] || [];
  const realPlayers = players.filter(id => id !== AI_ID); // exclude AI
  io.to(roomName).emit('playerCountUpdate', realPlayers.length);
}

function emitPlayerStatus(roomName) {
  io.to(roomName).emit('updatePlayerStatus', roomPlayerStatus[roomName] || {});
}

function getRealPlayerIds(roomName) {
  return Object.keys(roomScores[roomName] || {}).filter(id => id !== AI_ID);
}

function computeWinnerResult(roomName, context = {}) {
  const realIds = getRealPlayerIds(roomName);
  if (realIds.length === 2) {
    const [a, b] = realIds;
    const scoreA = roomScores[roomName]?.[a] || 0;
    const scoreB = roomScores[roomName]?.[b] || 0;
    if (scoreA === scoreB) {
      return { winner: 'Tie', reason: 'Scores are tied' };
    }
    const winnerId = scoreA > scoreB ? a : b;
    const winnerName = roomUsernames[roomName]?.[winnerId] || 'Winner';
    let reason = 'Won by higher score';
    if (context.type === 'timeout') {
      reason = 'Won by higher score after timeout';
    } else if (context.type === 'left') {
      reason = 'Won by higher score after opponent left';
    }
    return { winner: winnerName, reason };
  }

  const remaining = roomPlayerOrder[roomName] || [];
  const winnerId = remaining[0];
  const winnerName = winnerId ? (roomUsernames[roomName]?.[winnerId] || 'Winner') : 'No winner';
  return { winner: winnerName, reason: context.reason || 'Last player standing' };
}

function handlePlayerExit(roomName, playerId, exitType) {
  const name = roomUsernames[roomName]?.[playerId] || 'Player';
  roomPlayerStatus[roomName] = roomPlayerStatus[roomName] || {};
  roomPlayerStatus[roomName][playerId] = 'left';
  emitPlayerStatus(roomName);

  roomPlayerOrder[roomName] = (roomPlayerOrder[roomName] || []).filter(id => id !== playerId);
  io.to(roomName).emit('opponentLeft', name);

  if (roomTurns[roomName] === playerId) {
    roomTurns[roomName] = undefined;
    startTurnTimer(roomName);
  }

  const remaining = roomPlayerOrder[roomName] || [];
  if (remaining.length <= 1) {
    const winnerResult = computeWinnerResult(roomName, { type: exitType, reason: 'All other players left' });
    io.to(roomName).emit('gameOver', {
      winner: winnerResult.winner,
      reason: winnerResult.reason,
      scores: roomScores[roomName],
      wordChain: roomWordChains[roomName],
      usernames: roomUsernames[roomName],
      incorrect: playerTotalErrors[roomName] || {},
      extraStats: buildExtraStats(roomName),
    });
  }

  emitPlayerCount(roomName);
}




// Build per-player extra stats for results
function buildExtraStats(roomName) {
  const idsSet = new Set([
    ...Object.keys(roomUsernames[roomName] || {}),
    ...Object.keys(roomScores[roomName] || {}),
  ]);
  const stats = {};
  for (const id of idsSet) {
    stats[id] = {
      maxStreak: (playerMaxStreak[roomName] && playerMaxStreak[roomName][id]) || 0,
      longWords: (playerLongWords[roomName] && playerLongWords[roomName][id]) || 0,
      rareLetters: (playerRareLetters[roomName] && playerRareLetters[roomName][id]) || 0,
      achievements: (roomAchievementCounts[roomName] && roomAchievementCounts[roomName][id]) || 0,
    };
  }
  return stats;
}

// =====================================
//   🚀 Start server 
// =====================================

server.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});