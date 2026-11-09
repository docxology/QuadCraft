# 4D Catan tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_catan/tests/test_catan.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game catan`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Resource layout/player state, building and city upgrades, road/metadata/reset helpers, shared math, and trading/robber/development-card functions evaluated with test helper objects. This does not establish real browser turn-flow coverage.

Robber fixtures choose a tile different from the current robber without rewriting
tile positions. They isolate inventories from random discard draws and verify
exact transfer, conservation and unchanged state after rejected moves.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

The historical `test.html` references missing `../js/quadray.js` and an incomplete dependency order. Use the Node suite and live game separately; the HTML page is not current evidence of passing checks.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
