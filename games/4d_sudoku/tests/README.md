# 4D Sudoku Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_sudoku/tests/test_sudoku.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game sudoku
```

## What the sources exercise

[test_sudoku.js](test_sudoku.js).

Canonical occupancy, given protection, placement/clearing, rejection of raw aliases, metadata/reset and repeated generator neighbor-conflict checks. No unique-solution or browser picking proof is supplied.

## Browser boundary

There is no local `test.html`; use the Node entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
