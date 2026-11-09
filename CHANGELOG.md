# Changelog

## v0.6.0 — 2026-11-09

### Finite fields and gameplay decisions

- Reject nonfinite shared graph inputs before writing caller-owned output; preserve non-aliasing synchronous updates, isolated values and full-graph maximum-degree mask semantics.
- Keep the ordinary edge-flux fast path; use exact binary-rational convex accumulation with one final ties-to-even rounding for overflow/underflow-risk fields. The overflow guard reserves accumulated-flux and old-state headroom at `MAX_VALUE/4`, fixing high-degree stars that overflowed at or below the former `MAX_VALUE/2` guard. Ordinary arithmetic is not globally correctly rounded or bit-exact across languages.
- Sum Asteroids' held raw-axis acceleration once per update before the existing coefficient-space speed cap. Opposing W/S and A/D inputs cancel before clamping, without changing collision units or tuning.
- Stop a SimAnt ant's decision immediately after fatal hunger, record one faction death and the death tick, and prevent posthumous deposits, pickup, delivery or movement. Existing corpse retention/removal remains unchanged.
- Clarify Doom's existing 60 Hz input quantization: settle complete old-input ticks, retain the fractional remainder, then use current input on subsequent ticks. Immediate weapon presses still execute immediately after settlement.

### Native geometry, camera and capture ownership

- Emit outward counter-clockwise tetrahedron face order and matching lighting normals, rather than correcting only normals. Reflected-neighbor visibility, nonregular element geometry, sampled picking and floating-key limitations remain.
- Return camera matrices as fixed `std::array<float,16>` values; use zoom as the authoritative field of view for terrain, overlay and frustum. Projection aspect/near/far configuration updates the same frustum, and construction initializes the cached quadray position.
- Stop camera-only remeshing of world-space vertices. Update owns loading/unloading, evicts unloaded mesh owners with a live context and rebuilds up to fifteen dirty chunks per update. Block edits dirty only the edited chunk; cross-chunk neighbor faces can remain stale until explicit invalidation or reload.
- Release mesh/shader owners in their current live GL context before window destruction; cleanup is idempotent, including partially populated ownership.
- Add `--frames N --capture output.ppm`: bounded runs finish the requested frames or fail, including early window closure; synchronous loading exceeding one second does not truncate them. Capture writes and checks the final real back buffer as a top-down binary PPM.
- Add graphics-free camera coverage and real-GL geometry/framebuffer, gameplay/lifetime and application consumers. The application gate removes its stale capture and independently checks that exact PPM's complete payload and visible variation; CI uploads `native-mesa-application` separately from `native-mesa-framebuffers`. Real populated partial cleanup is covered, not every injected initialization failure.

### Coordinated source and artifact evidence

- Align CMake and the private browser-gate package at 0.6.0, retaining locked Playwright dependencies. Chess game/save/state versions are independent.
- Link the authoritative [suite guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md) for QuadMath 0.7.0 / symergetics 1.4.0 / QuadCraft v0.6.0 coordinate conversion, observed interoperability outcomes and exact-ref source/package evidence boundaries. Source receipts do not establish wheel/sdist contents, universal byte reproducibility or binary deployment.
- Make the Catan robber fixture independent of the shuffled desert and prior random discards. Use real tile positions and verify exact resource transfer, conservation and rejection without changing game rules or retrying a flaky test.

