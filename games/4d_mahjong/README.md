# 4D Mahjong — Layered tile matching and face picking

Match exposed tiles of the same suit and value to clear the stacked layout.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game mahjong
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `MahjongGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`MahjongBoard` stores `MahjongTile` objects in an array, not a raw occupancy map. `toQuadray()` uses `(pos.a, pos.b, layer * 2, pos.d)`. A tile is exposed when no unmatched tile in the next logical layer lies within embedded `Quadray.distance < 2`; side-open solitaire rules are not implemented. Matching uses tile identity, suit and value, not projected position.

Play is click-driven; the inherited `BaseGame.update` does not advance tile state. The loop services rendering/HUD, while hints expire against `performance.now()` in milliseconds.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left mouse press selects a tile; H highlights an available pair; N deals a new layout; R resets scoring and the board. P pauses, Shift+drag rotates, and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
