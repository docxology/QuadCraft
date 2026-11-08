# 4D Rogue JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`rogue_board.js`](rogue_board.js) | `RogueBoard` | Board state and game rules |
| [`rogue_renderer.js`](rogue_renderer.js) | `RogueRenderer` | Canvas projection and drawing |
| [`rogue_game.js`](rogue_game.js) | `RogueGame` | Input, lifecycle and HUD |

## Game-specific interfaces

The board exports `TILE` and `ENEMY_TYPES` alongside `RogueBoard`. `move(dirIndex)`, `usePotion()` and `useScroll(type)` are action entrypoints. `_computeFOV()` canonicalizes each ray hop and records visible/explored keys.

## Projection and interaction

`RogueRenderer` projects canonical cells and entities with visibility/exploration shading. Play uses keyboard direction indices, not screen picking. The FOV algorithm is a set of twelve rays, not an all-direction visibility volume.

Use `RogueBoard`, `RogueRenderer` and `RogueGame`, not generated U-prefixed names. Preserve canonical FOV crossings and blocker visibility. Do not claim raw Manhattan chase gates are IVM hop distance.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
