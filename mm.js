// mm.js

let socket;
let playerId = null;
let roomId = null;
let isPlayerTurn = false;
let timerInterval;
let timeLeft = 60;

const lastWordEl = document.getElementById("last-word");
const nextLetterEl = document.getElementById("next-letter");
const wordChainEl = document.getElementById("word-chain");
const playerScoreEl = document.getElementById("player-score");
const opponentScoreEl = document.getElementById("opponent-score");
const popupMessage = document.getElementById("popup-message");
const wordInput = document.getElementById("word-input");
const submitBtn = document.getElementById("submit-btn");
const roomIdEl = document.getElementById("room-id");
const copyRoomBtn = document.getElementById("copy-room-btn");
const leaveBtn = document.getElementById("leave-btn");
const timerEl = document.getElementById("timer");

const createRoomBtn = document.getElementById("btn-create-room");
const joinRoomBtn = document.getElementById("btn-join-room");
const joinRoomInput = document.getElementById("join-room-input");
const statusMessage = document.getElementById("status-message");

function showPopup(message) {
  popupMessage.textContent = message;
  popupMessage.style.display = "block";
  setTimeout(() => {
    popupMessage.style.display = "none";
  }, 3000);
}

function updateTimer() {
  timerEl.textContent = `⏳ Time left: ${timeLeft}s`;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    showPopup("⏰ Time’s up! Passing turn...");
    passTurn();
  }
  timeLeft--;
  
  if (timeLeft <= 10) {
  timerEl.classList.add("low-time");
} else {
  timerEl.classList.remove("low-time");
}

}

function toggleTurn(turn) {
  isPlayerTurn = turn;
  wordInput.disabled = !turn;
  submitBtn.disabled = !turn;

  if (turn) {
    wordInput.focus();
    timeLeft = 60;
    timerEl.style.color = "black";
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    clearInterval(timerInterval);
    timerEl.style.color = "gray";
  }
}

function disableGameInputs() {
  wordInput.disabled = true;
  submitBtn.disabled = true;
  leaveBtn.disabled = true;
  copyRoomBtn.disabled = true;
}

function enableGameInputs() {
  leaveBtn.disabled = false;
  copyRoomBtn.disabled = false;
}

function connect() {
socket = new WebSocket("wss://letter-leap.onrender.com");

  socket.onopen = () => {
    console.log("Connected to server");
    statusMessage.textContent = "Connected! Create or join a room.";
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("From server:", data);

    switch (data.type) {
      case "assign-player-id":
        playerId = data.playerId;
        break;

      case "room-created":
        roomId = data.roomId;
        roomIdEl.textContent = roomId;
        statusMessage.textContent = `Room created! ID: ${roomId}`;
        enableGameInputs();
        break;

      case "room-joined":
        roomId = data.roomId;
        roomIdEl.textContent = roomId;
        statusMessage.textContent = `Joined room ${roomId}`;
        enableGameInputs();
        break;

      case "start-game":
        toggleTurn(data.isYourTurn);
        if (data.isYourTurn) showPopup("Your turn! Type a word.");
        else showPopup("Waiting for opponent...");
        break;

      case "word":
        {
          const word = data.word.toUpperCase();
          lastWordEl.textContent = word;

          // Next letter is last letter of last word
          const nextChar = word[word.length - 1];
          nextLetterEl.textContent = nextChar;

          // Clear and rebuild word chain list
          wordChainEl.innerHTML = "";
          data.wordChain.forEach((w) => {
            const li = document.createElement("li");
            li.textContent = w.word;
            li.style.fontWeight = w.playerId === playerId ? "bold" : "normal";
            li.textContent += w.playerId === playerId ? " (You)" : " (Opponent)";
            wordChainEl.appendChild(li);
          });

          // Update scores (your score & opponent)
          const scores = data.scores;
          playerScoreEl.textContent = scores[playerId] || 0;

          // Opponent score: find other player
          const opponentId = Object.keys(scores).find((id) => id !== playerId);
          opponentScoreEl.textContent = scores[opponentId] || 0;

          // Update turn
          toggleTurn(data.currentTurnPlayerId === playerId);
        }
        break;

      case "turn-passed":
        showPopup("Opponent passed turn. Your turn now!");
        toggleTurn(true);
        break;

      case "player-left":
        showPopup("Opponent left the game.");
        toggleTurn(false);
        break;

      case "error":
        showPopup(data.message);
        break;

      default:
        console.warn("Unknown message type:", data.type);
    }
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    showPopup("Connection error!");
    statusMessage.textContent = "Connection error!";
  };

  socket.onclose = () => {
    console.log("Disconnected from server.");
    showPopup("Disconnected.");
    toggleTurn(false);
    statusMessage.textContent = "Disconnected.";
    disableGameInputs();
  };
}

// --- Buttons Logic ---

createRoomBtn.addEventListener("click", () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    statusMessage.textContent = "Connecting... Please wait.";
    connect();
    // Wait a moment then create room
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "create-room" }));
      }
    }, 500);
  } else {
    socket.send(JSON.stringify({ type: "create-room" }));
  }
});

joinRoomBtn.addEventListener("click", () => {
  const rid = joinRoomInput.value.trim().toUpperCase();
  if (!rid) {
    showPopup("Please enter a Room ID!");
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    statusMessage.textContent = "Connecting... Please wait.";
    connect();
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "join-room", roomId: rid }));
      }
    }, 500);
  } else {
    socket.send(JSON.stringify({ type: "join-room", roomId: rid }));
  }
});

function submitWord(word) {
  if (!word) {
    showPopup("Please enter a word!");
    return;
  }

  // Validate word starts with last letter if any
  const lastWord = lastWordEl.textContent;
  if (lastWord !== "None" && word[0].toUpperCase() !== lastWord.slice(-1).toUpperCase()) {
    showPopup(`Word must start with "${lastWord.slice(-1).toUpperCase()}"!`);
    return;
  }

  socket.send(JSON.stringify({ type: "word", word }));
  wordInput.value = "";
  toggleTurn(false);
}

function passTurn() {
  if (isPlayerTurn) {
    socket.send(JSON.stringify({ type: "turn-passed" }));
    toggleTurn(false);
  }
}

submitBtn.addEventListener("click", () => {
  if (isPlayerTurn) {
    const word = wordInput.value.trim();
    submitWord(word);
  } else {
    showPopup("Wait for your turn!");
  }
});

wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitBtn.click();
  }
});

copyRoomBtn.addEventListener("click", () => {
  if (!roomId) return showPopup("No room ID to copy!");
  navigator.clipboard.writeText(roomId).then(() => {
    showPopup("Room ID copied!");
  });
});

leaveBtn.addEventListener("click", () => {
  if (!roomId) return showPopup("Not in a room!");
  socket.send(JSON.stringify({ type: "leave-room" }));
  showPopup("You left the room.");
  roomIdEl.textContent = "----";
  lastWordEl.textContent = "None";
  nextLetterEl.textContent = "A";
  wordChainEl.innerHTML = "";
  playerScoreEl.textContent = "0";
  opponentScoreEl.textContent = "0";
  toggleTurn(false);
  disableGameInputs();
  statusMessage.textContent = "Create or join a room.";
  joinRoomInput.value = "";
});

disableGameInputs();

connect();
