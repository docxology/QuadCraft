# Build the native prototype or serve the browser portfolio

[Development index](README.md) · [Testing guide](testing_guide.md) · [Runtime map](architecture.md)

Commands below run from the repository root unless noted. They describe a development checkout, not a new release or an assertion that a local build has passed.

## Choose the runtime

- Native: C++17 compiler, CMake 3.16+, OpenGL, GLEW and GLFW3; a display/context is required to run the game.
- Graphics-free native tests: C++17 and CMake; no OpenGL dependencies or display.
- Portfolio play: browser and static HTTP serving; no JavaScript bundling or npm installation for ordinary gameplay.
- Portfolio QA/launcher: Node.js for JavaScript tests and Python 3.10+ for launcher syntax. Examples use **Python 3.13** explicitly. The repository interpreter pins are separate from these commands and should not be changed to fix a local toolchain.
- Real-browser QA: the separate Playwright package under `games/tests/browser/`.

## Native build

On Ubuntu/Debian, install the native dependencies, for example:

```sh
sudo apt-get install build-essential cmake libgl1-mesa-dev libglew-dev libglfw3-dev
```

On macOS, a command-line C++ toolchain plus system/package-manager CMake, GLEW and GLFW is needed; CMake may require `CMAKE_PREFIX_PATH` pointing at that package prefix. OpenGL availability is platform-dependent. On Windows, use a CMake generator and installed dependency packages exposing the targets required by [`CMakeLists.txt`](../../CMakeLists.txt): `OpenGL::GL`, `GLEW::GLEW`, `glfw`. The repository does not vendor those libraries or provide a package-manager bootstrap.

```sh
cmake -S . -B build -DQUADCRAFT_BUILD_GAME=ON -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/bin/QuadCraft
```

For multi-configuration generators, select `--config Debug` and use the executable's configuration subdirectory. A separate Release build directory avoids mixing configurations/cached options.

[`build.sh`](../../build.sh) wraps configuration/build and launches the game unless `--no-run` or `CI` is set. It preserves cached options, including `QUADCRAFT_BUILD_GAME=OFF`:

```sh
./build.sh --no-run --test
```

`--test` enables `BUILD_TESTING`, requires a nonempty CTest inventory and runs it. The wrapper uses `build/`; it does not choose an independent headless directory for you.

## Graphics-free native checks

```sh
cmake -S . -B build-core -DQUADCRAFT_BUILD_GAME=OFF -DBUILD_TESTING=ON
cmake --build build-core
(cd build-core && ctest --output-on-failure)
```

`QUADCRAFT_BUILD_GAME` defaults ON and `BUILD_TESTING` defaults ON through CTest. `BUILD_TESTING=OFF` is independent of the graphical executable option. No `BUILD_MULTIPLAYER`, mod SDK, asset build or documentation-generation option is declared.

## Serve the portfolio

```sh
python3.13 games/run_games.py --list
python3.13 games/run_games.py --game chess doom life
python3.13 games/run_games.py --game chess --no-browser
python3.13 games/run_games.py --all --base-port 9000
```

Ports are base port plus the catalog's stable per-game offset; a single non-Chess game need not use port 8100. Ctrl+C stops the launcher-owned servers. `./games/run.sh chess` delegates to the same launcher but selects an available Python interpreter itself; use `python3.13` directly when interpreter reproducibility matters.

Serve the whole `games/` hierarchy so `../4d_generic/` imports resolve. Do not copy a game directory alone. Opening `file://` HTML is not the supported universal recipe: Doom's ES modules in particular require HTTP. Static serving does not provide multiplayer.

## Historical browser experiments

[`src/browser/index.html`](../../src/browser/index.html) requires its adjacent `lib/Var.js`; its optional `QuadCraftAjax.jsp` calls require a JSP-capable Tomcat deployment, not Python's static server. Other HTML snapshots may be self-contained or modular. See [JavaScript map](javascript_implementation.md) and [network experiment](multiplayer_system.md) rather than applying the portfolio launcher to them.

## Troubleshooting by boundary

- Missing GLEW/GLFW package: resolve native dependencies, or choose the graphics-free configuration for coordinate/world work. A headless pass does not prove rendering works.
- GLFW window/context failure: check display/session and OpenGL 3.3 core support; it is not a unit-test failure.
- Missing shared JS or module/CORS errors: serve the correct directory tree over HTTP and inspect the browser network/console output.
- JSP source/404 from a static server: that server cannot execute JSP. Do not expose the experimental endpoint publicly as a workaround.
- Unexpected cached CMake options: configure the intended option explicitly or use a distinct build directory.

See [test commands and their coverage limits](testing_guide.md) before reporting verification.
