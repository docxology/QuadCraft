# Native, portfolio, and real-browser verification commands

[Development index](README.md) · [Setup](setup_guide.md) · [Portfolio](../games.md)

These are commands to run, not a saved passing receipt. Native compilation, logic tests, structural validation and browser interaction exercise different boundaries; none substitutes for all the others.

## Native coordinate, world and camera tests

From the repository root:

```sh
cmake -S . -B build-core -DQUADCRAFT_BUILD_GAME=OFF -DBUILD_TESTING=ON
cmake --build build-core
ctest --test-dir build-core --output-on-failure --no-tests=error
ctest --test-dir build-core -R quadray_test --output-on-failure --no-tests=error
```

[`CMakeLists.txt`](../../CMakeLists.txt) registers `quadray_test`, `world_chunk_test` and `camera_test` without graphical dependencies. Names are lowercase and filters are case-sensitive. Coordinate tests cover embedding/normalization/distance; [`world_chunk_test.cpp`](../../tests/world_chunk_test.cpp) covers Cartesian chunk keys, negative floors and local/world conversion; [`camera_test.cpp`](../../tests/camera_test.cpp) covers actual view/projection, scroll/aspect/frustum behavior and initial cached position. None creates a GL context or proves render output, picking or driver lifetime.

`./build.sh --no-run --test` uses cached options in `build/` and runs all configured tests, including real-GL tests if `QUADCRAFT_BUILD_GAME=ON`. A display-free Linux invocation therefore needs `xvfb-run -a ./build.sh --no-run --test`, or explicit CPU-only configuration as described in [setup](setup_guide.md). To exclude real-GL tests in an already-built graphical configuration use `ctest --test-dir build -LE real-gl --output-on-failure --no-tests=error`; that is not rendering verification.

## Real OpenGL rendering and framebuffer artifacts

```sh
cmake -S . -B build-gl -DQUADCRAFT_BUILD_GAME=ON -DBUILD_TESTING=ON -DCMAKE_BUILD_TYPE=Debug
cmake --build build-gl --parallel 2
LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe xvfb-run -a -s "-screen 0 1024x768x24" ctest --test-dir build-gl --output-on-failure --no-tests=error
```