Verification status: these notes describe source changes, not a passing receipt for this release. Native real-GL builds, framebuffer artifacts, full project gates and coordinated artifact checks require actual execution. See the [workflow index](https://github.com/docxology/QuadCraft/actions) and [testing commands](docs/development/testing_guide.md); older dated results below remain historical.

### Captured gameplay and paused-world rendering

- Publish four real exercised Canvas views with preserved originals, labelled detail crops, observed state, controls, limitations and SHA-256 provenance. Distinguish browser gameplay from the experimental native C++/OpenGL renderer.
- Add explicit selected-gallery/single-capture commands and a bounded Python/Pillow compositor. Failed or incomplete captures do not produce substitute art; the default browser command still requires every one of the thirty games.
- Fix SimAnt resize clearing the paused world: resize only changed Canvas dimensions and repaint current geometry without advancing the model or either RNG stream.
- Assert both projected colony queen landmarks remain rendered across paused viewport/full-page resizing, with colony state and randomness unchanged.
- Use the OS listen backlog in the production loopback server to avoid connection resets during concurrent classic-script startup. Make the Chromium harness import that actual server/handler instead of maintaining a test-only implementation.

### Accurate gameplay, geometry and deployment documentation

- Audit repository documentation and internal native, browser, shared infrastructure and every game-folder guide against actual entrypoints and models; replace copied boilerplate with source-specific module purposes.
- Replace fictional APIs and causal diagrams with current interfaces; distinguish the thirty-game portfolio from native, monolithic browser and server experiments.
- Document raw occupancy versus physical points, parity labels versus real meshes, embedding orientation/units, loop/time/RNG ownership and per-game controls.
- Distinguish ideal regular tetrahedra from the native prototype's actual vertex offsets, and board-callable Minecraft updates from the default loop's inactive physics/time paths.
- Separate implemented features, historical manuscripts and unmeasured proposals; repair modular navigation and cross-suite references. These documentation changes do not claim additional runtime capabilities; immutable v0.5.0 release assets remain unchanged.

## v0.5.0 — 2026-11-07

### Simulation and gameplay geometry

- Give shared continuous loops fixed seconds, bounded catch-up and deterministic seeded randomness. Remove Asteroids' second wall clock and retain timer remainder across partitions.
- Resolve Asteroids' moving-target swept contacts chronologically in the physical metric, with uncapped periodic-image enumeration, lifetime boundaries and fragment remainder.
- Share ordered raw-grid obstruction traversal between Doom line of sight and hitscan; intersect physical enemy spheres and let walls win ties. Settle elapsed time before input mutation, own held mouse state explicitly and rebase clocks on respawn.
- Repair SimAnt's reversible raw-axis excavation and distinct nest occupancy. Workers/soldiers use obstacle-aware private delivery routes, replan stale paths and throttle unreachable retries.
- Add generic conservative undirected graph transport, reused by SimAnt pheromones with separate source, evaporation, cap and Float32-rounding accounting. The raw eight-neighbor terrain graph is not relabeled as the twelve-neighbor FCC graph.
- Pick Minecraft/Mahjong by actual projected footprints and reverse stable paint order, preserving raw cells and original tile identity.

### Verification and documentation

- Replace shallow reporting/assertions with deterministic consumer-visible collision, time partition, routing, transport and picking regressions; keep the shared scaffold's seconds contract aligned.
- Extend the real all-game Chromium gate with late-input/respawn timing and held automatic fire when native capture is available. Record real denial and retain keyboard controls otherwise.
- Give the local stdlib HTTP server an OS-sized accept backlog for concurrent classic-script requests; keep resource failures fatal, without retrying or masking them.
- Document shared loop/field/RNG APIs, coordinate gauges/units and per-game deployment boundaries. Bump native and directory-local browser package metadata together.

Verification: **2,341 CLI checks, zero failures; all 30 Chromium scenarios passed locally**. Native capture was denied on this macOS run, so its capture-only automatic-fire branch requires the native-capable CI run. Interactive native OpenGL gameplay was not exercised locally.

## v0.4.0 — 2026-11-07

### Interactive correctness

- Bind all twelve 2048 movement directions through the actual input controller, retain scoring/reset behavior and ignore movement while paused.
- Add shared physical-point camera fitting with an explicit projection target; Life's full raw-grid extent remains in front of the perspective camera and on canvas under rotation.
- Render paused Life single-step updates immediately and keep the HUD/camera synchronized.
- Fit Mahjong's real tile extent instead of clipping its upper faces.
- Stop shared flex layout from stretching canvas CSS dimensions away from their backing size, restoring consistent rendering and picking coordinates.
- Reset Reversi controller turn/history state together with its board.

### All-game browser verification

- Expand the real Chromium gate from thirteen selected surfaces to all thirty catalog games, with meaningful keyboard/pointer/state transitions.
- Split reusable helpers and board/arcade/simulation scenarios into focused modules while retaining the existing npm entrypoint and thirteen strong scenarios.
- Capture initial/final screenshots, isolated browser contexts, runtime/resource diagnostics, failure traces and machine-readable outcomes. Missing runtimes and game errors remain hard failures.
- Integrate the browser gate into symergetics' full, revision-specific suite profile and cross-reference QuadMath 0.5.0 / symergetics 1.2.0 contracts.

Native coordinate, raw-versus-physical board, orientation/unit and graphical
dependency contracts are unchanged. These browser scenarios do not establish
every gameplay path, every browser or interactive native gameplay.

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
