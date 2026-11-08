# 4D Go tests — logic scope and browser boundaries

## Run the actual suites

From the QuadCraft repository root (Node.js required):

```bash
node games/4d_go/tests/test_go.js
```

The registered launcher route is `python3.13 games/run_games.py --test --game go`. It discovers local `test_*.js` files; see the [testing guide](../../../docs/development/testing_guide.md) for integrated gates.

## What the source checks

Canonical uniqueness, placement/occupancy/turns, pass/reset, a capture across a normalized boundary, rejection of a shifted-origin extra slot and shared geometry. No full scoring/ko or live browser UI coverage is implied.

Tests exercise [game modules](../js/README.md) and only the shared dependencies they actually import. Their presence is not a blanket correctness, performance or coverage guarantee.

## Browser boundary

There is no local HTML test runner in this directory. Run the Node logic suite and inspect the served game page separately.

Serve the parent `games/` directory, preserving sibling shared assets. Check the real [entrypoint](../index.html) for console/network errors, controls, rendering, pause/reset and camera interaction; Node assertions do not substitute for these checks.

[Game guide](../README.md) · [Test maintenance](AGENTS.md)
