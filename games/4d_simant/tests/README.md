# 4D SimAnt Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_simant/tests/test_comprehensive.js
node games/4d_simant/tests/test_graph_transport.js
node games/4d_simant/tests/test_simant.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game simant
```

## What the sources exercise

[test_comprehensive.js](test_comprehensive.js), [test_graph_transport.js](test_graph_transport.js), [test_simant.js](test_simant.js).

`test_comprehensive.js`: colony/terrain/combat/field integration. `test_simant.js`: actual-board excavation, return routing, live obstruction/reopening and caste permissions. `test_graph_transport.js`: transport, reachability, accounting, replay, combat and terminal-world scenarios.

## Browser boundary

`test.html` loads actual dependencies and invokes the foraging/delivery `test_simant.js` entry only; it does not run the comprehensive or graph-transport suites.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served; historical assertion totals are not a current result.

The independent [Chromium scenario](../../tests/browser/simulation-scenarios.mjs) also pauses the colony, resizes the real viewport and takes a full-page screenshot. It matches both queen sprites at their projected world positions before and after resize, so HTML panels and corner HUD cannot substitute for colony landmarks. It requires unchanged ticks, ant positions/health/energy/carried food, stored food and score, with no calls to the real board/cosmetic random streams. Run the [isolated capture](../../tests/browser/README.md#single-game-capture-diagnostics) for before/after bitmap evidence; it is not the full thirty-game gate.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