Install the [Mesa/GLFW/GLEW/Xvfb dependencies](setup_guide.md#linux-software-opengl-checks) first. A graphical configuration adds these `real-gl` CTests to the CPU inventory:

| Consumer | Boundary and artifacts |
|---|---|
| [`native_render_test`](../../tests/native_render_test.cpp) | Reads the production uploaded VBO and independently checks all four outward windings/normals; renders exterior faces under CCW culling, checks color/geometric depth and zoom coverage; writes `native-artifacts/face-0.ppm` through `face-3.ppm`. |
| [`native_gameplay_test`](../../tests/native_gameplay_test.cpp) | Actual loaded-world camera movement/dirty-budget and edited-mesh behavior; real GL mesh/shader deletion in the owner's live context with repeated cleanup; a populated partial-ownership fixture, not every injected initialization-failure branch. A deliberately slow real reclamation must still finish its bounded frames and write `native-artifacts/slow-frame.ppm`; early-close bounded runs must throw. |
| [`native_application_smoke`](../../tests/native_application_smoke.cmake) | Removes its own stale `application.ppm`, runs the actual executable for 24 frames and independently consumes that exact P6 file using [`native_capture_check`](../../tests/native_capture_check.cpp), requiring a complete payload and at least 100 pixels differing from the first. The checker is not a separate CTest. |

The executable's `--frames N --capture output.ppm` contract is completion-or-error, not a wall-time promise. Slow synchronous loading cannot shorten a bounded run; capture-write and early-close failures return nonzero. Pixel variation checks capture integrity, not exhaustive scene correctness.

The [native workflow](../../.github/workflows/native-build.yml) runs Debug/Release graphics-free configurations separately from real llvmpipe/Xvfb consumers. It uploads the capture directory as `native-mesa-framebuffers` and the exact application PPM as `native-mesa-application`, both fail-on-missing; face captures alone cannot satisfy the latter. Consult the [workflow index](https://github.com/docxology/QuadCraft/actions/workflows/native-build.yml) for executed results. These prepared commands/gates are **not** a claim of a current graphical build, framebuffer receipt or CI pass.

## Portfolio logic and structural QA

```sh
python3.13 games/run_games.py --test
python3.13 games/run_games.py --test --game chess doom
python3.13 games/run_games.py --validate
node games/4d_chess/tests/test_chess.js
node games/4d_generic/tests/test_synergetics.js
```

[`testing.py`](../../games/src/qa/testing.py) discovers per-game `tests/test_*.js`. An unfiltered run also recursively discovers shared JavaScript and Python suites under `games/tests/` and `games/4d_generic/tests/`; selecting only some games omits shared discovery. Node nonzero exits, missing game suites and files without executed-check evidence fail. Python suites run with the launcher's own interpreter. `lib_*.js` helper files are not standalone test entries.

`--validate` inspects catalog/file/module structure; it is not a game simulation or browser render. The registry lives in [`games/src/core/registry.py`](../../games/src/core/registry.py), not in the launcher file. Do not infer complete gameplay coverage from catalog validation or use frozen assertion counts as current results.

## Real Chromium input and rendering gate

The browser package is independent of ordinary `--test` discovery. From `games/tests/browser/`:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps chromium
PYTHON=python3.13 npm test
```

The gate owns a loopback HTTP server and isolated Chromium contexts for all catalog games. It exercises actual input/state/render transitions with controlled clock/randomness, records screenshots/logs/results in an external temporary directory, and fails on browser/resource errors. Pointer capture is a real browser capability: denial is reported, and capture-only branches must not be described as exercised when unavailable. See the [browser gate README](../../games/tests/browser/README.md) for scenarios and diagnostics controls.

### Selected gallery artifacts

The [four-view gameplay gallery](../games.md#selected-gameplay-gallery) is produced by `node games/tests/browser/smoke.mjs --gallery` from the repository root, with the same server, roster, controls, clock/random setup, scenarios and assertions as the full gate. This explicit mode selects Minecraft, Hex, Life and Tetris only; **it is not a substitute for `npm test`**. With no flag, all thirty scenarios and the full-gate count assertions remain required.

Follow the [capture/composition recipe](../../games/tests/browser/README.md#selected-gameplay-capture-and-composition) for prerequisites, external diagnostic ownership and the Python/Pillow producer. Missing runtimes, failed scenarios, absent/invalid screenshots and incomplete manifests fail rather than producing placeholder art. Published originals, observed state, crop bounds and hashes live beside the overview in [`docs/figures/gameplay/`](../figures/gameplay/). A screenshot illustrates the recorded state; it does not prove exhaustive rules, calibrated physics or current CI health.

## Behavioral regression design

Use actual consumers and deterministic input where the API offers it. Useful boundaries include gauge-equivalent physical distances, intentionally independent raw aliases, fixed elapsed-seconds trajectories, reset/pause/input ownership, conservation with masked graph edges and click selection matching paint order.

For shared JavaScript, `Quadray.fromCartesian(x,y,z)` takes three numbers; C++ takes `Vector3`. Compare Cartesian round trips with a declared numeric tolerance, not coefficient equality for noncanonical representatives. Raw board labels must not be round-tripped through a physical embedding to recover identity.

Use `GridUtils.createSeededRng(seed)` only with consumers that accept an injected stream/seed; not every game is seed-configurable. SimAnt and Asteroids own seeded streams, whereas Doom map generation still calls `Math.random`. Browser clock/random control does not establish a universal replay/save format.

The [portfolio testing guide](../../games/doc/testing_guide.md) describes runner organization. Report the actual commands, environment and outputs from a run; do not convert source inspection or old dated receipts into a new green claim.
