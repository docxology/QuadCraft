# Chromium runtime gate

Run explicitly from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps chromium
npm test
```

The lock pins Playwright **1.65.0**, resolved from the [primary npm registry](https://registry.npmjs.org/@playwright/test/1.65.0). Chromium and its system prerequisites must be installed; missing packages, browsers or Python cause failure, not a skip. Set `PYTHON` to a Python executable if `python3` is not the intended interpreter.

`smoke.mjs` owns a Python standard-library HTTP subprocess with an ephemeral loopback port and an explicit `games/` document root; it never changes the working directory. Twelve actual game pages run in isolated Chromium contexts. Only time and randomness are controlled: Playwright's virtual clock drives application timers/animation frames without sleeps. No DOM, canvas, renderer, input, board methods or browser-runtime mocks are used. Deterministic real-board fixtures cover Rogue FOV and Connect Four terminal undo. Mouse picking, keyboard actions, camera rotation/zoom, rendered pixels, real math-verification controls and browser/resource errors are asserted.

Surfaces: Go, Hex, Lights Out, Memory, Rogue, Sokoban, Sudoku, Doom, Minesweeper, Connect Four, Tower Defense and Minecraft. Connect Four covers queued-AI reset/disable/undo, completed-reply undo, both terminal winners, and independent raw alias slots. Rogue covers multi-hop and blocked FOV, gauge crossing, movement and real lower/uppercase inventory/new-game keys. Doom checks real movement and either actual pointer capture or a visible, truthful denial; its capability outcome is recorded, never silently skipped.

Application access for interactive debugging is `page.evaluate(() => game.board)` / `game.renderer` / `game.camera`: most pages expose `game` as a top-level lexical binding (not `window.game`). Doom creates `window.game` only after clicking `#startBtn`; its state is `game.player`, `game.map` and `game.renderer`.

Screenshots, console logs, server logs, JSON outcomes and failure traces go to a unique OS temporary directory printed at startup. `BROWSER_DIAGNOSTICS_DIR` may choose a parent directory **outside the repository**. CI uploads execution evidence on success and failure; traces are saved on failure. Inspect a trace with `npx --no-install playwright show-trace /absolute/path/to/<game>-trace.zip`.

This package is directory-local and deliberately has no root `type: module` change. The `.mjs` entry point is not named `test_*.js` or `test_*.py`; ordinary portfolio Node/Python QA discovery does not invoke the browser gate.
