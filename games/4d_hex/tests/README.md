# 4D Hex tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_hex/tests/test_hex.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game hex`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Canonical board cells, alternating placement, duplicate rejection, reset and a genuine neighbor-connected red face-to-face win path, plus shared math checks. The suite is not an exhaustive proof of all connection/end states.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

There is no local HTML test runner. The Node suite covers board logic; verify picking, camera and controls on the actual served page.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
