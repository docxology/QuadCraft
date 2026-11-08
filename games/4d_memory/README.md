# 4D Memory — Raw-label card pairs and turn scoring

Flip cards and match numeric pairs while alternating two players.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game memory
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `MemoryGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`MemoryBoard(3)` deals cards over `GridUtils.generateGrid(3)`: raw four-index labels remain distinct even when their physical projections coincide. The odd extra slot has value zero and is not a playable card. `flip(pos)` records a pair, scores a match and advances `TurnManager` after the second flip; unmatched previous cards are hidden when another card is flipped, not by a delayed timer.

Only click handlers mutate card state; the inherited update hook is empty. No movement or twelve-neighbor rule is used by matching.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Click a card to flip it; N starts another deal; R resets; P pauses. Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
