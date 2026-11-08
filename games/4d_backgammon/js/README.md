# 4D Backgammon JavaScript — Dice-driven race on a projected 24-point track

A two-player dice race on 24 logical points arranged along four colored Quadray lanes.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
backgammon_board.js
backgammon_renderer.js
backgammon_game.js
```

| File | Actual responsibility |
| --- | --- |
| [backgammon_board.js](backgammon_board.js) | `BackgammonBoard`: `points`, `bar`, `borne` and remaining dice own the race state. The board supplies hitting, bar re-entry, bearing-off checks and a winner; `pointToQuadray(i)` supplies a distinct physical display position for each logical point. The track is not the shared 12-neighbor FCC graph. |
| [backgammon_renderer.js](backgammon_renderer.js) | `BackgammonRenderer`: Projected lane axes, track points and checker stacks, dice/status overlays and numbered-point hit testing. |
| [backgammon_game.js](backgammon_game.js) | `BackgammonGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Turns change through board actions, not elapsed-time integration. The shared loop provides camera/HUD rendering; it does not roll dice or advance pieces automatically.

Keep point indices, bar/off sentinels and dice consumption distinct from projected coordinates. Audit the first-valid-move click policy separately from board move generation.

## Limitations

Board-level bar/bearing-off support is broader than the point-click UI: the renderer hit test selects numbered track points. Do not describe this as a complete standard Backgammon interface or an automatic opponent.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
