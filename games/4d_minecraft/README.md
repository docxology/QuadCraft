# 4D Minecraft — Raw block storage, editing and analysis

Edit a projected block world with inventory and simple crafting.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game minecraft
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `MinecraftGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`MinecraftBoard(8)` stores block types in a sparse `Map` keyed by raw `GridUtils.key(a,b,c,d)`. Common-offset aliases remain separate slots. Terrain generation may place blocks outside the nominal size extent; this is not native chunk storage. `placeBlock(a,b,c,d)` consumes the selected inventory type and `removeBlock(a,b,c,d)` returns the removed type to inventory.

The board exposes `stepPhysics()`, `stepTime()`, `update()` (both steps), and `craft(recipeType)`. However, the default `MinecraftGame.update()` only refreshes cached analysis; it does not call `board.update()`, so sand/water and day/night do not advance automatically. Board physics drops sand/water along -C and uses bounded canonical neighbors for water spreading.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left click places above the picked block at raw C+1; Alt+left click removes it. Keys 1–9 select types 1–9; 0 selects glass (10). N generates another world, R resets, P pauses; Shift+drag rotates and the wheel zooms. Sidebar buttons call `craft('planks')` and `craft('glass')`.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
