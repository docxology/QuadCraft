# 4D Minesweeper Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_minesweeper/tests/test_minesweeper.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game minesweeper
```

## What the sources exercise

[test_minesweeper.js](test_minesweeper.js).

Canonical occupancy and reciprocal neighbors, first-click mine placement, flags, flood behavior, win/loss, scoring and regeneration. These assertions do not certify mouse/rotation behavior.

## Browser boundary

`test.html` has a separate inline suite and omits `base_board.js` before the board subclass; do not treat it as the current Node-suite equivalent.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
