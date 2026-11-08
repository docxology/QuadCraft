# 4D Breakout tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_breakout/tests/test_breakout.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game breakout`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Ball/paddle motion, paddle bounds, wall bounce, life loss, brick damage and destruction, combos, speed clamps and reset. Tests instantiate the board, not a real browser controller.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` omits shared subclass dependencies and contains its own small inline checks. It is not a substitute for the Node suite plus interaction checks on `index.html`.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
