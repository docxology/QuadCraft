# 4D Minesweeper — Canonical cells, mine counts and flood reveal

Reveal every safe physical cell without exposing a mine.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game minesweeper
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `MinesweeperGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`MinesweeperBoard` enumerates `GridUtils.generateCanonicalGrid(size)`, keeping each zero-minimum physical cell once. Bounded canonical twelve-neighbor adjacency determines counts and flood expansion, not eight raw axis moves. First reveal places mines outside the selected cell and its neighbors. Reveal/flag mutations reject noncanonical labels.

`MinesweeperGame.update()` is intentionally empty: mouse handlers perform reveal and flag operations. Zero-count flood reveal skips flagged sites; win detection counts revealed safe cells.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left click reveals; right click toggles a flag. N starts a new board, R resets and P pauses. Shift+drag rotates; the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
