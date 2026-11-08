# 4D SimAnt JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Never replace the eight-neighbor terrain graph with `GridUtils.neighbors`. Keep per-ant live-validated home routes, conservative transport, explicit decay/source accounting and cosmetic RNG separate.

One `board.update()` advances a logical tick. Controller speed intervals are 300/150/50 ms; transport occurs every ten ticks and explicit evaporation every five. Reset reconstructs the board-owned RNG from the retained seed.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
