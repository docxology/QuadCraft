# 4D Frogger tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_frogger/tests/test_frogger.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game frogger`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Initial state, hop direction, a step, entity records, distances/neighbors, metadata and reset. Several checks are structural smoke assertions, not comprehensive collision, timeout or controller verification.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` loads game subclasses without the complete shared BaseBoard/BaseGame dependencies and uses small inline checks. It is historical smoke wiring, not parity with the Node suite.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
