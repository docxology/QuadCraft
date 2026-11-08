# JavaScript runtime map: experiments versus portfolio games

[Development index](README.md) · [Portfolio contracts](../games.md) · [Performance](javascript_performance_optimization.md)

## Pick the entry point before copying an API

| Source | Shape and scope |
|---|---|
| [`src/browser/index.html`](../../src/browser/index.html) | Large inline Canvas experiment, adjacent `lib/Var.js`, global geometry/camera/brush functions, current-room Var-tree state and optional JSP polling |
| [`src/browser/indexOld_quadraygrid4.html`](../../src/browser/indexOld_quadraygrid4.html) | Preserved pre-Var snapshot; older save format |
| [`src/js/experiments/QuadrayGrid4.html`](../../src/js/experiments/QuadrayGrid4.html) and other numbered HTML | Historical independent snapshots, not modules maintained behind a common public interface |
| [`src/js/experiments/browser/`](../../src/js/experiments/browser/) | Separate modular/standalone experiment variants; local `js/core/renderer.js` and `js/math/quadray.js` do not define the portfolio API |
| [`games/4d_generic/`](../../games/4d_generic/) | Shared portfolio JavaScript loaded by game pages, with CommonJS exports for many Node consumers; Doom bridges shared math through ES modules |

These implementations coexist. They are not a single browser port of the native engine, and source paths are not interchangeable.

## Newer browser experiment state

`src/browser/index.html` explicitly records the split from quadraygrid4 to quadraygrid5. It initializes pointers `Game`, `NS`, `Ball` and `Opt` into a `V`/`Var` tree after `lib/Var.js` loads. Rendering also uses `grid`, `QBalls`, `QDots`, `selq` and global camera state. Moving balls use child variables such as `.X.p`, `.Y.p` and `.Z.p`; these are not native `World` blocks.

`draw()` schedules via `scheduleAsap`/`setTimeout`, measures elapsed **seconds**, clamps to `maxDt`, handles controls, subdivides physics by `Opt.PhysicsCyclesPerVideoFrame.p` and collects/sorts Canvas drawables. It is not the portfolio's requestAnimationFrame fixed-tick loop.

## Local geometry interfaces

The experiment uses its own `Q(...)`/`Quadray` helpers, including interned objects and APIs such as `mul`, raw Cartesian conversion and CCP snapping. The portfolio's shared `Quadray` uses `scale` and `fromCartesian(x,y,z)` instead. Physical common-offset equivalence still applies, but raw coordinate scale and helper conventions must be read at the selected entry point.

Follow the focused implementation guides:

- [CCP columns](ccp_ball_grid_system.md): range-backed ball occupancy, including the newer Var-tree storage.
- [Brushes](paintbrush_system.md): bit masks, offset lists and Minkowski-sum composition.
- [Quaternion camera](quaternion_camera_system.md): arrays/free functions, not a class hierarchy.
- [Gamepad polling](gamepad_integration_guide.md): first connected slot and hard-coded mappings.
- [Sphere silhouettes](cone_plane_intersection_rendering.md): conic affine output and known visual limitations.
- [Live evaluation](realtime_code_evaluation.md): direct `eval`, not a sandbox.

## Saving is snapshot-specific

`quicksave(name)` stores `StateJson()` under `quadcraft.quicksave.<name>` in localStorage. The newer `StateMap()` identifies `quadcraft_quadraygrid5_state`, stores camera/selection/checkbox/brush state, editor text, geometry and the current room's Var tree. The older page uses the quadraygrid4 layout. These are not native JSON save APIs or a stable portfolio-wide interchange schema. Keep a backup before experimenting; localStorage is browser-origin-specific, not durable server storage.

## Portfolio composition

A typical `games/4d_<key>/index.html` loads shared helpers before its `<key>_board.js`, `<key>_renderer.js` and `<key>_game.js`. `BaseGame` wires `GameLoop` updates, input and HUD; many games still have specialized controllers. Optional base-board/entity/turn/pathfinding helpers are not universal requirements.

Raw game slots can remain independent even if their physical projections coincide. Do not replace board keys with normalized quadrays without deliberately changing the rules. [Games documentation](../games.md) is the canonical runtime contract for fixed seconds, random streams and raw/physical graph semantics.

## Serving boundaries

Use [setup](setup_guide.md) for HTTP launch commands. The portfolio needs its sibling shared directory; the newer geometry experiment needs its own `lib/Var.js`. Static HTTP can serve pages but cannot execute `QuadCraftAjax.jsp`. The optional network path is an [experimental state merge](multiplayer_system.md), not authenticated multiplayer for the portfolio.
