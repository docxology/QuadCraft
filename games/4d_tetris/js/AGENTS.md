# 4D Tetris JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Preserve raw occupancy, rectangular bounds, B/C/D permutation and full-slice clearing. Do not replace these with inherited canonical neighbors or assume every callback consumes dt.

The controller loop interval is 16 ms, but gravity is separately scheduled by `performance.now()` against the board millisecond `tickInterval`. It executes at most one gravity call per eligible update, resets the gravity clock on unpause and spawns a piece on init/reset. This is not elapsed-seconds gravity integration.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
