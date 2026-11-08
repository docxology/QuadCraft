# 4D Checkers tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_checkers/tests/test_checkers.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game checkers`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Initial arrangement, origin moves, a jump/captured-piece removal and promotion. These focused board tests do not establish exhaustive turn, input, camera or rules coverage.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

The historical `test.html` still loads missing `../js/quadray.js` and lacks the shared board dependencies. Treat it as stale wiring, not a current browser test result.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
