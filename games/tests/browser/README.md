# Chromium runtime gate

Run explicitly from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps chromium
npm test
```

The lock pins Playwright **1.65.0**, resolved from the [primary npm registry](https://registry.npmjs.org/@playwright/test/1.65.0). Chromium and its system prerequisites must be installed; missing packages, browsers or Python cause failure, not a skip. Set `PYTHON` to a Python executable if `python3` is not the intended interpreter.

`smoke.mjs` owns a Python standard-library HTTP subprocess with an ephemeral loopback port and an explicit `games/` document root; it never changes the working directory. All **30 catalog games** run in isolated Chromium contexts, with no skip path. Only time and randomness are controlled: Playwright's virtual clock drives application timers/animation frames without sleeps. No DOM, canvas, renderer, input, board methods or browser-runtime mocks are used. Deterministic real-board fixtures cover specific legal positions, including Rogue FOV, Connect Four terminal undo, 2048 merging and Life birth/death. Actual screenshots are captured; input, state/rendering transitions, mathematical verification and browser/resource errors are checked.

The original thirteen scenarios remain: Go, Hex, Lights Out, Memory, Rogue, Sokoban, Snake, Sudoku, Doom, Minesweeper, Connect Four, Tower Defense and Minecraft. Snake covers live animation, keyboard turning, pause/resume and camera rotation, catching rendering failures that stop the loop. Connect Four covers queued-AI reset/disable/undo, completed-reply undo, both terminal winners, and independent raw alias slots. Rogue covers multi-hop and blocked FOV, gauge crossing, movement and real lower/uppercase inventory/new-game keys. Doom checks real movement and either actual pointer capture or a visible, truthful denial; its capability outcome is recorded, never silently skipped.

Doom additionally exercises real late input, release ownership and fresh
respawn clocks. When native mouse capture succeeds, it checks held plasma
cadence and a late pistol press without retroactive firing or release duplicates.
When capture is denied, that capture-only branch is explicitly marked
unexercised rather than simulated; respawn timing still runs. The stdlib HTTP
server uses the OS accept-backlog limit for concurrent script loads, with
resource errors still fatal and no retry fallback.

The additional scenarios are grouped in `board-scenarios.mjs`, `arcade-scenarios.mjs` and `simulation-scenarios.mjs`; shared clock/input/pixel helpers live in `helpers.mjs`. They cover Chess, Checkers, Reversi, Backgammon, Catan, Mahjong, Asteroids, Bomberman, Pacman, Pong, Breakout, Frogger, 2048, Life, SimAnt, Space Invaders and Tetris. Arcade scenarios exercise live motion, shooting, bomb blasts, pellet/brick scoring, traffic and both Pong paddles. Simulation scenarios exercise 2048 keyboard merges/reset, Life paused single-step redraw and running generations, funded SimAnt purchases/assist/speed/labels, moving/firing Invaders, and Tetris gravity/drop/locking/respawn.

Board scenarios select and move actual Chess/Checkers pieces, flip Reversi stones after a turn-history reset, roll and spend a Backgammon die, pay Catan resources for a visible settlement, and remove an exposed Mahjong pair after requesting a hint. They check that the canvas remains unstretched, visible and populated with rendered board pixels. Shared flex alignment prevents tall sidebars from stretching the canvas and separating click coordinates from rendered positions.

Life and Mahjong fit their full board extents in physical Cartesian space before perspective projection. A bounding sphere keeps them in front of the camera at every rotation; camera target/distance/scale change, never board labels, physical units or the sign of a projected radius. The Life scenario includes a formerly behind-camera corner and rotates the real camera.

Application access for interactive debugging is `page.evaluate(() => game.board)` / `game.renderer` / `game.camera`: most pages expose `game` as a top-level lexical binding (not `window.game`). Doom creates `window.game` only after clicking `#startBtn`; its state is `game.player`, `game.map` and `game.renderer`.

Initial/final screenshots, console logs, server logs, JSON outcomes and failure traces go to a unique OS temporary directory printed at startup. Each `results.json` entry names its screenshots and, on failure, its trace; new scenarios also record exercised controls and state/projection details. `BROWSER_DIAGNOSTICS_DIR` may choose a parent directory **outside the repository**. CI uploads execution evidence on success and failure; traces are saved on failure. Inspect a trace with `npx --no-install playwright show-trace /absolute/path/to/<game>-trace.zip`.

This package is directory-local and deliberately has no root `type: module` change. The `.mjs` entry point is not named `test_*.js` or `test_*.py`; ordinary portfolio Node/Python QA discovery does not invoke the browser gate.
