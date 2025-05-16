// server.js
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid"); // npm install uuid

// Config port (env variable or default to 3000)
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

/*
  Data structures:
  rooms = {
    [roomId]: {
      players: Map(ws => playerInfo),
      wordChain: [],
      currentTurnPlayerId,
      scores: { playerId: score, ... }
    }
  }
*/
const rooms = new Map();

wss.on("connection", (ws) => {
  ws.id = uuidv4(); // unique player ID
  ws.roomId = null;

  console.log(`👤 Player connected: ${ws.id}`);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      // console.log("📩 Received:", data);

      switch (data.type) {
        case "create-room":
          {
            const roomId = uuidv4().slice(0, 6); // short room ID
            rooms.set(roomId, {
              players: new Map([[ws.id, ws]]),
              wordChain: [],
              currentTurnPlayerId: ws.id,
              scores: { [ws.id]: 0 },
            });
            ws.roomId = roomId;
            ws.send(JSON.stringify({ type: "room-created", roomId }));
            ws.send(
              JSON.stringify({ type: "start-game", isYourTurn: true })
            );
            console.log(`Room created: ${roomId} by player ${ws.id}`);
          }
          break;

        case "join-room":
          {
            const roomId = data.roomId;
            if (!rooms.has(roomId)) {
              ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
              return;
            }
            const room = rooms.get(roomId);
            if (room.players.size >= 2) {
              ws.send(JSON.stringify({ type: "error", message: "Room full" }));
              return;
            }
            room.players.set(ws.id, ws);
            room.scores[ws.id] = 0;
            ws.roomId = roomId;

            // Notify this player and others
            ws.send(
              JSON.stringify({ type: "room-joined", roomId, isYourTurn: false })
            );
            // Inform existing player game started with turn
            room.players.forEach((playerWs, playerId) => {
              if (playerId !== ws.id) {
                playerWs.send(JSON.stringify({ type: "start-game", isYourTurn: true }));
              }
            });

            console.log(`Player ${ws.id} joined room ${roomId}`);

            // Send current word chain & scores to all players
            broadcastRoomState(roomId);
          }
          break;

        case "word":
          {
            const roomId = ws.roomId;
            if (!roomId || !rooms.has(roomId)) {
              ws.send(JSON.stringify({ type: "error", message: "You're not in a room" }));
              return;
            }
            const room = rooms.get(roomId);

            if (room.currentTurnPlayerId !== ws.id) {
              ws.send(JSON.stringify({ type: "error", message: "Not your turn" }));
              return;
            }

            const word = data.word.trim().toUpperCase();

            // Validate word starts with last letter of last word (if any)
            const lastWord = room.wordChain.length
              ? room.wordChain[room.wordChain.length - 1]
              : null;

            if (
              lastWord &&
              word[0] !== lastWord[lastWord.length - 1]
            ) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: `Word must start with "${lastWord[lastWord.length - 1]}"`,
                })
              );
              return;
            }

            // No duplicates
            if (room.wordChain.includes(word)) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Word already used",
                })
              );
              return;
            }

            // Accept word
            room.wordChain.push(word);
            room.scores[ws.id] = (room.scores[ws.id] || 0) + 1;

            // Switch turn to other player
            const playerIds = Array.from(room.players.keys());
            const otherPlayerId = playerIds.find((id) => id !== ws.id);
            room.currentTurnPlayerId = otherPlayerId;

            // Broadcast word & updated state
            broadcastRoomState(roomId, word, ws.id);

            console.log(`Room ${roomId}: Player ${ws.id} played word "${word}"`);
          }
          break;

        case "turn-passed":
          {
            const roomId = ws.roomId;
            if (!roomId || !rooms.has(roomId)) {
              ws.send(JSON.stringify({ type: "error", message: "You're not in a room" }));
              return;
            }
            const room = rooms.get(roomId);

            if (room.currentTurnPlayerId !== ws.id) {
              ws.send(JSON.stringify({ type: "error", message: "Not your turn" }));
              return;
            }

            // Pass turn to other player
            const playerIds = Array.from(room.players.keys());
            const otherPlayerId = playerIds.find((id) => id !== ws.id);
            room.currentTurnPlayerId = otherPlayerId;

            // Notify players
            broadcastRoomState(roomId, null, null, "turn-passed");

            console.log(`Room ${roomId}: Player ${ws.id} passed turn`);
          }
          break;

        case "leave-room":
          {
            const roomId = ws.roomId;
            if (!roomId || !rooms.has(roomId)) return;
            const room = rooms.get(roomId);
            room.players.delete(ws.id);
            delete room.scores[ws.id];

            // If no players left, delete room
            if (room.players.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted (empty)`);
            } else {
              // Pass turn to remaining player if needed
              if (room.currentTurnPlayerId === ws.id) {
                const remainingPlayerId = Array.from(room.players.keys())[0];
                room.currentTurnPlayerId = remainingPlayerId;
                broadcastRoomState(roomId, null, null, "player-left");
              }
            }

            ws.roomId = null;
            console.log(`Player ${ws.id} left room ${roomId}`);
          }
          break;

        default:
          ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
      }
    } catch (err) {
      console.error("❌ Failed to parse message:", err);
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log(`🚪 Player disconnected: ${ws.id}`);

    // Clean up player from room if any
    if (ws.roomId && rooms.has(ws.roomId)) {
      const room = rooms.get(ws.roomId);
      room.players.delete(ws.id);
      delete room.scores[ws.id];

      if (room.players.size === 0) {
        rooms.delete(ws.roomId);
        console.log(`Room ${ws.roomId} deleted (empty)`);
      } else {
        // Pass turn if needed
        if (room.currentTurnPlayerId === ws.id) {
          const remainingPlayerId = Array.from(room.players.keys())[0];
          room.currentTurnPlayerId = remainingPlayerId;
          broadcastRoomState(ws.roomId, null, null, "player-left");
        }
      }
    }
  });
});

function broadcastRoomState(roomId, newWord = null, playerId = null, eventType = "word") {
  if (!rooms.has(roomId)) return;
  const room = rooms.get(roomId);

  const payload = {
    type: eventType,
    word: newWord,
    playerId,
    wordChain: room.wordChain,
    scores: room.scores,
    currentTurnPlayerId: room.currentTurnPlayerId,
  };

  room.players.forEach((playerWs) => {
    playerWs.send(JSON.stringify(payload));
  });
}

console.log(`WebSocket server running on ws://localhost:${PORT}`);
