# 4D Space Invaders Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_space_invaders/tests/test_space_invaders.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game space_invaders
```

## What the sources exercise

[test_space_invaders.js](test_space_invaders.js).

Ship clamps, firing cooldown, initialized formations, shield state/entity output, reset, metadata and geometry helpers. Several checks mutate state directly; these are not proof of every bullet/formation collision transition.

## Browser boundary

`test.html` has a separate inline suite and omits shared base dependencies; use Node for the documented regression route.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
