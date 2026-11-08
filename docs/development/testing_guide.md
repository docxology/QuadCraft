# Native, portfolio, and real-browser verification commands

[Development index](README.md) · [Setup](setup_guide.md) · [Portfolio](../games.md)

These are commands to run, not a saved passing receipt. Native compilation, logic tests, structural validation and browser interaction exercise different boundaries; none substitutes for all the others.

## Native coordinate and world tests

From the repository root:

```sh
cmake -S . -B build-core -DQUADCRAFT_BUILD_GAME=OFF -DBUILD_TESTING=ON
cmake --build build-core
(cd build-core && ctest --output-on-failure)
(cd build-core && ctest -R quadray_test --output-on-failure)
```

[`CMakeLists.txt`](../../CMakeLists.txt) registers `quadray_test` and `world_chunk_test`. Names are lowercase and regex filters are case-sensitive. The coordinate suite covers embedding/normalization/distance; [`world_chunk_test.cpp`](../../tests/world_chunk_test.cpp) covers Cartesian chunk keys, negative floor behavior and local/world conversion. These tests do not create a GL context or verify block picking and render output.

For a machine with graphical dependencies, `./build.sh --no-run --test` builds in `build/`, explicitly enables tests and rejects an empty CTest inventory. Manual `ctest` alone can report no tests if the directory/configuration is wrong; ensure the inventory is nonempty. For the actual window/rendering, follow [native setup](setup_guide.md) and exercise the executable in a graphical session.

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

## Behavioral regression design

Use actual consumers and deterministic input where the API offers it. Useful boundaries include gauge-equivalent physical distances, intentionally independent raw aliases, fixed elapsed-seconds trajectories, reset/pause/input ownership, conservation with masked graph edges and click selection matching paint order.

For shared JavaScript, `Quadray.fromCartesian(x,y,z)` takes three numbers; C++ takes `Vector3`. Compare Cartesian round trips with a declared numeric tolerance, not coefficient equality for noncanonical representatives. Raw board labels must not be round-tripped through a physical embedding to recover identity.

Use `GridUtils.createSeededRng(seed)` only with consumers that accept an injected stream/seed; not every game is seed-configurable. SimAnt and Asteroids own seeded streams, whereas Doom map generation still calls `Math.random`. Browser clock/random control does not establish a universal replay/save format.

The [portfolio testing guide](../../games/doc/testing_guide.md) describes runner organization. Report the actual commands, environment and outputs from a run; do not convert source inspection or old dated receipts into a new green claim.
