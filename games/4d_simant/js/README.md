# 4D SimAnt JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`simant_board.js`](simant_board.js) | `SimAntBoard` | Board state and game rules |
| [`simant_renderer.js`](simant_renderer.js) | `SimAntRenderer` | Canvas projection and drawing |
| [`simant_game.js`](simant_game.js) | `SimAntGame` | Input, lifecycle and HUD |
| [`simant_ai.js`](simant_ai.js) | `RedColonyAI`, `YellowAssistAI` | Colony decisions |
| [`simant_combat.js`](simant_combat.js) | `CombatSystem` | Raw proximity combat and danger deposits |
| [`simant_pheromone_viz.js`](simant_pheromone_viz.js) | `PheromoneVisualizer` | Display-only trail overlay |

## Game-specific interfaces

`simant_ai.js` supplies `RedColonyAI` and `YellowAssistAI`; `simant_combat.js` supplies `CombatSystem`; `simant_pheromone_viz.js` supplies the browser `PheromoneVisualizer`. Board `idx/coords` address dense raw terrain, `_homeMove` owns private BFS routes and `diffusePheromones` separates transport from decay. Follow the actual HTML auxiliary-module order rather than loading every shared helper by convention.

## Projection and interaction

`SimAntRenderer` projects raw terrain/ants and overlays tunnel edges and trails. Hover chooses the nearest entity center within 30 pixels; it is informational, not a movement command. The minimap collapses C/D onto raw A/B.

Never replace the eight-neighbor terrain graph with `GridUtils.neighbors`. Keep per-ant live-validated home routes, conservative transport, explicit decay/source accounting and cosmetic RNG separate.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
