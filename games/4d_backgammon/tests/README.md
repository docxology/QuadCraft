# 4D Backgammon tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_backgammon/tests/test_backgammon.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game backgammon`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Board initialization, dice range, distinct point projections, lane assignment, valid-move array, metadata/reset and shared geometry checks. The suite does not establish exhaustive legal-play or UI coverage.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

The historical `test.html` references missing `../js/quadray.js` and does not reproduce the live entrypoint dependency chain. Use the Node suite for logic and the actual game page for browser checks; do not report this page as a working equivalent runner.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
