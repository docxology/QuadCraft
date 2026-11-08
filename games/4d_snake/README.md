# 4D Snake — Wrapped raw occupancy and reachable food

Grow a snake by eating food in its reachable wrapped raw-label component.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game snake
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `SnakeGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`SnakeBoard` keeps a tail-to-head key array and `snakeSet` over raw four-index slots. It adds one of twelve `(0,1,1,2)` permutations and wraps each component, without common-offset normalization. Food is selected from free labels in the head’s sum-mod-gcd(size,4) component. Boundary wrapping is not death. Entering a departing tail is legal on a non-growing move; entering another occupied segment kills the snake.

`SnakeGame.update()` calls one logical `step()` per loop tick and synchronizes the millisecond tick interval with the board speed. Eating grows the body; filling the playable component ends the board even if other raw components are empty.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Arrow Up/Down/Right/Left selects direction indices 0/1/2/3; W/S/Q/E selects 4/5/6/7. These are multi-component directions, not literal ±A/±B/±C/±D. The other four model directions have no keyboard binding. N starts another game, R resets, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
