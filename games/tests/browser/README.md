# Chromium runtime gate

Run explicitly from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps chromium
PYTHON=python3.13 npm test
```

The private gate package is version **0.6.0**; its root lock entries track that package version while dependency/integrity pins remain independent. The lock pins Playwright **1.65.0**, resolved from the [primary npm registry](https://registry.npmjs.org/@playwright/test/1.65.0). Chromium and its system prerequisites must be installed; missing packages, browsers or Python cause failure, not a skip. Set `PYTHON` to a Python executable if `python3` is not the intended interpreter.

`smoke.mjs` owns a Python standard-library HTTP subprocess with an ephemeral loopback port and an explicit `games/` document root; it never changes the working directory. All **30 catalog games** run in isolated Chromium contexts, with no skip path. Only time and randomness are controlled: Playwright's virtual clock drives application timers/animation frames without sleeps. No DOM, canvas, renderer, input, board methods or browser-runtime mocks are used. Deterministic real-board fixtures cover specific legal positions, including Rogue FOV, Connect Four terminal undo, 2048 merging and Life birth/death. Actual screenshots are captured; input, state/rendering transitions, mathematical verification and browser/resource errors are checked.

The original thirteen scenarios remain: Go, Hex, Lights Out, Memory, Rogue, Sokoban, Snake, Sudoku, Doom, Minesweeper, Connect Four, Tower Defense and Minecraft. Snake covers live animation, keyboard turning, pause/resume and camera rotation, catching rendering failures that stop the loop. Connect Four covers queued-AI reset/disable/undo, completed-reply undo, both terminal winners, and independent raw alias slots. Rogue covers multi-hop and blocked FOV, gauge crossing, movement and real lower/uppercase inventory/new-game keys. Doom checks real movement and either actual pointer capture or a visible, truthful denial; its capability outcome is recorded, never silently skipped.

Doom additionally exercises real late input, release ownership and fresh
respawn clocks. When native mouse capture succeeds, it checks held plasma
cadence and a late pistol press without retroactive firing or release duplicates.
When capture is denied, that capture-only branch is explicitly marked
unexercised rather than simulated; respawn timing still runs. The HTTP subprocess
imports the production [`GameHTTPServer` and `QuietHTTPHandler`](../../src/server/launcher.py),
including the OS listen backlog for concurrent script loads. It does not maintain
a separate test-only server; resource errors remain fatal with no retry fallback.

The additional scenarios are grouped in `board-scenarios.mjs`, `arcade-scenarios.mjs` and `simulation-scenarios.mjs`; shared clock/input/pixel helpers live in `helpers.mjs`. They cover Chess, Checkers, Reversi, Backgammon, Catan, Mahjong, Asteroids, Bomberman, Pacman, Pong, Breakout, Frogger, 2048, Life, SimAnt, Space Invaders and Tetris. Arcade scenarios exercise live motion, shooting, bomb blasts, pellet/brick scoring, traffic and both Pong paddles. Simulation scenarios exercise 2048 keyboard merges/reset, Life paused single-step redraw and running generations, funded SimAnt purchases/assist/speed/labels, moving/firing Invaders, and Tetris gravity/drop/locking/respawn.

Board scenarios select and move actual Chess/Checkers pieces, flip Reversi stones after a turn-history reset, roll and spend a Backgammon die, pay Catan resources for a visible settlement, and remove an exposed Mahjong pair after requesting a hint. They check that the canvas remains unstretched, visible and populated with rendered board pixels. Shared flex alignment prevents tall sidebars from stretching the canvas and separating click coordinates from rendered positions.

Life and Mahjong fit their full board extents in physical Cartesian space before perspective projection. A bounding sphere keeps them in front of the camera at every rotation; camera target/distance/scale change, never board labels, physical units or the sign of a projected radius. The Life scenario includes a formerly behind-camera corner and rotates the real camera.

Application access for interactive debugging is `page.evaluate(() => game.board)` / `game.renderer` / `game.camera`: most pages expose `game` as a top-level lexical binding (not `window.game`). Doom creates `window.game` only after clicking `#startBtn`; its state is `game.player`, `game.map` and `game.renderer`.

Initial/final screenshots, console logs, server logs, JSON outcomes and failure traces go to a unique OS temporary directory printed at startup. Each `results.json` entry names its screenshots and, on failure, its trace; new scenarios also record exercised controls and state/projection details. `BROWSER_DIAGNOSTICS_DIR` may choose a parent directory **outside the repository**. CI uploads execution evidence on success and failure; traces are saved on failure. Inspect a trace with `npx --no-install playwright show-trace /absolute/path/to/<game>-trace.zip`.

This package is directory-local and deliberately has no root `type: module` change. The `.mjs` entry point is not named `test_*.js` or `test_*.py`; ordinary portfolio Node/Python QA discovery does not invoke the browser gate.

