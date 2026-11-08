# Browser games, shared helpers and Python tooling

## Three separate responsibilities

| Area | Executed where | Responsibility |
|---|---|---|
| `4d_<key>/index.html` and `js/` | Browser | Game-specific state, rules, rendering and input |
| `4d_generic/` | Browser; selected CommonJS exports in Node | Reusable math, projection, boards, input, clocks and optional game patterns |
| `src/` and `run_games.py` | Python | Registry, static HTTP launch, QA, generation and analysis |

Python does not run each browser game's simulation. Its `space/` package is a related floating-point implementation, not a universal parity layer. The native C++ prototype and historical `src/browser/`, modular `src/js/` and JSP server experiments are separate systems; see [repository architecture](../../docs/architecture.md).

## Launch and verification flow

`run_games.py` resolves its own `games/` directory, selects keys from `src/core/registry.py`, and creates one `GameServer` per selected game. Each threaded server binds loopback, serves that same games root and prints a `/4d_<key>/index.html` URL. Shared files load from `/4d_generic/`. There is no multiplayer or persistence backend in this static server.

`--validate` performs text/file checks. `--test` launches Node suites and Python unittest files; full runs recursively include shared tests. The [Chromium gate](../tests/browser/README.md) is independent and executes real rendered input scenarios for all catalog games.

## Composition, not universal inheritance

Classic-script games load dependencies before consumers. Doom preloads shared geometry and runs its own ES modules. Importing a helper does not establish that the game calls it, extends it, or uses its clock/graph/storage rules. Inspect the specific board and controller.

Shared `BaseGame` composes a supplied board and renderer. Its render callback synchronizes camera rotation and calls `renderer.render()`. `BaseBoard` supplies a raw-keyed Map, not every game's state representation. Scaffold output instead creates standalone classes and an array grid.

[Portfolio contracts](../../docs/games.md) own physical versus raw coordinates and clocks. For example, Minecraft's board exposes simulation methods, but its default controller update refreshes analysis rather than advancing board physics/time.

## Focused references

[Shared browser APIs](shared_modules_reference.md) · [Python interfaces](python_infrastructure.md) · [Launch operations](launch_operations.md) · [Testing](testing_guide.md) · [New-game layout](game_template.md)
