# 4D Mahjong JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep logical layer ordering separate from camera depth and exposure. Do not replace array tile identity with normalized occupancy keys.

Play is click-driven; the inherited `BaseGame.update` does not advance tile state. The loop services rendering/HUD, while hints expire against `performance.now()` in milliseconds.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
