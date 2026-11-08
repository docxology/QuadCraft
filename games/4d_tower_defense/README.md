# 4D Tower Defense — Basis-step routes, tower ranges and logical waves

Build and upgrade towers to stop creeps following a generated waypoint route.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game tower_defense
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `TDGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`TowerDefenseBoard(size, {seed})` generates a route by adding rounded `Quadray.BASIS` steps, not by BFS or canonical twelve-contact FCC adjacency. Creeps interpolate along waypoint segments. Tower range, path exclusion and stacking exclusion use embedded `Quadray.distance`, so physical aliases collide. Towers/creeps are local objects, not `EntityManager` entities; pathfinding.js is not loaded.

`TDGame.update()` calls `board.update()` at a 16 ms loop interval. Board speed 1/2/3 performs that many `_step()` calls; simulated cooldown time is `tick * 16` ms. Regen restores 5% maximum HP every 30 logical steps, not every real second. The optional seed drives board path generation; reset generates another path without rewinding a universal replay stream.

Tower types are tetra (rapid), octa (splash), cubo (slow) and rhombic (highest-HP sniper), defined by `TOWER_TYPES`. Creep definitions and upgrades live in the board module rather than duplicated stat tables here.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Click places a selected tower type or selects an existing tower. 1/2/3/4 chooses tetra/octa/cubo/rhombic; U upgrades; X/Delete/Backspace sells. Space cycles speed, N sends the next wave early, A toggles auto-wave, Escape/right click deselects. P pauses; R resets. Shift/right drag rotates; Ctrl-left/middle drag pans; the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
