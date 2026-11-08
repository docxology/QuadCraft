# 4D Doom tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_doom/tests/test_doom.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game doom`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Configuration/entities/map generation, raw-label obstruction and line-of-sight, hitscan ordering/boundaries, fixed-step elapsed/input ownership and geometry/HUD/FX helpers. These do not establish a fully physical tessellation or unrestricted browser permission support.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

Both `test.html` and `test_doom.html` preload the shared Quadray classic script before the ES-module suite. Serve the parent `games/` tree; Node-only and browser-only branches have different environments.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
