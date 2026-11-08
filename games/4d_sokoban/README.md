# 4D Sokoban — Raw-label pushes with positive direction vectors

Push every box onto a goal in a generated raw-label puzzle.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game sokoban
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `SokobanGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`SokobanBoard` uses all raw size^4 slots. `move(dirIndex)` adds the selected nonnegative `(0,1,1,2)` permutation directly to player and pushed-box labels; it does not call canonical `GridUtils.neighbors` or wrap. Thus this directed bounded move rule is not reversible physical twelve-neighbor FCC adjacency. Random box/goal placement has no solver or deadlock check, so generated levels are not guaranteed solvable.

Keyboard events perform complete moves/pushes and win checks. The inherited `BaseGame.update` is empty; no autonomous physics advances boxes.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Keys 1–9 select and execute indices 0–8; 0 selects 9; Q/W selects 10/11. N generates another level; R also regenerates rather than restoring the same arrangement. P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
