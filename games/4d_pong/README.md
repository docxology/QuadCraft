# 4D Pong — Four-component court arithmetic and paddle controls

Return the ball across opposing A faces of a four-component rectangular court.

## Quick Start

From the QuadCraft repository root:

```bash
python3.13 games/run_games.py --game pong
```

The launcher serves the parent `games/` tree, including shared `4d_generic/` scripts. Do not serve only this game folder. [index.html](index.html) constructs `PongGame(canvas, hudElement)` and calls `init()`; its script order is authoritative. There is no bundling step.

## Model and timing

`PongBoard` uses plain `{a,b,c,d}` position/velocity objects and independent per-component arithmetic, not physical Quadray vector dynamics. Paddles span B/C/D at opposing A faces; wall reflection is component-wise. Shared Quadray projection is only the display embedding.

The controller runs at a 16 ms loop interval, polls paddle motion, calls AI in one-player mode and calls `board.step(dt)` with seconds. Serve/power timers and paddle-velocity estimates use dt, but ball displacement and paddle/AI movement are per-step increments, not velocity-times-dt integration.

Physical Quadrays have rank three modulo a common offset; four gameplay labels do not imply four independent physical axes. See [portfolio geometry and runtime contracts](../../docs/games.md) for shared units, gauges and timing.

## Controls

Left/Right or A/D moves paddle B; Up/Down or W/S moves C; Q/E moves D. F cycles AI difficulty; T toggles two-player mode. Player two uses J/L, I/K and U/O for B/C/D. N starts another match, R resets, P pauses; Shift+drag rotates and the wheel zooms.

## Source and tests

- [JavaScript modules and projection/picking](js/README.md): model, renderer and controller ownership.
- [Maintenance guidance](AGENTS.md): game-specific invariants.
- [Test entrypoints and limits](tests/README.md): actual local suites and browser-runner differences.
- [Portfolio index](../GAMES_INDEX.md): launcher catalog.

These interfaces are source-audited development-checkout behavior, not a claim that tests or browser checks were run for this page.
