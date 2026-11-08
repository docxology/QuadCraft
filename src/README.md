# QuadCraft runtime families and source entrypoints

These sources are separate prototypes, not interchangeable backends for one game.

| Family | Entrypoint and ownership |
|---|---|
| Native C++17 | `main.cpp` creates `QuadCraft::Game`; [core](core/README.md), [game](game/README.md), [render](render/README.md) |
| Monolithic browser | [browser/index.html](browser/index.html), external `lib/Var.js`, local saves and optional JSP sync |
| Historical JS experiments | [experiments guide](js/experiments/README.md), independent HTML snapshots and split classic-script files |
| Server experiment | [Tomcat guide](server/README.md), in-memory timestamp-merged Var tree |

The thirty portfolio games live separately under `../games/`; their shared helpers and time conventions do not automatically apply here. No universal save format, physics engine or networking interface connects these families.

Native configuration is defined in [CMakeLists.txt](../CMakeLists.txt): CMake 3.16+, C++17, `QUADCRAFT_BUILD_GAME` (default ON), OpenGL/GLEW/GLFW. The executable is `build/bin/QuadCraft` for a `build` binary directory. `QUADCRAFT_BUILD_GAME=OFF` allows graphics-free core tests; it does not build a headless game. See [setup](../docs/development/setup_guide.md) for commands and [architecture](../docs/architecture.md) for current boundaries.

Physical quadrays describe rank-three space modulo a common offset. Native and split experiment math embed `(a-b-c+d, a-b+c-d, a+b-c-d)/sqrt(2)`; preserve snapshot-specific scaling in older HTML. Browser timestamps/intervals and native seconds must not be conflated. Native gameplay, browser compatibility and server deployment have not been exercised by this documentation audit.
