const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Load words from file
const WORD_LIST = fs.readFileSync(path.join(__dirname, '../../words.txt'), 'utf-8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

// Store word chains for each room
const roomWordChains = {};
const roomScores = {};
const roomTurns = {};
const TURN_TIME = 60; // seconds per player
const playerTimeLeft = {}; // { roomName: { socketId: secondsLeft, ... } }
const roomTimers = {};
const roomUsernames = {};

const AI_ID = 'AI_PLAYER';
const AI_NAME = 'AI Bot';

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));

function startTurnTimer(roomName) {
  clearInterval(roomTimers[roomName]);
  const currentPlayer = roomTurns[roomName];
  if (!playerTimeLeft[roomName]) playerTimeLeft[roomName] = {};
  if (typeof playerTimeLeft[roomName][currentPlayer] !== 'number') {
    playerTimeLeft[roomName][currentPlayer] = TURN_TIME;
  }
  let timeLeft = playerTimeLeft[roomName][currentPlayer];
  io.to(roomName).emit('timerUpdate', timeLeft);

  roomTimers[roomName] = setInterval(() => {
    timeLeft--;
    playerTimeLeft[roomName][currentPlayer] = timeLeft;
    io.to(roomName).emit('timerUpdate', timeLeft);
    if (timeLeft <= 0) {
      clearInterval(roomTimers[roomName]);
      // End game due to timeout
      const loserId = currentPlayer;
      const winnerId = Object.keys(roomScores[roomName]).find(id => id !== loserId);
      let winnerName = winnerId && roomUsernames[roomName][winnerId] ? roomUsernames[roomName][winnerId] : 'Opponent';
      let loserName = roomUsernames[roomName][loserId] || 'Player';
      io.to(roomName).emit('gameOver', {
        winner: winnerName,
        reason: `Time's up for ${loserName}!`
      });
    }
  }, 1000);
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Room creation
  socket.on('createRoom', (data) => {
    const { roomName, username } = data;
    socket.join(roomName);
    roomWordChains[roomName] = [];
    roomScores[roomName] = {};
    roomScores[roomName][socket.id] = 0;
    roomTurns[roomName] = socket.id;
    if (!roomUsernames[roomName]) roomUsernames[roomName] = {};
    roomUsernames[roomName][socket.id] = username || 'Player';
    socket.emit('roomCreated', roomName);
    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
    startTurnTimer(roomName);
    console.log(`Room created: ${roomName}`);
  });

  // Room joining
  socket.on('joinRoom', (data) => {
    const { roomName, username } = data;
    socket.join(roomName);
    if (!roomScores[roomName]) roomScores[roomName] = {};
    roomScores[roomName][socket.id] = 0;
    if (!roomUsernames[roomName]) roomUsernames[roomName] = {};
    roomUsernames[roomName][socket.id] = username || 'Player';
    socket.emit('updateWordChain', roomWordChains[roomName] || []);
    socket.emit('roomJoined', roomName);
    io.to(roomName).emit('updateScores', roomScores[roomName]);
    io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
    io.to(roomName).emit('turnChanged', roomTurns[roomName]);
    startTurnTimer(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  // Handle word submission
  socket.on('submitWord', (word) => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (rooms.length > 0) {
      const roomName = rooms[0];
      word = word.trim().toLowerCase();

      // Minimum word length logic
      const minLength = (roomWordChains[roomName].length >= 10) ? 3 : 2;
      if (word.length < minLength) {
        socket.emit('wordRejected', `Word must be at least ${minLength} letters long!`);
        return;
      }

      // Check if word is in the list
      if (!WORD_LIST.includes(word)) {
        socket.emit('wordRejected', 'Word not in dictionary!');
        return;
      }

      // Check for duplicate
      if (roomWordChains[roomName].some(entry => entry.word === word)) {
        socket.emit('wordRejected', 'Word already used!');
        return;
      }

      // Last letter mode
      if (roomWordChains[roomName].length > 0) {
        const lastWord = roomWordChains[roomName][roomWordChains[roomName].length - 1].word;
        if (word[0] !== lastWord[lastWord.length - 1]) {
          socket.emit('wordRejected', `Word must start with "${lastWord[lastWord.length - 1]}"`);
          return;
        }
      }

      roomWordChains[roomName].push({ word, playerId: socket.id });
      io.to(roomName).emit('updateWordChain', roomWordChains[roomName]);

      // Increment score
      if (!roomScores[roomName]) roomScores[roomName] = {};
      if (!roomScores[roomName][socket.id]) roomScores[roomName][socket.id] = 0;
      roomScores[roomName][socket.id] += 1;

      io.to(roomName).emit('updateScores', roomScores[roomName]);

      // Check for game over
      if (roomScores[roomName][socket.id] >= 10) {
        io.to(roomName).emit('gameOver', {
          winner: roomUsernames[roomName][socket.id] || 'Player',
          score: roomScores[roomName][socket.id]
        });
        return;
      }

      // Switch turn to the other player
      const playerIds = Object.keys(roomScores[roomName]);
      const nextPlayer = playerIds.find(id => id !== socket.id);
      if (nextPlayer) {
        roomTurns[roomName] = nextPlayer;
        io.to(roomName).emit('turnChanged', roomTurns[roomName]);
        startTurnTimer(roomName);
        // If it's AI's turn, make the AI play
        if (roomTurns[roomName] === AI_ID) {
          aiPlay(roomName);
        }
      }
    }
  });

  socket.on('rematchRequest', () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    if (rooms.length > 0) {
      const roomName = rooms[0];
      roomWordChains[roomName] = [];
      Object.keys(roomScores[roomName]).forEach(id => roomScores[roomName][id] = 0);
      io.to(roomName).emit('updateWordChain', []);
      io.to(roomName).emit('updateScores', roomScores[roomName]);
      // Reset turn to the player who requested rematch
      roomTurns[roomName] = socket.id;

      // Reset per-player timers
      playerTimeLeft[roomName] = {};
      Object.keys(roomScores[roomName]).forEach(id => {
        playerTimeLeft[roomName][id] = TURN_TIME;
      });

      io.to(roomName).emit('turnChanged', roomTurns[roomName]);
      startTurnTimer(roomName);
      // If it's AI's turn, make the AI play
      if (roomTurns[roomName] === AI_ID) {
        aiPlay(roomName);
      }
    }
  });

  socket.on('chooseStartLetter', ({ roomName, letter }) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room || room.size < 2) {
      socket.emit('notEnoughPlayers');
      return;
    }
    let startLetter = letter;
    if (!startLetter) {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      startLetter = alphabet[Math.floor(Math.random() * 26)];
    }
    io.to(roomName).emit('startGame', startLetter);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Notify others in the room
    for (const roomName in roomUsernames) {
      if (roomUsernames[roomName][socket.id]) {
        socket.to(roomName).emit('opponentLeft', roomUsernames[roomName][socket.id]);
        // Optionally: clean up room state here
        delete roomUsernames[roomName][socket.id];
        delete roomScores[roomName][socket.id];
      }
    }
  });

  socket.on('addAI', ({ roomName }) => {
    if (!roomScores[roomName][AI_ID]) {
      roomScores[roomName][AI_ID] = 0;
      roomUsernames[roomName][AI_ID] = AI_NAME;
      io.to(roomName).emit('updateScores', roomScores[roomName]);
      io.to(roomName).emit('updateUsernames', roomUsernames[roomName]);
      io.to(roomName).emit('aiAdded');
      if (!roomTurns[roomName]) {
        roomTurns[roomName] = socket.id;
      }
    }
  });

  function aiPlay(roomName) {
    // Find the last word and next letter
    const chain = roomWordChains[roomName] || [];
    let nextLetter = '';
    if (chain.length === 0) {
      nextLetter = '';
    } else {
      nextLetter = chain[chain.length - 1].word.slice(-1);
    }
    // Find a valid word from your WORD_LIST
    const usedWords = new Set(chain.map(entry => entry.word));
    const minLength = (chain.length >= 10) ? 3 : 2;
    // Find all valid words
    let candidates = WORD_LIST.filter(word =>
      word.length >= minLength &&
      !usedWords.has(word) &&
      (nextLetter === '' || word[0] === nextLetter)
    );

    // Prefer the longest words
    let maxLen = 0;
    candidates.forEach(word => { if (word.length > maxLen) maxLen = word.length; });
    let longWords = candidates.filter(word => word.length === maxLen);

    // Try to pick a word that ends with a rare letter
    const rareLetters = ['q', 'x', 'z', 'v', 'w', 'y', 'z'];
    let trapWords = longWords.filter(word => rareLetters.includes(word.slice(-1)));

    let aiWord;
    if (trapWords.length > 0) {
      aiWord = trapWords[Math.floor(Math.random() * trapWords.length)];
    } else if (longWords.length > 0) {
      aiWord = longWords[Math.floor(Math.random() * longWords.length)];
    } else if (candidates.length > 0) {
      aiWord = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      aiWord = 'ai'; // fallback if no word found
    }

    // Simulate AI thinking delay
    setTimeout(() => {
      // Add word as if AI submitted it
      roomWordChains[roomName].push({ word: aiWord, playerId: AI_ID });
      roomScores[roomName][AI_ID]++;
      io.to(roomName).emit('updateWordChain', roomWordChains[roomName]);
      io.to(roomName).emit('updateScores', roomScores[roomName]);
      // Switch turn back to human
      const humanId = Object.keys(roomScores[roomName]).find(id => id !== AI_ID);
      roomTurns[roomName] = humanId;
      io.to(roomName).emit('turnChanged', roomTurns[roomName]);
      startTurnTimer(roomName);
    }, 1200); // 1.2s delay for realism
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});