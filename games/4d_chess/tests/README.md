# 4D Quadray Chess tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_chess/tests/test_chess.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game chess`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Quadray/piece/board behavior, movement examples, math, analysis and storage helper objects, and edge cases. The suite does not instantiate the actual browser Game for its legacy storage round-trip checks.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` references missing local `../js/quadray.js` and does not load the current shared/storage dependency chain. The `lib_*.js` files are separate helper material, not proof of live-controller behavior.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
