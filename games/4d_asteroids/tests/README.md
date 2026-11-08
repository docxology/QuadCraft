# 4D Asteroids tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_asteroids/tests/test_asteroids.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game asteroids`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Wrapping, fixed-loop partitioning, paused commands, physical nearest images, swept seams/grazing contacts, impact ordering, fragment remainder time, simulation timers, independent seeded reset and respawn ownership. The browser path additionally exercises the real Canvas renderer.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` loads the same kernel checks plus the actual controller/Canvas path; use the served `/4d_asteroids/tests/test.html` URL. Node does not exercise the browser-only Canvas branch.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
