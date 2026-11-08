# Thirty browser games: launch, shared modules, and simulation contracts

[Documentation index](README.md) · [Portfolio index](../games/GAMES_INDEX.md) · [Verification](development/testing_guide.md)

## Portfolio summary

The catalog in [`games/src/core/registry.py`](../games/src/core/registry.py) defines thirty browser applications. They use game-specific Canvas renderers/controllers and shared JavaScript, not native C++ bindings or the historical JSP game-state service.

| Group | Catalog keys |
|---|---|
| Board and tabletop | `chess`, `checkers`, `reversi`, `backgammon`, `catan`, `mahjong`, `connect_four`, `go`, `hex` |
| Arcade/action | `asteroids`, `doom`, `tower_defense`, `tetris`, `snake`, `pong`, `breakout`, `pacman`, `space_invaders`, `frogger`, `bomberman` |
| Sandbox/simulation | `life`, `simant`, `minecraft` |
| Puzzles/adventure | `minesweeper`, `sokoban`, `2048`, `rogue`, `memory`, `sudoku`, `lights_out` |

“4D” in game names often refers to raw four-index rules. The physical quadray embedding has rank three. The catalog is not a claim of production completeness, identical rules or feature parity across games.

## Quick start

From the repository root:

```sh
python3.13 games/run_games.py --list
python3.13 games/run_games.py --game chess doom life
python3.13 games/run_games.py --game doom --no-browser
python3.13 games/run_games.py --all --base-port 9000
```

The launcher starts static HTTP servers at base port plus each registry offset and stops them on Ctrl+C. `./games/run.sh chess` is a convenience wrapper that chooses its own available Python interpreter. No npm build is required for ordinary play.

Serve the full `games/` hierarchy, preserving `4d_generic/` beside the game directories. A game folder alone is not self-contained. Use HTTP rather than promising `file://` support for all games: Doom loads ES modules. These HTTP servers do not provide gameplay synchronization or multiplayer.

## Standalone architecture

Typical source organization is `games/4d_<key>/index.html`, `js/<key>_board.js`, `js/<key>_renderer.js`, `js/<key>_game.js` and `tests/test_<key>.js`. Games may have additional geometry, UI, storage or analysis modules; Doom has its own ES-module layout and math bridge.

[`games/4d_generic/quadray.js`](../games/4d_generic/quadray.js) implements the shared physical embedding. [`synergetics.js`](../games/4d_generic/synergetics.js) owns associated constants/helpers. Camera, projection, input, game-loop and HUD helpers are shared; base-board/entity/turn/pathfinding helpers are optional and not every controller subclasses `BaseGame`.

Shared modules are real coupling: changing them can affect many games. C++ `Quadray::fromCartesian(Vector3)` and shared JS `Quadray.fromCartesian(x,y,z)` express the same native/shared embedding but are not identical language APIs. Historical HTML experiments define separate local helpers.

## Raw labels and physical graphs

[`GridUtils`](../games/4d_generic/grid_utils.js) deliberately exposes two spaces:

| Operation | Contract |
|---|---|
| `generateGrid(size)` / `key(a,b,c,d)` | Raw `size^4` labels / raw string key, with no gauge reduction |
| `generateCanonicalGrid(size)` | Unique zero-minimum integer labels, `size^4 - (size-1)^4` for positive integer size |
| `neighbors(a,b,c,d)` | Twelve permutations of `(0,1,1,2)` added then zero-minimum normalized; physical neighbors independent of input gauge |
| `boundedNeighbors(...,size)` | Those canonical physical neighbors filtered to coefficient bounds |
| `manhattan` / `euclidean` | Raw four-coefficient metrics, not embedded Cartesian metrics |
| `Quadray.distance` | Physical Cartesian distance in the native/shared scale |

Canonical twelve-neighbor steps preserve coefficient-sum modulo four, so retaining all canonical integer labels retains four graph sublattices, not one connected FCC contact graph. A coefficient-unit basis vector has physical length `sqrt(3/2)`; the twelve contact steps have length 2 in this embedding. `Quadray.toIVM` snaps normalized components with `Math.round`; it is not an XYZ-nearest-lattice search.

