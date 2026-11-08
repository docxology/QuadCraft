# 4D Tower Defense Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_tower_defense/tests/test_tower_defense.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game tower_defense
```

## What the sources exercise

[test_tower_defense.js](test_tower_defense.js).

Seeded route properties, placement/upgrade/sale, wave/creep types, regen, swarm splitting, sniper priority, reset/countdowns, speed consistency and renderer canonical FCC placement rings. Logic tests are not visual/browser camera evidence.

## Browser boundary

`test.html` still requests the nonexistent local `../js/quadray.js` and does not load the renderer needed by the Node geometry regressions; it is not a substitute for the Node entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
