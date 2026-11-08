# 4D Connect Four tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_connect_four/tests/test_connect_four.js
node games/4d_connect_four/tests/test_connect_four_game.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game connect_four`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Raw gravity/alias separation, wins, full/invalid columns, metadata, evaluation, undo and shared math in `test_connect_four.js`; `test_connect_four_game.js` checks undo-to-human-decision, AI lifecycle guards and actual tactical search positions.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

`test.html` contains inline smoke checks but omits shared BaseBoard/TurnManager dependencies; it does not run the two Node suites as-is. Use `index.html` for current interaction verification.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
