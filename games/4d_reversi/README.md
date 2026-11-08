# 4D Reversi — Raw-grid flanking across eighty directions

Place discs to flank opponent lines; the higher disc count wins when neither player can move.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game reversi
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `ReversiGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`ReversiBoard(4)` keeps all raw 4×4×4×4 labels in move enumeration and keys occupied discs without gauge reduction. Its capture directions are the 80 nonzero vectors in `{-1,0,1}^4`, not the physical FCC twelve-neighbor set. `place(pos,color)` flips contiguous bracketed opponent lines; `ReversiColor` is the color enum.

`ReversiGame` owns a `TurnManager` and pass/end-of-game decisions. `update()` only synchronizes renderer state; clicks and M perform placements. The board also exposes a greedy `aiMove(color)` helper, but normal play does not automatically call it.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Click a highlighted valid position to place; M makes a random legal move. N starts another game, R resets, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
