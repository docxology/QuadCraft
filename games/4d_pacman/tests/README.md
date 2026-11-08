# 4D Pac-Man Tests — Entrypoints and evidence limits

## Run the actual suites

From the QuadCraft repository root, with Node.js available:

```bash
node games/4d_pacman/tests/test_pacman.js
```

The registry harness discovers local `test_*.js` files:

```bash
python3.13 games/run_games.py --test --game pacman
```

## What the sources exercise

[test_pacman.js](test_pacman.js).

Maze construction, directions, movement, pellet/power collection, ghost states, fruit, life loss, reset, entity output and metadata. Some cases alter board state directly; they are not end-to-end keyboard evidence.

## Browser boundary

`test.html` loads game subclasses with only the Quadray dependency and has a separate inline suite; its dependency list is not the playable entrypoint.

Node logic assertions do not establish real Canvas rendering, camera interaction or end-to-end input. Use the playable [index.html](../index.html) for browser inspection, with the parent `games/` tree served. No suites or browser checks were executed in this documentation audit; historical assertion totals are not a current result.

See [the game contract](../README.md) and [portfolio testing guidance](../../../docs/development/testing_guide.md).
