# 4D Pac-Man JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Preserve wrapped raw keys and distinguish twelve model directions from eight bound keys. Do not document the misleading ±axis labels as actual unit-vector movement or claim BFS ghost routing.

`PacmanGame.update()` calls one logical `board.step()` at a 150 ms loop interval. Board movement, pellet collection, ghost movement and power/fruit counters advance per step; this is not dt-scaled continuous transport.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
