# 4D Tower Defense JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`tower_defense_board.js`](tower_defense_board.js) | `TowerDefenseBoard` | Board state and game rules |
| [`tower_defense_renderer.js`](tower_defense_renderer.js) | `TDRenderer` | Canvas projection and drawing |
| [`tower_defense_game.js`](tower_defense_game.js) | `TDGame` | Input, lifecycle and HUD |

## Game-specific interfaces

The board exports `TDTower`, `TDCreep`, `TOWER_TYPES` and `CREEP_TYPES`. `placeTower(quadray,type)`, `upgradeTower(tower)`, `sellTower(tower)` and `spawnWave()` own mutations. `_getGridNodes()` in the renderer builds physical placement rings, not the creep route. TV sums are tower metadata rather than geometric coverage volumes.

## Projection and interaction

`TDRenderer` uses its own Cartesian/perspective `_projectQ`, including pan offsets. Placement candidates are deduplicated canonical sites from two full physical FCC neighbor rings around normalized waypoints, unlike the basis-step route. Hover picks the nearest candidate within 22 pixels; tower selection checks existing projected centers within 18 pixels first.

Keep route generation, physical placement rings and tower-distance exclusion distinct. The four polyhedron TV values are game metadata, not a measured union of tower coverage. Do not claim the launcher kills stale port owners.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
