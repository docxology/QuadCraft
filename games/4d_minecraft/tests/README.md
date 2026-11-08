# 4D Minecraft Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_minecraft/tests/test_analysis.js
node games/4d_minecraft/tests/test_minecraft.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game minecraft
```

## What the sources exercise

[test_analysis.js](test_analysis.js), [test_minecraft.js](test_minecraft.js).

`test_minecraft.js` exercises raw block storage, terrain, placement/removal, inventory/crafting and explicit `stepPhysics`/`stepTime` calls; `test_analysis.js` exercises analysis functions. Neither establishes browser first-person movement or automatic controller physics.

## Browser boundary

`test.html` still requests the nonexistent local `../js/quadray.js` and loads only `test_minecraft.js`; it does not replace the Node analysis suite.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
