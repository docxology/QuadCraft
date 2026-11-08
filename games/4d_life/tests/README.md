# 4D Life tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_life/tests/test_life.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game life`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Raw cell set/get and keys, generation increments, random seeding, named-pattern loading, wrapped indices, metadata/reset and shared readouts. Tests do not establish pattern dynamics or the controller’s wall-clock speed behavior.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

The historical `test.html` loads missing `../js/quadray.js` and omits shared dependencies. Use the Node suite for logic; verify simulation controls on the actual game entrypoint.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
