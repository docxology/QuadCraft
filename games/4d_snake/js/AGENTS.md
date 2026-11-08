# 4D Snake JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep array/Set occupancy equal after movement, growth and departing-tail entry. Preserve raw reachable-component food placement; physical normalization would merge distinct gameplay slots.

`SnakeGame.update()` calls one logical `step()` per loop tick and synchronizes the millisecond tick interval with the board speed. Eating grows the body; filling the playable component ends the board even if other raw components are empty.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
