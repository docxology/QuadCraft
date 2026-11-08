# 4D Catan JavaScript — Turn phases, resource tiles and a local heuristic opponent

A local two-player resource/building adaptation: human Red versus heuristic Blue AI on a prescribed 19-tile Quadray layout.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
catan_board.js
catan_cards.js
catan_trading.js
catan_robber.js
catan_renderer.js
catan_ai.js
catan_game.js
```

| File | Actual responsibility |
| --- | --- |
| [catan_board.js](catan_board.js) | `CatanBoard`: The board stores tile records and player resources, settlements, cities, roads and points. The controller owns roll/robber/trade/build phases, a development-card deck and click-build modes. Bank/port trading helpers, robber actions and card effects are separate modules; this is not a complete implementation of standard Catan topology or player-to-player trading. |
| [catan_renderer.js](catan_renderer.js) | `CatanRenderer`: Projected resource tiles, number labels, roads, settlements/cities, highlights, hover information and tile hit tests. |
| [catan_game.js](catan_game.js) | `CatanGame`: input, lifecycle and HUD wiring |
| [catan_cards.js](catan_cards.js) | `CardDeck` and development-card effects |
| [catan_trading.js](catan_trading.js) | Bank/port ratio helpers and trade execution |
| [catan_robber.js](catan_robber.js) | Resource discard, robber placement and theft helpers |
| [catan_ai.js](catan_ai.js) | Heuristic tile/build/trade turn selection |

## Data and update boundary

This is an action-driven turn game, not continuous physics. After a human end-turn, a browser timeout schedules the AI after 500 ms; this timer is independent of the shared render-loop pause.

Keep board resource accounting separate from controller phases and helper effects. Preserve HTML load order: board constants precede card/trading/robber/AI helpers. Do not infer complete standard-Catan legality or pause ownership from the shared base.

## Limitations

Building/neighbor rules are this adaptation’s implementation, not standard Catan guarantees: neighbor tiles use a physical-distance threshold and road creation is not a full standard-road legality validator. Action handlers and pending AI timeouts are not globally frozen by loop pause.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
