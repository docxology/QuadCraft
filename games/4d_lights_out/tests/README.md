# 4D Lights Out tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_lights_out/tests/test_lights_out.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game lights_out`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Canonical physical cells, twelve direction permutations, self-plus-neighbor toggling, double-toggle reversal, win detection, nonblank randomization, metadata and reset. These do not prove an optimal solver or browser scoring persistence.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

There is no local HTML test runner. Run the Node logic suite and separately inspect click picking, reset and HUD on the served page.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
