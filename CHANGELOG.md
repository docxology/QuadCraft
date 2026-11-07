# Changelog

## v0.3.0 — 2026-11-06

### Geometry and shared methods

- Use embedding-consistent gauge-invariant physical lengths/distances across native C++, shared JavaScript, Python space utilities and modular browser math.
- Distinguish canonical physical cells from independent raw four-index labels. Physical boards enumerate unique cells; Connect Four storage, wins, AI, ghosts and undo preserve distinct raw slots, including gauge-equivalent projections.
- Use an admissible physical-hop heuristic for unit-cost A* and Dijkstra for arbitrary nonnegative custom costs. Doom LOS traverses raw cell boundaries rather than sampling by physical distance.
- Repair Doom's classic-script/ESM bridge and Tower Defense's indexed twelve-neighbor IVM wireframe. Correct mathematical constants and visible verification identities.

### Rendering and game state

- Migrate Go, Hex, Lights Out, Memory, Rogue, Sokoban and Sudoku to current projection, constructor, rendering, input and HUD contracts.
- Cast canonical multi-hop Rogue visibility rays with blocker/gauge-crossing behavior and finite connected dungeon completion. Rogue now requires an integer extent of at least 3.
- Keep Snake's wrapped raw-label model while spawning food only in the reachable sum-mod-gcd(size,4) component. Complete on exhaustion of that playable component; initialize contiguous unique segments and preserve occupancy on departing-tail moves. Positive integer extents are supported; extent 1 starts complete.
- Fit Snake's perspective camera outside the board's Cartesian bounding sphere for every rotation. The default size-six scene no longer throws a negative Canvas arc radius and stops before the first movement tick.
- Keep Minesweeper flags intact during flood expansion and display the actual canonical-cell count.
- Undo Connect Four AI turns back to a human decision point, cancel pending work on reset/new/disable, and prevent stale callbacks from mutating a new game. Correct fixed-P2 minimax scoring and restore board/history/redo/win-line state after search.
- Spawn and respawn Doom players inside raw collision cells rather than on boundaries, restoring movement from the actual starting position. Await native pointer capture and visibly report rejection while retaining keyboard controls.

### Execution and verification

- Discover nested shared JavaScript/Python tests without aggregate double counting. Preserve stderr summaries/diagnostics and fail process errors, zero-execution suites, and missing requested/registered suites.
- Serve games with root-isolated threaded HTTP handlers rather than process-wide cwd changes. Incomplete requests no longer block other requests or shutdown; ephemeral ports and repeated stop/restart are supported.
- Add graphics-free CMake configuration and project version 0.3.0. `build.sh --test` enables tests even with a cached OFF setting and rejects empty CTest inventories; native assertions remain active in Release builds.
- Add Debug/Release headless CI alongside the existing graphical build and game validation jobs.
- Add a directory-local, locked Playwright/Chromium gate for thirteen actual game surfaces, real picking/input/rendering and deterministic AI lifecycle checks, with external diagnostics instead of renderer/DOM mocks.
- Exercise the actual browser gate successfully on all thirteen surfaces, including Snake's real first tick, keyboard turning, camera rotation and pause/resume. Record native mouse-capture availability instead of pretending capture succeeded; the local Chromium run denied capture and displayed the keyboard-control notice.

### Reproduction and suite contracts

Run `python3 games/run_games.py --test` and `python3 games/run_games.py --validate`. For native core tests use `cmake -S . -B build-core -DQUADCRAFT_BUILD_GAME=OFF -DBUILD_TESTING=ON`, build that directory and run CTest there. The graphical game still requires OpenGL, GLEW, GLFW and a display.

Browser setup and invocation are documented in [the browser gate](games/tests/browser/README.md). The [coordinated verifier](https://github.com/docxology/symergetics/blob/main/verify_suite.py) exercises all three source projects. See the [suite guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md) for the Y/Z orientation exchange, scale conversion, exact volume units and verification receipts.

Release verification: **2,395 reported game checks passed**, all **30 structural validations passed**, both native CTest targets passed in Release, and the real Chromium gate passed **13/13 surfaces**. Graphical native compilation has its own Linux CI job; interactive native gameplay was not exercised locally.
