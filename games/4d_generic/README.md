# Portfolio shared JavaScript — geometry, lifecycle and optional game helpers

`4d_generic/` is a library, not a playable game or a standalone application scaffold. Portfolio HTML pages select their dependencies; loading a shared script does not make a game inherit every subsystem. Native C++, historical browser experiments and the server experiment are separate runtimes.

## Module map

| Boundary | Files and current interfaces |
| --- | --- |
| Physical coordinates | [quadray.js](quadray.js): `Quadray`, `ROOT2`, `S3`; scalar `fromCartesian(x,y,z)`, object-valued `toCartesian()` |
| Geometry readouts | [synergetics.js](synergetics.js): `SYNERGETICS`, angle/round-trip/identity helpers |
| Labels and adjacency | [grid_utils.js](grid_utils.js): raw/canonical grid generation, keys, bounded canonical neighbors, distances, sorting and seeded RNG |
| Camera/projection | [camera.js](camera.js), [projection.js](projection.js), [zoom.js](zoom.js): `CameraController`, `projectQuadray(q,opts)`, `drawQuadrayAxes`, `setupZoom` |
| Canvas rendering | [base_renderer.js](base_renderer.js): `BaseRenderer` and shared drawing/projection helpers |
| Game lifecycle | [base_game.js](base_game.js): `BaseGame(canvas,hudElement,board,renderer,opts)`; `init`, `togglePause`, `reset` and subclass hooks |
| Fixed ticks | [game_loop.js](game_loop.js): `GameLoop({update,render,tickRate})`; tickRate in milliseconds, update dt in seconds |
| Key state | [input_controller.js](input_controller.js): `InputController.bind/attach/detach/isDown`; mouse picking is usually local controller work |
| Board storage | [base_board.js](base_board.js): raw-key Map infrastructure, bounds, neighbor/distance/readout helpers |
| Optional entities | [entity_system.js](entity_system.js): `QuadrayEntity`, `EntityManager`; not a universal world/ECS |
| Optional turns | [turn_manager.js](turn_manager.js): `TurnManager`, player rotation and recorded undo/redo history; games must undo their own board mutations |
| Optional paths | [pathfinding.js](pathfinding.js): `QuadrayPathfinder` BFS, weighted shortest path, flood, directional line traversal and range helpers |
| Optional graph transport | [graph_field.js](graph_field.js): `ConservativeGraphField(size,edges).step(values,alpha,out,active)` |
| Status/score | [hud.js](hud.js), [score_manager.js](score_manager.js), [hud-style.css](hud-style.css): DOM HUD text, score/lives/level state and optional high-score storage |

## Coordinate and storage contracts

Physical coordinates identify `(a,b,c,d)` modulo a common offset. The shared embedding is:

```text
(x,y,z) = (a-b-c+d, a-b+c-d, a+b-c-d) / sqrt(2)
```

It is rank three, with basis radius `sqrt(3/2)` and distance 2 between distinct unit-basis tips. Relative to scale-one Python XYZ, it swaps Y/Z and divides by `sqrt(2)`, reversing orientation. JavaScript arithmetic is floating point.

`normalized()` subtracts the minimum component; it is a gauge choice, not unit-vector normalization. `Quadray.toKey()` additionally rounds canonical components, whereas `GridUtils.key()` preserves exact raw labels. Never substitute these keys indiscriminately.

`generateGrid(size)` keeps `size^4` raw labels. `generateCanonicalGrid(size)` keeps each zero-minimum representative once, including all four component-sum-mod-4 FCC sublattices. `neighbors` adds the twelve `(0,1,1,2)` permutations then normalizes; `boundedNeighbors` filters canonical component bounds. Eight signed basis steps are a different graph. Parity cell names and `cellVolume()` metadata do not certify a physical tetrahedral tessellation.

[Portfolio contracts](../../docs/games.md) own the full math/units/graph distinctions; [shared API reference](../doc/shared_modules_reference.md) provides signatures. Raw occupancy remains authoritative for games that intentionally distinguish physical aliases.

## Lifecycle and limitations

`BaseGame` registers base P/R keys, calls `_setupGameInput()` during construction, creates the loop/camera and starts only on `init()`. A subclass hook therefore runs before later subclass fields are initialized. `_getHUDState()` returns `{text,color}`; HUD writes DOM text, not a universal Canvas overlay. `InputController.bind` replaces a key’s previous callback, so a game can repurpose P (Go uses pass).

The loop accumulates browser milliseconds, caps a frame interval at 250 ms and calls `update(tickRate/1000)` for each due tick. Logical-step games may ignore that dt; continuous games must not multiply twice. Stopping the loop does not detach input or cancel game-owned timeouts/intervals. Check each controller before claiming pause freezes commands or reset cancels external work. Doom owns a separate ES-module/fixed-tick controller; its `js/quadray.js` is an adapter, not a second math implementation.

`ScoreManager` accepts `storageKey`, not a generic `key` option; it tracks increasing high scores, not an implemented `highScoreMode: 'low'`. `TurnManager` records `{player,move,turnNumber}` wrappers, not arbitrary flat game records. Graph-field updates exchange equal/opposite edge flux; they are conservative transport, not symmetric-normalized heat. Inactive masks disable edges without deleting stored values.

## Tests and navigation

Run from the repository root:

```bash
node games/4d_generic/tests/test_quadray.js
node games/4d_generic/tests/test_synergetics.js
```

[Local test scope](tests/README.md) separates math checks from the larger shared suites under `games/tests/` and real browser validation. [Maintenance instructions](AGENTS.md) · [Portfolio index](../GAMES_INDEX.md).
