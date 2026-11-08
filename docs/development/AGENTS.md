# Maintaining source-backed development guides

[Development index](README.md) · [Documentation rules](../AGENTS.md)

## Scope each claim to a runtime

- Native: `src/core/`, `src/game/`, `src/render/`, C++17/CMake/GLFW/OpenGL.
- Historical experiments: the exact HTML snapshot under `src/browser/` or `src/js/experiments/`; newer Var-tree storage differs from older maps.
- Portfolio: game-prefixed JavaScript under `games/4d_<key>/`, shared helpers under `games/4d_generic/`, registry/launcher/QA under `games/src/`.
- JSP: the experimental state merge endpoint, not the portfolio static server or a native multiplayer implementation.

Do not describe one runtime's class, save format or coordinate helper as another's API.

## Evidence and examples

Read the implementing declaration and callers before documenting signatures. Link to source with paths relative to this directory (`../../src/...` or `../../games/...`). Native namespace is `QuadCraft`; shared JS `fromCartesian` takes three numbers. Preserve raw-label identity where rules require it and use the [canonical portfolio contracts](../games.md) for time/RNG/graphs.

No fake component hierarchies, headers, mod installers, asset loaders, physics solvers or network tools. Conceptual material must explain design decisions without posing as working recipes. Existing code comments can also be stale: inspect actual branches and call sites (for example, disabled surface caching).

## Navigation and verification

Keep the [development index](README.md) and [documentation hub](../README.md) aligned with each page's scope. Prefer topic-specific titles and short guides over repeated system diagrams. Preserve or migrate inbound heading anchors when renaming sections.

Commands and test coverage belong in [setup](setup_guide.md) and [testing](testing_guide.md). Do not turn old counts or source inspection into a new passing receipt. Report only checks actually run, and distinguish native graphics-free tests from rendering, structural validation from gameplay, and pointer-capture denial from exercised capture controls.
