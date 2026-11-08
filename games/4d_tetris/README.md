# 4D Tetris — Raw falling pieces, component rotation and A-slices

Fit falling pieces and clear completely filled A-slices.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game tetris
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `TetrisGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`TetrisBoard` uses raw keys with separate height/width/C-depth/D-depth bounds. Gravity decrements A; `rotatePiece()` maps offsets `[a,b,c,d]` to `[a,d,b,c]` and accepts only fitting results. It cycles B/C/D components, not arbitrary four-dimensional Euclidean rotation. A clear requires the entire B×C×D slice to be filled, then shifts higher A cells down.

The controller loop interval is 16 ms, but gravity is separately scheduled by `performance.now()` against the board millisecond `tickInterval`. It executes at most one gravity call per eligible update, resets the gravity clock on unpause and spawns a piece on init/reset. This is not elapsed-seconds gravity integration.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left/Right or A/D moves B; Up/Down or W/S moves C; Q/E moves D; Space hard-drops. Z and X both call the same forward rotation, not inverse rotations. R resets, P pauses; the New Game button calls `newGame()` (there is no N key binding). Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
