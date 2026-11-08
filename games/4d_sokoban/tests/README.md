# 4D Sokoban Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_sokoban/tests/test_sokoban.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game sokoban
```

## What the sources exercise

[test_sokoban.js](test_sokoban.js).

Construction, cell types, at-least-one initial move, invalid direction rejection, direction-vector definitions, metadata and reset. The local suite does not establish general puzzle solvability or comprehensive push/deadlock behavior.

## Browser boundary

There is no local `test.html`; use the Node entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
