# 4D Checkers JavaScript — Canonical-position jumps and promotion

A local two-player checker variant with seven pieces per side and normalized Quadray position identity.

## Modules and entrypoint

The [game page](../index.html) loads sibling [shared modules](../../4d_generic/README.md) before the local game stack. Its local order is:

```text
checkers_board.js
checkers_renderer.js
checkers_game.js
```

| File | Actual responsibility |
| --- | --- |
| [checkers_board.js](checkers_board.js) | `CheckersBoard`: Initial Red pieces occupy low coordinate sums and Black pieces high sums. Men add one of the six positive two-axis pairs for Red and subtract it for Black; kings can do both. Moves normalize through Quadray arithmetic, bounds use normalized components in `[0,size)`, and captures jump one enemy. Promotion uses normalized sum ≥8 for Red or ≤0 for Black. |
| [checkers_renderer.js](checkers_renderer.js) | `CheckersRenderer`: Projected grid/pieces, selected destinations and move indicators, with separate piece and move-target hit tests. |
| [checkers_game.js](checkers_game.js) | `CheckersGame`: input, lifecycle and HUD wiring |

## Data and update boundary

Piece moves are discrete actions; `update()` performs no simulation work. A shared render loop handles display and camera state, not automatic turns.

Use canonical piece keys consistently; bounds and promotion operate on normalized positions. Do not silently import mandatory-capture/multi-jump rules from standard checkers.

## Limitations

Canonical `position.toKey()` merges common-offset aliases; this is not 256 physically distinct slots. Generated simple moves and single jumps do not implement mandatory captures or chained multi-jumps. The initial even-sum arrangement is not a separate general parity-validation API.

See the [game guide](../README.md) for controls, [logic tests](../tests/README.md) for coverage boundaries and [portfolio contracts](../../../docs/games.md) for geometry/time conventions. Shared modules are capabilities, not an automatic entity/physics/save/network layer for this game.
