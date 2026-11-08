# 4D Snake Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_snake/tests/test_snake.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game snake
```

## What the sources exercise

[test_snake.js](test_snake.js).

Movement, wrapping, growth/self-collision, unique initial bodies, array/Set agreement, departing-tail entry, independently enumerated reachable components and full-component completion. Some older assertions are weak; a recorded count is not coverage evidence.

## Browser boundary

`test.html` has a separate inline suite and omits shared base dependencies; it is not the Node occupancy-regression suite.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
