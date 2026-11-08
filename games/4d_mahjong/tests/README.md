# 4D Mahjong Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_mahjong/tests/test_mahjong.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game mahjong
```

## What the sources exercise

[test_mahjong.js](test_mahjong.js).

Tile construction, suit/value matching, exposure queries, hints, metadata and reset. These are board assertions, not proof of canvas picking or complete solitaire rules.

## Browser boundary

`test.html` still requests the nonexistent local `../js/quadray.js` and uses a limited require shim; it is not an equivalent supported Node-suite runner.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
