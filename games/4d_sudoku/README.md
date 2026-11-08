# 4D Sudoku — Canonical IVM graph coloring and cell editing

Fill physical IVM cells with values so neighboring cells differ.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game sudoku
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `SudokuGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`SudokuBoard(4)` is graph coloring, not classic row/column/box Sudoku. It enumerates canonical physical cells and uses bounded twelve-neighbor adjacency for backtracking generation, runtime conflicts and completion. Givens are a randomized subset of a valid coloring; puzzle uniqueness is not checked. `place(pos,value)` records conflicting values and increments errors rather than rejecting them; it rejects absent raw keys and protected givens.

Clicks/number-key events edit values. The inherited update hook is empty. R clears non-givens while preserving the puzzle; N constructs another `SudokuBoard(4)` and reconnects the renderer.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

1–4 chooses the value for subsequent clicks; click a cell to place it. 0 clears the last clicked cell. N creates a puzzle, R clears editable cells, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
