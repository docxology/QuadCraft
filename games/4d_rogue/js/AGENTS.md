# 4D Rogue JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Use `RogueBoard`, `RogueRenderer` and `RogueGame`, not generated U-prefixed names. Preserve canonical FOV crossings and blocker visibility. Do not claim raw Manhattan chase gates are IVM hop distance.

Movement key events call `board.move(dirIndex)`. Successful moves, attacks and door opening trigger enemy turns; the inherited frame update does not autonomously advance the dungeon. The injected seed controls board randomness, but reset continues the RNG rather than restarting a universal replay stream.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
