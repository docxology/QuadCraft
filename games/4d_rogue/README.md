# 4D Rogue — Canonical dungeon traversal, turns and field of view

Explore generated dungeons, collect equipment and consumables, fight enemies and descend stairs.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game rogue
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `RogueGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`RogueBoard(size, {seed})` enumerates canonical physical cells. Generation carves from the origin using bounded twelve-neighbor IVM steps. Movement uses `GridUtils.neighbors` with gauge reduction after each hop. Field of view traces five-hop rays in each physical IVM direction, revealing the first wall/door blocker. Enemy chase calls `QuadrayPathfinder.shortestPath`; chase-range checks use raw-coefficient Manhattan distance, not physical graph distance.

Movement key events call `board.move(dirIndex)`. Successful moves, attacks and door opening trigger enemy turns; the inherited frame update does not autonomously advance the dungeon. The injected seed controls board randomness, but reset continues the RNG rather than restarting a universal replay stream.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

W/E/D/X/S/A/Q/Z select IVM indices 0–7; 1–4 select 8–11. Arrows alias W/X/D/A for Up/Down/Right/Left. H uses a potion; T/F/M uses teleport/fireball/mapping scrolls. N starts another dungeon, R resets, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
