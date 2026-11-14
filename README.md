# NeverChess
# NeverChess

> Chess analysis overlay for chess.com — Stockfish-powered best moves, auto-play, multi-line analysis, and a collapsible draggable panel. Built by [butizada].

![status](https://img.shields.io/badge/status-active-079de8)
![engine](https://img.shields.io/badge/engine-Stockfish%20ASM-4ade80)
![platform](https://img.shields.io/badge/platform-chrome%20%7C%20edge%20%7C%20firefox-a3adbd)
![license](https://img.shields.io/badge/license-MIT-f59e0b)

---

## What it is

NeverChess injects a floating analysis panel into chess.com. It reads the board from the DOM, feeds the position to a Stockfish worker, and shows you the best move — with a clickable auto-play button, a three-line multi-PV display, live eval bar, blunder alerts, and a move history you can rewind.

It's a **study tool** — reads the board, does not modify traffic, does not spoof anything, does not touch the game server. The move is executed only if **you** click "Play Best Move" or enable Auto Play.

---

## Features

- **Stockfish engine** — bundled ASM build, runs entirely in-browser, no backend.
- **Auto-detect color** — reads board orientation, no config needed.
- **Best move overlay** — highlighted from/to squares + arrow indicator.
- **Auto Play** — executes the engine's pick on a delay you control (100–3000 ms).
- **Multi-line analysis** — top 3 engine lines, clickable to play any of them.
- **Eval bar + sparkline** — live centipawn eval, history graph below.
- **Move quality badge** — flags good / inaccuracy / mistake / blunder on each move.
- **Blunder alert** — audio warning when eval drops sharply.
- **Auto Flip** — flips the board to your color automatically.
- **Collapsible + mini mode** — shrink to just the move line, drag anywhere, resize from the left edge.
- **Custom music** — drop an MP3 URL, or fall back to the built-in chiptune. Toggle with `♪`.
- **Depth presets** — Fast (5) / Normal (11) / Strong (18) / Max (25), or fine-tune 1–40.
- **Engine settings** — Threads (1–16), Hash (16–1024 MB), live re-analysis.
- **Copy FEN / Load FEN / Export PGN** — clipboard tools for study.
- **Persisted settings** — every toggle, slider, and volume saved to `localStorage`.
- **Keyboard shortcuts** — `S` start/stop · `C` collapse · `M` music · `F` flip.

---

## Install

### Chrome / Edge (unpacked extension)

1. Download the repo as a ZIP and extract it somewhere permanent.
2. Open `chrome://extensions/` (or `edge://extensions/`).
3. Toggle **Developer mode** on (top right).
4. Click **Load unpacked** and pick the extracted folder.
5. Navigate to any [chess.com](https://chess.com) game — the panel injects automatically.

### Firefox (temporary add-on)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Pick `manifest.json` inside the extracted folder.
4. Reload any chess.com tab.

### Bookmarklet / console (dev only)

Paste the built file into the DevTools console on a chess.com page. The panel appears in the top-right corner. (Console-paste is blocked on first load in Chrome — type `allow pasting` if prompted.)

---

## Quick start

1. Load any game or analysis board on chess.com.
2. The **NeverChess** panel appears top-right. Drag it wherever.
3. Click **Start Analysis**.
4. The best move appears in ~200 ms (depth 11, default).
5. Click **Play Best Move Now**, or flip the **Auto Play** switch.

That's it.
