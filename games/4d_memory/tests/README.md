# 4D Memory Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_memory/tests/test_memory.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game memory
```

## What the sources exercise

[test_memory.js](test_memory.js).

Raw-grid dealing, pair multiplicity, flipping, matching scores, metadata and reset. Tests do not exercise a timed mismatch animation.

## Browser boundary

There is no local `test.html`; use the Node entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
