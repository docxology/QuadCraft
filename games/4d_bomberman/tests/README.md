# 4D Bomberman tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_bomberman/tests/test_bomberman.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game bomberman`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Movement blocking, bomb capacity/timing, explosion-center propagation, enemies, reset and rendered-entity records. These are board-level checks, not a complete input/render proof.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` loads game subclasses without the required shared BaseBoard/BaseGame dependency chain. It is a historical inline smoke page, not demonstrated parity with the Node suite.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