These are selected real-runtime scenarios, not exhaustive rule coverage or a current green receipt. Browser clocks and helper `advance(page, ms)` durations are milliseconds; application updates retain the seconds/logical-tick contracts documented in the [canonical portfolio contracts](../../../docs/games.md). Shared-helper signatures are documented in the [browser API reference](../../doc/shared_modules_reference.md).

The [v0.6.0 source notes](../../../CHANGELOG.md#v060--2026-11-09) and [current workflows](https://github.com/docxology/QuadCraft/actions) distinguish prepared scenarios from executed receipts. Coordinated exact-ref/source-integrity and independently built package evidence belong to the [authoritative suite guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md), not an inferred all-green result from a local version or lockfile.

## Selected gameplay capture and composition

The [published gallery](../../../docs/games.md#selected-gameplay-gallery) selects Minecraft (geometry/sandbox), Hex (strategy/picking), Life (cellular automaton) and Tetris (arcade). It reuses this harness, HTTP subprocess and **unchanged existing scenarios/assertions**; there is no second browser orchestrator. The default `npm test` still runs all thirty games. `--gallery` is explicitly a four-game capture consumer, not a full-gate receipt or a prettier replacement for rule checks.

After installing the browser prerequisites above, run from the **repository root**:

```sh
PYTHON=python3.13 node games/tests/browser/smoke.mjs --gallery
# Use the unique external diagnostics path printed by that command:
python3.13 games/tests/browser/compose_gallery.py \
  --capture /absolute/path/to/quadcraft-browser-XXXXXX/capture.json \
  --output docs/figures/gameplay
```

Composition requires Python 3.11+ and Pillow 13.0+ in the chosen Python environment (`python3.13 -m pip install 'Pillow>=13.0'` if needed), matching the suite's current image-toolchain floor. It does not install or invoke another renderer. `PYTHON` selects the harness's stdlib HTTP interpreter, not the compositor environment. Set `BROWSER_DIAGNOSTICS_DIR` to an existing/creatable external parent if desired; repository-local diagnostics remain rejected.

### Capture and publication ownership

- The harness writes the usual initial/final full-page PNGs, console/server logs and `results.json` to a unique external directory. Failures retain screenshots/traces and produce a nonzero exit. Gallery mode additionally writes `<game>-canvas.png` from the actual `game.canvas` element and `capture.json` with selected results, observed state, labels/source paths, browser version, viewport, virtual epoch and controlled random seed.
- Composition requires a completed successful manifest, the exact selected roster, readable initial/final and canvas PNGs, and consistent recorded dimensions/state. Missing or invalid inputs raise an error before publication; no placeholders are drawn.
- The dedicated output directory receives `gallery.png`, four unchanged `<game>-canvas.png` originals and `provenance.json`. The overview uses aspect-preserving scaling/letterboxing with **labeled center crops** for Hex, Life and Tetris; crop pixel bounds and SHA-256 hashes are recorded. No game pixels are recolored or painted over. Minecraft retains its full canvas. Full-page initial/final evidence and traces stay external rather than becoming user output or published gameplay art.
- The final Life view is the scenario's paused reseed, not its earlier evolved fixture. Camera/game state is not rearranged for the gallery; sparse projections and game-specific simulation limits are explained in the captions and [portfolio guide](../../../docs/games.md#selected-gameplay-gallery).

For ordinary play, serve the games through the [launcher](../../../docs/games.md#quick-start); source HTML links are not a promise that every game runs through `file://`. The gallery does not change native GLFW/GLEW/OpenGL requirements or establish a shared native/browser simulation runtime.

## Single-game capture diagnostics

For an explicitly scoped real consumer capture, use a catalog key with the same harness:

```sh
PYTHON=python3.13 node games/tests/browser/smoke.mjs --capture simant
```

This runs that game's scenario and all its maintained assertions, not the full gate. Unknown keys fail. Usual external screenshots/logs/results are retained; `capture.json` identifies `single-game-capture` (not accepted by the gallery compositor). Results additionally name `<game>-bitmap-before.png` and `<game>-bitmap-after.png`: actual Canvas bitmap exports surrounding the final full-page screenshot, with raster dimensions and non-background pixel counts. These contain Canvas pixels only, unlike page/element screenshots that can include overlapping DOM panels.

SimAnt's scenario also matches both actual queen sprites at their projected world positions before and after a paused viewport/full-page resize. It requires unchanged logical ticks, ant positions/health/energy/carrying, stored food and score; forwarding counters observe the real RNG streams without changing outcomes and require zero calls. Its entrypoint redraws immediately after changed bitmap dimensions: setting `canvas.width/height` clears Canvas even when the virtual animation clock is frozen. This is a responsive-display lifecycle regression, not a simulation/camera-layout fix; raw terrain and game rules are unchanged.
