# 4D SimAnt Tests — Regression maintenance

[README.md](README.md) lists the actual Node entrypoints, source-covered behaviors and browser-runner limits. Run documented commands from the QuadCraft repository root, not a guessed launcher-relative working directory.

Never replace the eight-neighbor terrain graph with `GridUtils.neighbors`. Keep per-ant live-validated home routes, conservative transport, explicit decay/source accounting and cosmetic RNG separate.

Keep regressions tied to observable state transitions and the real board/controller boundary. Numeric pass totals or imported shared helpers are not coverage claims; report command results only when executed. Browser dependency lists and Canvas behavior require separate browser evidence. Read the [game guide](../README.md) before changing scenarios.
