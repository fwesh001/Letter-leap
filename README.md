# 🎮 Letter-Leap

## ✨ Project Title & Description

- **Name:** Letter-Leap
- **Short summary:** Letter-Leap is a fast-paced, casual word game where players create words under time pressure and chain off previous words. It supports both single-player and real-time multiplayer matches with achievements, score tracking, and engaging audiovisual feedback.
- **Main idea & target audience:** The game challenges vocabulary, quick thinking, and pattern recognition. Target audience: teens and casual gamers who enjoy short competitive sessions and word puzzles.

## 📁 File Structure

Top-level folders relevant to development and distribution:

```
frontend/
	assets/        # images and sounds used by the game
	css/           # stylesheets for pages and game UI
	data/          # game data: word lists, settings, JSON data files
	js/            # frontend JavaScript driving gameplay and UI
	pages/         # HTML pages (index, game modes, results, help)
public/          # public assets, README (this file)
server/          # Node.js backend with Socket.io server
```

- `frontend/assets/` — contains images, sprites, and audio used in-game (🎧, 🖼️).
- `frontend/css/` — styles for layouts, themes, and responsive UI (🌙 dark/light themes).
- `frontend/js/` — game logic, UI handlers, and multiplayer socket clients (⚙️).
- `frontend/data/` — `words.txt`, `db.json`, and settings used by the game (📦).
- `frontend/pages/` — ready-to-serve HTML pages: lobby, single/multiplayer, results (🖥️).
- `server/` — Express + Socket.io server and game room logic (`server/server.js`) (🔌).

## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Node.js, Express, Socket.io for real-time multiplayer
- Libraries & packages:
	- `express`
	- `socket.io`
	- `uuid`
	- `ws` (WebSocket utilities)
- Recommended Node / npm:
	- Node.js >= 14 (Node 16+ recommended)
	- npm (bundled with Node)

## ▶️ How to Play

### 🎯 Objective
Create valid words that either continue or respond to the current word chain before time runs out. Earn points, unlock achievements, and outlast other players in multiplayer.

### 🎮 Modes
- **Single-player:** Play against the system and aim for a high score and achievements.
- **Survival Mode:** A pressure-focused single-player variant with hearts, floor progression, and corrupted letters that increase the challenge.
- **Multiplayer:** Real-time, turn-based rooms where players take turns making words. Players have a fixed turn timer; running out of time or submitting invalid words can eliminate a player.
  - **Room Browser:** Scan for public rooms and join active games
  - **Public/Private Rooms:** Choose room visibility when creating
  - **Spectate Mode:** Watch ongoing matches without participating
  - **Custom Mode:** Configure game rules (timer, word length, lives, etc.)

### ⌨️ Controls & Rules (basic)
- Type a word in the input box and submit (Enter or the Submit button).
- Words must be present in the game dictionary (`frontend/data/words.txt`).
- Each turn has a timer (default 60 seconds). If the timer reaches zero the player is eliminated (⏳).
- Achievements trigger on special word patterns (long words, many vowels, repeated letters, rare letters, etc.).

### 🔎 Tips
- Aim for longer words to score more points (🏆).
- Watch the timer and play a bit faster when streaks matter (⚡).
- Learn achievement patterns (vowels, repeated letters, long words) to maximize bonuses (✨).

## ⭐ Features

- Single-player, Survival Mode, and real-time multiplayer modes
- Real-time multiplayer powered by Socket.io with rooms and turn timers (🔁)
- **Room Browser:** Scan and discover public multiplayer rooms with real-time updates (🔍)
- **Public/Private Rooms:** Control room visibility and access when creating games (🔒)
- **Spectate Mode:** Watch live matches without participating (👁️)
- **Custom Game Mode:** Customize rules including timer length, word length requirements, lives, and scoring (⚙️)
- **Real-time Room Updates:** Automatic refresh of available rooms as players join/leave (🔄)
- Score tracking, achievements, and end-of-match result screens (🏆)
- Global dark/light theme with a settings sidebar for quick access to core options (🌙/☀️)
- Achievement search and expanded challenge list (🔎)
- Multiplayer results include player cards, badges, and dynamic commentary (🎯)
- Sound effects and images (assets in `frontend/assets/`) (🔊, 🖼️)
- Configurable settings via `frontend/data/settings.json` (⚙️)
- **Room Browser Modal:** Clean, card-based interface for discovering public rooms with player counts and host information
- **Custom Badge Indicator:** Animated badge on room cards showing custom rule configurations
- **Scanning Animation:** Integrated loader animation for room discovery with smooth transitions
- Settings sidebar added across content pages (Tips, Achievements, Feedback, How to Play, Multiplayer)
- Survival Mode added with a dedicated HUD, hearts, and corrupted-letter pressure

## 🧩 Recent UI Updates

- Survival Mode added with a dedicated HUD, hearts, and corrupted-letter pressure
- Settings sidebar added across content pages (Tips, Achievements, Feedback, How to Play, Multiplayer)
- Theme preference persists globally across pages
- Multiplayer results page now supports badges and commentary
- New Tips page with letter grid, word modals, and search
## 🚀 Future Implementations / Roadmap

- Mobile offline version (Android) with a packaged WebView or native port (📱)
- Bluetooth/Wi‑Fi local multiplayer for offline play (📶)
- Additional levels, difficulty modes, and curated challenges (🧩)
- Enhanced UI/UX, animations, and accessibility improvements (♿)
- Leaderboard integration (global or per-device) and account sync (🌐)

## ⚙️ Installation & Running Locally

1. Clone the repository:

```bash
git clone <https://github.com/fwesh001/Letter-leap.git>
cd "letter leap"
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
# or
node server/server.js
```

4. Open the game in your browser:

```
http://localhost:3000/
```

Pages you can open directly:

- `/` → main lobby ([frontend/pages/index.html](frontend/pages/index.html))
- `/mm.html` → multiplayer match ([frontend/pages/mm.html](frontend/pages/mm.html))
- `/sm.html` → single-player match ([frontend/pages/sm.html](frontend/pages/sm.html))
- `/result.html` and `/resultmm.html` → result screens (📊)

If you need to change the port, edit `server/server.js` (default `PORT = 3000`).

## 🤝 Contributing

- **Guidelines:**
	- Fork the repository and open a feature branch for changes.
	- Keep changes focused and open small pull requests.
	- Write short descriptions for PRs and include screenshots for UI changes.
- **Bug reports & feature requests:**
	- Open an issue describing steps to reproduce, expected vs. actual behavior, and environment (Node version, OS).
	- For feature requests, describe the user value and provide mockups where helpful.

## 📜 License / Credits
- **License:** MIT License (see [LICENSE](LICENSE) file)
- **Credits:**
	- Developed by [fwesh001](https://github.com/fwesh001)
	- Word list sourced from [SCOWL](http://wordlist.aspell.net/)
	- Sound effects from [Freesound](https://freesound.org/)
	- Icons from [Font Awesome](https://fontawesome.com/)
	- Inspiration from classic word games like Scrabble, Boggle, and Wordle.
	- Special thanks to the open-source community for libraries and resources used in development.

