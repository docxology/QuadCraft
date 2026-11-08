# 4D Pong JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Keep per-tick ball/paddle increments distinct from seconds-based timers. Do not identify the independent court axes with four independent physical Quadray axes.

The controller runs at a 16 ms loop interval, polls paddle motion, calls AI in one-player mode and calls `board.step(dt)` with seconds. Serve/power timers and paddle-velocity estimates use dt, but ball displacement and paddle/AI movement are per-step increments, not velocity-times-dt integration.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
