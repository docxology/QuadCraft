# 4D Space Invaders JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`space_invaders_board.js`](space_invaders_board.js) | `SpaceInvadersBoard` | Board state and game rules |
| [`space_invaders_renderer.js`](space_invaders_renderer.js) | `SpaceInvadersRenderer` | Canvas projection and drawing |
| [`space_invaders_game.js`](space_invaders_game.js) | `SpaceInvadersGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`moveShip(db,dc,dd)`, `shoot()` and `step()` own gameplay; `getEntities()` supplies renderer records. `setCell` is a no-op compatibility hook because storage is in arrays, not a shared sparse grid.

## Projection and interaction

`SpaceInvadersRenderer` projects and depth-sorts `getEntities()` output. Keyboard shooting/movement does not use mouse picking. The current board implements destructible shields; no UFO bonus-target system is present.

Document `SpaceInvadersBoard`, `SpaceInvadersRenderer` and `SpaceInvadersGame` rather than invented Invaders aliases. Keep raw hit keys and logical counters distinct from physical projection.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
