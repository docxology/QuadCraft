# 4D Pong Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_pong/tests/test_pong.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game pong
```

## What the sources exercise

[test_pong.js](test_pong.js).

Court state, wall/paddle responses, scoring, reset, power-up lifecycle, AI difficulty, two-player mode, rally tracking and metadata. Tests do not establish frame-rate-independent continuous physics.

## Browser boundary

`test.html` has a separate inline suite and loads subclasses without their shared base dependencies; use Node for the documented regression route.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
