# 4D Tower Defense JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep route generation, physical placement rings and tower-distance exclusion distinct. The four polyhedron TV values are game metadata, not a measured union of tower coverage. Do not claim the launcher kills stale port owners.

`TDGame.update()` calls `board.update()` at a 16 ms loop interval. Board speed 1/2/3 performs that many `_step()` calls; simulated cooldown time is `tick * 16` ms. Regen restores 5% maximum HP every 30 logical steps, not every real second. The optional seed drives board path generation; reset generates another path without rewinding a universal replay stream.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
