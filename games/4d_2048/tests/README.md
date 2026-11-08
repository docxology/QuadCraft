# 4D 2048 tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_2048/tests/test_2048.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game 2048`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Initial raw cells/tiles, at least one slide, invalid direction indices, move counters, metadata/reset and shared geometry. The randomized merge smoke assertion allows a nonnegative score without an actual merge, so it is not a strong merge-correctness regression.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

There is no local HTML test runner. Node tests cover the board; the actual game page is needed for keyboard directions, pause, projection and HUD checks.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