Do not normalize every board key indiscriminately. [`BaseBoard`](../games/4d_generic/base_board.js) and [`ConnectFourBoard`](../games/4d_connect_four/js/connect_four_board.js) keep raw alias slots independent. [`RogueBoard`](../games/4d_rogue/js/rogue_board.js) instead enumerates canonical cells for physical-neighbor navigation. [`SimAntBoard`](../games/4d_simant/js/simant_board.js) uses an eight-neighbor **raw ±unit-component graph**, not the twelve physical CCP neighbors. A geometric round trip cannot recover a raw alias's identity.

## Time and random-state ownership

[`GameLoop`](../games/4d_generic/game_loop.js) accepts `tickRate` in **milliseconds**, accumulates display elapsed milliseconds (capped at 250 per frame), and invokes `update(tickRate / 1000)` in fixed **seconds**. Its render argument is an accumulator fraction, not elapsed seconds. [`BaseGame`](../games/4d_generic/base_game.js) forwards update seconds; its default tick rate is 16 ms. Individual games may use logical ticks or specialized loops instead of continuously integrating dt.

Doom's [`DoomGame`](../games/4d_doom/js/doom_game.js) has a separate 60 Hz accumulator and settles elapsed time under the old input state before applying live input changes. SimAnt's board `update()` advances one logical tick; transport/evaporation cadence is expressed in those ticks. Native `Game::run()` and historical browser experiments have different variable-delta loops; their timing contracts do not transfer automatically.

`GridUtils.createSeededRng(seed)` creates an independent Mulberry32 stream with a modulo-2^32 seed. `shuffle(array,rngFn)` accepts an optional stream, but `randomCoord(size)` uses global `Math.random`. Asteroids/SimAnt accept board seeds; Rogue optionally accepts one. Doom generation still calls `Math.random`. A fixed seed only reproduces consumers that actually own/use that stream; there is no universal replay, seeded reset or save-state guarantee for all thirty games.

## Conservative transport is not symmetric-normalized heat

[`ConservativeGraphField`](../games/4d_generic/graph_field.js) takes `(size, edges)` and `step(values, alpha, out=null, active=null)`. It removes duplicate/self edges and applies synchronous flux `alpha/maxDegree * (value[v]-value[u])` with equal-and-opposite updates. `alpha` is a dimensionless mixing fraction in `[0,1]`, not seconds or a material diffusion constant. Output must not alias input. An inactive mask removes incident edges but retains the site's stored value.

Transport conserves the uniform-site sum up to floating-point arithmetic; it is not degree-normalized or symmetric-normalized heat. SimAnt runs masked transport every ten logical ticks with mixing 0.8 and separately applies 2% evaporation every five ticks. Its source/saturation/evaporation/Float32-rounding accounting is separate from the conservative kernel.

## Testing

```sh
python3.13 games/run_games.py --test
python3.13 games/run_games.py --test --game chess doom
python3.13 games/run_games.py --validate
```

The unfiltered logic run includes nested shared JavaScript/Python tests; structural validation is not a browser gameplay test. The separate [Chromium gate](../games/tests/browser/README.md) exercises actual inputs/state/rendering for all catalog games and records real pointer-capture availability. See [testing guide](development/testing_guide.md) for commands and coverage boundaries rather than a frozen assertion total.

## Adding a new game

Use the existing [scaffold guide](../games/doc/scaffold_guide.md) and [game template](../games/doc/game_template.md). Implement actual board/render/input behavior, register metadata in `games/src/core/registry.py`, preserve shared script ordering, and add behavioral tests and real-browser coverage. A generated folder is not a completed game. Update the [portfolio index](../games/GAMES_INDEX.md) rather than duplicating per-game inventories throughout the docs.

## Relationship to core QuadCraft

The native prototype, browser geometry experiments and portfolio share mathematical interests but no unified world/entity/save/network runtime. Start with [architecture boundaries](architecture.md), [coordinate contracts](quadray_coordinates.md) and the selected game's own documentation before transferring assumptions between them.
