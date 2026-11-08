# 4D Reversi JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep eighty-direction raw flanking separate from inherited physical-neighbor helpers. Preserve controller-owned pass/turn handling; do not advertise an automatic AI opponent.

`ReversiGame` owns a `TurnManager` and pass/end-of-game decisions. `update()` only synchronizes renderer state; clicks and M perform placements. The board also exposes a greedy `aiMove(color)` helper, but normal play does not automatically call it.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
