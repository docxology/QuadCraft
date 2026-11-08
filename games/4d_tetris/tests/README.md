# 4D Tetris Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_tetris/tests/test_tetris.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game tetris
```

## What the sources exercise

[test_tetris.js](test_tetris.js).

Piece definitions/spawn, movement/rotation, gravity/locking, A-slice clearing with downward shift, blocked spawn, hard-drop score and active-cell output. Node tests do not establish wall-clock pause behavior.

## Browser boundary

`test.html` loads shared base dependencies for a separate inline board suite; it does not execute the Node file or exercise the controller clock.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
