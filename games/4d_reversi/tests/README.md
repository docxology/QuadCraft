# 4D Reversi Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_reversi/tests/test_reversi.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game reversi
```

## What the sources exercise

[test_reversi.js](test_reversi.js).

Initial discs, valid moves, placement/flipping, greedy board AI, occupied-cell rejection, raw position enumeration, metadata and reset. These are board-level checks, not visual-selection coverage.

## Browser boundary

`test.html` still requests the nonexistent local `../js/quadray.js` and uses an incomplete require shim; use the Node entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
