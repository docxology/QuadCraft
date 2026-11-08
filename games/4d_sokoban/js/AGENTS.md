# 4D Sokoban JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Do not infer canonical adjacency from `BaseBoard` inheritance or shared direction names. Preserve the actual direct-offset rule and explicitly distinguish random generation from a solvability guarantee.

Keyboard events perform complete moves/pushes and win checks. The inherited `BaseGame.update` is empty; no autonomous physics advances boxes.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
