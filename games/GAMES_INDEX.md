# 🎮 QuadCraft Games Portfolio — GAMES_INDEX.md

> **Geometry & naming:** Quadray's four coefficients describe three spatial dimensions modulo a common offset. IVM nearest neighbors are the 12 permutations of `(0, 1, 1, 2)`. Some games deliberately retain independent raw four-index board labels; those labels must not be merged by physical gauge normalization. See the [suite conventions and interoperability guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md).

> **Canonical index** of all 4D games built on the Quadray tetrahedral coordinate system.
> Each game is a **standalone browser application** — self-contained for easy porting, forking, and independent versioning.

---

## Portfolio Summary

| Metric | Value |
|--------|-------|
| **Implemented Games** | 30 |
| **Reported Checks** | 2,395 passing, zero failures: game checks plus shared mathematical, renderer and Python suites |
| **Shared Modules** | 17 (12 core + 4 extended + hud-style.css) |
| **Architecture** | Standalone HTML + `4d_generic/` shared modules |
| **Last Validated** | 2026-11-06 with Python 3.13 — `python3 run_games.py --validate` and `python3 run_games.py --test` |

---

## 🏗️ Implemented Games — By Genre

> **Honest Completeness Metric**: Percentages evaluate how closely the implementation matches the depth of the original classic game it is based on, scaled for the 4D Synergetics environment. Many "simple" games are currently at 50-60% because they implement core loops but lack power-ups, multiple levels, varied enemy behaviors, or game-feel polish (particles, screen shake).

### Strategy & Board Games (9)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 1 | ♟️ **4D Chess** | [`4d_chess/`](4d_chess/) | 80% | 92 | 2 | 8⁴ discrete | None (2-player human) | Click | Shift-drag | Turn-based strategy, check/checkmate |
| 2 | 🏁 **4D Checkers** | [`4d_checkers/`](4d_checkers/) | 70% | 11 | 2 | 4⁴ discrete | Rule-based | Click | Left-drag | Diagonal capture + promotion |
| 3 | ⚫ **4D Reversi** | [`4d_reversi/`](4d_reversi/) | 80% | 34 | 2 | 4⁴ discrete | Greedy AI | Click | Shift-drag | Disc flipping + AI opponent |
| 4 | 🎲 **4D Backgammon** | [`4d_backgammon/`](4d_backgammon/) | 60% | 30 | 2 | 24-point spiral | Dice-driven | Click | Shift-drag | 24-point 4D spiral track + dice |
| 5 | 🏝️ **4D Catan** | [`4d_catan/`](4d_catan/) | 40% | 56 | 2 (1 human + 1 AI) | 19-hex tile | Trade AI | Click | Shift-drag | 19 tiles, resources, settlements |
| 6 | 🀄 **4D Mahjong** | [`4d_mahjong/`](4d_mahjong/) | 80% | 33 | 1 | 4-layer stack | — | Click | Shift-drag | 144-tile 4-layer matching |
| 7 | 🔴 **4D Connect Four** | [`4d_connect_four/`](4d_connect_four/) | 90% | 141 | 2 | 6×5×3×3 gravity | Lookahead | Click | Shift-drag | Gravity-drop 4-in-a-row detection |
| 8 | ⚪ **4D Go** | [`4d_go/`](4d_go/) | 60% | 33 | 2 | Liberties Grid | None (2-player human) | Click | Shift-drag | Go liberties on IVM |
| 9 | ⬡ **4D Hex** | [`4d_hex/`](4d_hex/) | 70% | 29 | 2 | Hex/IVM connection | Path AI | Click | Shift-drag | Topological connection |

### Arcade & Action (5)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 10 | 🚀 **4D Asteroids** | [`4d_asteroids/`](4d_asteroids/) | 50% | 67 | 1 | Continuous wrap | — | Keyboard | Shift-drag | Continuous motion + wrap-around |
| 11 | 🏓 **4D Pong** | [`4d_pong/`](4d_pong/) | 50% | 52 | 1-2 | Continuous | Tracking | Keyboard | Shift-drag | Paddle-ball with Quadray-labeled coordinates |
| 12 | 🧨 **4D Breakout** | [`4d_breakout/`](4d_breakout/) | 60% | 20 | 1 | Brick grid | — | Keyboard | Shift-drag | Brick-breaking with Quadray physics |
| 13 | 👽 **4D Space Invaders** | [`4d_space_invaders/`](4d_space_invaders/) | 65% | 43 | 1 | Formation grid | Formation | Keyboard | Shift-drag | Shield system + wave shooting |
| 14 | 💣 **4D Bomberman** | [`4d_bomberman/`](4d_bomberman/) | 65% | 22 | 1 | Destructible grid | Random walk | Keyboard | Shift-drag | Grid bombs, destructible walls |

### Maze & Navigation (3)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 15 | 👾 **4D Pac-Man** | [`4d_pacman/`](4d_pacman/) | 50% | 74 | 1 | Maze graph | Ghost chase | Keyboard | Shift-drag | Maze navigation, ghost AI |
| 16 | 🐸 **4D Frogger** | [`4d_frogger/`](4d_frogger/) | 60% | 27 | 1 | Lane-based | Traffic | Keyboard | Shift-drag | Lane-crossing, obstacle avoidance |
| 17 | 🐍 **4D Snake** | [`4d_snake/`](4d_snake/) | 55% | 48 | 1 | Discrete wrap | — | Keyboard | Shift-drag | Growing snake, food collection |

### Puzzle & Logic (7)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 18 | 🧱 **4D Tetris** | [`4d_tetris/`](4d_tetris/) | 70% | 18 | 1 | Falling-piece | — | Keyboard | Shift-drag | Falling tetrominoes on IVM grid |
| 19 | 💥 **4D Minesweeper** | [`4d_minesweeper/`](4d_minesweeper/) | 90% | 33 | 1 | Discrete reveal | — | Click | Shift-drag | Mine-counting with IVM neighbors |
| 20 | 🔢 **4D Sudoku** | [`4d_sudoku/`](4d_sudoku/) | 80% | 32 | 1 | Canonical IVM cells | — | Click | Shift-drag | Constraint-satisfaction on the IVM graph |
| 21 | 💡 **4D Lights Out** | [`4d_lights_out/`](4d_lights_out/) | 90% | 46 | 1 | Toggle grid | — | Click | Shift-drag | Pattern toggle on IVM neighbors |
| 22 | 🎰 **4D 2048** | [`4d_2048/`](4d_2048/) | 80% | 28 | 1 | 4⁴ merge grid | — | Keyboard | Shift-drag | Tile merging in 12 IVM directions |
| 23 | 🧩 **4D Sokoban** | [`4d_sokoban/`](4d_sokoban/) | 75% | 34 | 1 | Discrete push | — | Keyboard | Shift-drag | Box-pushing across IVM grid |
| 24 | 🎴 **4D Memory** | [`4d_memory/`](4d_memory/) | 85% | 27 | 1-2 | Pair grid | — | Click | Shift-drag | Flip-match pairs in tetrahedral layout |

### Simulation & World (3)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 25 | 🧬 **4D Life** | [`4d_life/`](4d_life/) | 80% | 43 | — | Cellular automaton | CA rules | — | Shift-drag | Pattern presets + CA with 4D wrapping |
| 26 | 🐜 **4D SimAnt** | [`4d_simant/`](4d_simant/) | 55% | 148 | 1 | Pheromone grid | Swarm | Mouse + KB | Shift-drag | Pheromone trails, foraging AI |
| 27 | ⛏️ **4D Minecraft** | [`4d_minecraft/`](4d_minecraft/) | 40% | 124 | 1 | 8⁴ discrete | — | Keyboard + Click | Shift-drag | Terrain gen, trees, block inventory |

### RPG & Adventure (1)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 28 | ⚔️ **4D Rogue** | [`4d_rogue/`](4d_rogue/) | 50% | 164 | 1 | Dungeon rooms | Wander/chase | Keyboard | Shift-drag | Procedural dungeon, permadeath |

### Tower Defense & FPS (2)

| # | Game | Dir | Complete | Tests | Players | Grid | AI | Input | Camera | Key Mechanic |
|---|------|-----|----------|-------|---------|------|-----|-------|--------|-------------|
| 29 | 🏰 **4D Tower Defense** | [`4d_tower_defense/`](4d_tower_defense/) | 60% | 222 | 1 | Path grid | Spawn waves | Click | Shift-drag | Waves, auto-targeting towers, gold |
| 30 | 👹 **4D Doom** | [`4d_doom/`](4d_doom/) | 50% | 136 | 1 | Raycasted 3D | Pursuit | Keyboard + Mouse | FPS Mouselook | Hitscan FPS, enemy AI pursuit |

The game rows count game-specific checks. The portfolio total also includes shared mathematical, renderer and Python infrastructure checks.

---

## 🔧 Shared Module Adoption Matrix

All games import from `4d_generic/`. The **Core 12** modules are used by every game. The **Extended 4** modules provide specialized infrastructure for entity management, pathfinding, and turn rotation.

### Core Modules (12) — Universal Adoption

| Module | Category | Description | Adopted |
|--------|----------|-------------|---------|
| `quadray.js` | Math | Quadray class `(a,b,c,d)` with arithmetic | 30/30 |
| `synergetics.js` | Math | IVM constants, tetra/octa volumes, Jitterbug | 30/30 |
| `grid_utils.js` | Math | IVM grid gen, neighbors, distance, depth sort | 30/30 |
| `camera.js` | Rendering | Drag-to-rotate camera controller | 29/30 ¹ |
| `projection.js` | Rendering | Quadray → screen-space projection | 30/30 |
| `zoom.js` | Rendering | Mouse-wheel zoom with clamping | 29/30 ¹ |
| `base_renderer.js` | Rendering | Base canvas renderer with Quadray projection | 29/30 ¹ |
| `game_loop.js` | Engine | Fixed-timestep rAF loop with pause/stop | 29/30 ¹ |
| `base_game.js` | Engine | Base controller: GameLoop + InputController + Camera | 29/30 ¹ |
| `score_manager.js` | Engine | Score/level/lives with localStorage persistence | 29/30 ¹ |
| `input_controller.js` | Input | Unified keyboard input: bindings + polled state | 29/30 ¹ |
| `hud.js` | UI | Color-coded HUD state manager | 29/30 ¹ |

> ¹ Doom preloads the four shared geometry scripts as classic scripts, then uses its own ES-module engine. Its `js/quadray.js` bridge exposes the shared lexical Quadray implementation to ESM consumers.

### Extended Modules (4) — Specialized Adoption

| Module | Category | Description | Adopted | Games Using |
|--------|----------|-------------|---------|-------------|
| `base_board.js` | Engine | Grid ops, distances, integrity checks, metadata | **29/30** | All except Doom |
| `turn_manager.js` | Engine | Player rotation, undo/redo stack | **11/30** | Chess, Checkers, Reversi, Backgammon, Catan, Connect Four, Go, Hex, Memory, Rogue, Sudoku |
| `entity_system.js` | Engine | QuadrayEntity + EntityManager (collision, wrapping) | **3/30** | Asteroids, SimAnt, Space Invaders |
| `pathfinding.js` | Engine | BFS, A*, flood fill, line-of-sight | **3/30** | Pac-Man, Rogue, SimAnt |

### Additional Shared Assets

| File | Type | Description |
|------|------|-------------|
| `hud-style.css` | CSS | Shared HUD panel and overlay styles |

### Per-Game Module Map

Legend: ● = imported | — = not applicable

| Game | QR | SY | GU | CA | PR | ZM | BR | GL | BG | SM | IC | HD | bb | es | tm | pf |
|------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| Chess | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Checkers | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Reversi | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Backgammon | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Catan | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Mahjong | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Connect Four | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Go | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Hex | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Asteroids | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Pong | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Breakout | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Space Invaders | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Bomberman | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Pac-Man | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | ● |
| Frogger | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Snake | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Tetris | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Minesweeper | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Sudoku | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Lights Out | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| 2048 | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Sokoban | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Memory | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Life | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| SimAnt | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● |
| Minecraft | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Rogue | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | ● |
| Tower Defense | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Doom | ● | ● | ● | — | ● | — | — | — | — | — | — | — | — | — | — | — |

> **Column key:** QR=quadray, SY=synergetics, GU=grid_utils, CA=camera, PR=projection, ZM=zoom, BR=base_renderer, GL=game_loop, BG=base_game, SM=score_manager, IC=input_controller, HD=hud, **bb=base_board, es=entity_system, tm=turn_manager, pf=pathfinding**

---

## 📊 Genre Distribution

| Genre | Games | Tests | % of Portfolio |
|-------|-------|-------|---------------|
| Strategy & Board | 9 | 459 | 30% |
| Arcade & Action | 5 | 204 | 17% |
| Maze & Navigation | 3 | 149 | 10% |
| Puzzle & Logic | 7 | 218 | 23% |
| Simulation & World | 3 | 315 | 10% |
| RPG & Adventure | 1 | 164 | 3% |
| Tower Defense & FPS | 2 | 358 | 7% |
| **Total game-specific checks** | **30** | **1,867** | **100%** |

---

## 📁 Infrastructure Reference

### Documentation (`doc/`)

| Document | Description |
|----------|-------------|
| [`architecture.md`](doc/architecture.md) | System architecture, module relationships, data flow |
| [`shared_modules_reference.md`](doc/shared_modules_reference.md) | Detailed API for all 17 `4d_generic/` modules |
| [`space_math_reference.md`](doc/space_math_reference.md) | Quadray math, IVM geometry, Synergetics constants |
| [`testing_guide.md`](doc/testing_guide.md) | Test patterns, Node.js test runner, CI integration |
| [`contributing.md`](doc/contributing.md) | How to add a new game to the portfolio |
| [`game_template.md`](doc/game_template.md) | Standard directory structure for new games |
| [`scaffold_guide.md`](doc/scaffold_guide.md) | Using `GameScaffold` to auto-generate game boilerplate |
| [`configuration.md`](doc/configuration.md) | `games_config.json` format, port assignments |
| [`launch_operations.md`](doc/launch_operations.md) | `run_games.py` usage, multi-game serving |
| [`analytics_reporting.md`](doc/analytics_reporting.md) | `GameAnalytics` reporting infrastructure |
| [`python_infrastructure.md`](doc/python_infrastructure.md) | `src/` package structure and module breakdown |
| [`scripts_reference.md`](doc/scripts_reference.md) | Utility scripts for auditing, scaffolding, matrix generation |

### Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `regenerate_scripts.py` | Generate launcher wrapper scripts from template |
| `generate_matrix.py` | Auto-generate module adoption matrix from index.html |
| `generate_test_html.py` | Generate browser-based test runner pages |
| `audit_docs.py` | Verify AGENTS.md/README.md exist in all directories |
| `ensure_agents_md.py` | Create missing AGENTS.md files from templates |
| `fix_docs.py` | Batch-fix documentation issues |
| `_run_template.sh` | Template for launcher wrapper scripts (delegates to `run_games.py`) |

### Python Infrastructure (`src/`)

| Package | Contents | Purpose |
|---------|----------|---------|
| `src/core/` | `registry.py` | Game registry (30 games), config loading |
| `src/server/` | `launcher.py` | HTTP server per game, port management |
| `src/qa/` | `testing.py`, `validation.py` | Test runner, structural validation |
| `src/scaffold/` | `__init__.py` (`GameScaffold`) | Game boilerplate generator |
| `src/analytics/` | `__init__.py` (`GameAnalytics`) | Per-game performance/coverage reporting |
| `src/space/` | `quadrays.py`, `ivm.py`, `geometry.py`, `xyz.py` | Python Quadray math (mirrors JS) |
| `src/shared/` | JS metadata | Shared module metadata for Python tools |
| `src/board/` | Audit tools | Board analysis, migration helpers |

### Tests (`tests/`)

| Location | Contents | Count |
|----------|----------|-------|
| `tests/shared/` | 13 test files for all `4d_generic/` modules | 43 tests |
| `tests/space/` | Python Quadray/IVM geometry tests | Varies |
| `tests/test_config.py` | Config file validation | 2 tests |
| `tests/test_registry.py` | Registry integrity checks | 2 tests |
| `tests/test_validation.py` | Structural validation tests | 1 test |
| Per-game `4d_*/tests/` | Game-specific unit tests | 1,205 tests |

---

## Launch System

### Python Launcher

```bash
python3 run_games.py --list                    # List all 30 games
python3 run_games.py --game chess              # Single game
python3 run_games.py --game chess doom life    # Multiple games
python3 run_games.py --all                     # All 30 simultaneously
python3 run_games.py --all --base-port 9000    # Custom port range
python3 run_games.py --config games_config.json # From config file
python3 run_games.py --test                    # All game, shared and Python checks
python3 run_games.py --validate                # Structural validation (30/30)
```

---

## Standalone Architecture

```text
games/4d_<game>/
├── index.html              # Entry point — imports shared modules from ../4d_generic/
├── AGENTS.md               # Game-specific agent instructions
├── js/
│   ├── <game>_board.js     # Board / world state
│   ├── <game>_renderer.js  # Canvas rendering
│   └── <game>_game.js      # Controller + UI logic
└── tests/
    └── test_<game>.js      # Node.js unit tests
```

### Why Standalone?

- **Zero build step** — open `index.html` and play
- **Independent versioning** — each game tagged/released separately
- **Easy forking** — copy one folder to start a new project
- **No coupling** — updating Chess never breaks Checkers
- **Portable** — deploy to any static host (GitHub Pages, S3, etc.)

### Shared Foundation (`4d_generic/`)

All games import shared modules from `4d_generic/` via `<script>` tags:

| Module | Category | Contents |
|--------|----------|----------|
| `quadray.js` | Math | Quadray class (single source of truth) |
| `synergetics.js` | Math | Synergetics constants + verification |
| `grid_utils.js` | Math | IVM neighbors, distance, sorting |
| `camera.js` | Rendering | CameraController (drag-to-rotate) |
| `projection.js` | Rendering | projectQuadray() + drawQuadrayAxes() |
| `zoom.js` | Rendering | setupZoom() (mouse-wheel zoom) |
| `base_renderer.js` | Rendering | BaseRenderer (canvas, projection, axes) |
| `game_loop.js` | Engine | GameLoop (rAF with delta tracking) |
| `base_game.js` | Engine | BaseGame lifecycle (init, start, pause, reset) |
| `score_manager.js` | Engine | ScoreManager (win/loss/score tracking) |
| `input_controller.js` | Input | InputController (keyboard/mouse events) |
| `hud.js` | UI | HUD rendering (status, controls, geometry) |
| `base_board.js` | Engine | BaseBoard (grid ops, distances, integrity, metadata) |
| `entity_system.js` | Engine | QuadrayEntity + EntityManager (collision, wrapping) |
| `turn_manager.js` | Engine | TurnManager (player rotation, undo/redo) |
| `pathfinding.js` | Engine | QuadrayPathfinder (BFS, A*, flood fill, LoS) |
| `hud-style.css` | CSS | Shared CSS for HUD panels and overlays |

> **4D Doom** uses ES Modules and imports `quadray.js`, `synergetics.js`, `grid_utils.js`, and `projection.js` via an ESM re-export shim that delegates to the shared globals.

---

## Technical Documentation Cross-References

### Mathematics

| Document | Path | Relevant Games |
|----------|------|----------------|
| Quadray Coordinates | [`docs/mathematics/quadray_coordinates.md`](../docs/mathematics/quadray_coordinates.md) | All |
| Tetrahedral Geometry | [`docs/mathematics/tetrahedral_geometry.md`](../docs/mathematics/tetrahedral_geometry.md) | Checkers, Minecraft, Life |

### Game Design

| Document | Path | Relevant Games |
|----------|------|----------------|
| Block System | [`docs/game_design/block_system.md`](../docs/game_design/block_system.md) | Minecraft |
| World Generation | [`docs/game_design/world_generation.md`](../docs/game_design/world_generation.md) | Minecraft, Catan |
| Controls | [`docs/game_design/controls_and_navigation.md`](../docs/game_design/controls_and_navigation.md) | All interactive games |

---

## 🌟 Enhancements for Existing Games

> **Historical snapshot — not authoritative.** The "Complete" percentages below were captured at an earlier date and **contradict** the portfolio table above (e.g. Asteroids, Breakout, Pong). The by-genre portfolio table earlier in this file is the **canonical** completeness record.

To fully leverage the Synergetics engine, existing games can be upgraded in the following ways to deepen their Quadray integration.

### 1. Simple Games (Arcade/Abstract)

| Game | Path | Grid/Space | Dimensions | Rendering | Control Scheme | Physics | Complete |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4D Snake** | `4d_snake` | Discrete IVM | 4D (a,b,c,d) | 2D Canvas Projection | Arrow keys + W/S/Q/E | Grid-locked | 55% |
| **4D Pong** | `4d_pong` | Continuous Quadray | 4D (a,b,c,d) | 2D Canvas Projection | Keyboard (W/S & Up/Down) | Bouncing Ray | 60% |
| **4D Tetris** | `4d_tetris` | Discrete IVM | 4D (a,b,c,d) | 2D Canvas Projection | Keyboard | Gravity, Collision | 70% |
| **4D Breakout** | `4d_breakout` | Continuous Quadray | 4D (a,b,c,d) | 2D Canvas Projection | Keyboard | Bouncing Ray, Collision | 50% |
| **4D Pac-Man** | `4d_pacman` | Discrete IVM | 4D (a,b,c,d) | 2D Canvas Projection | Keyboard (WASDQEZX) | Grid-locked | 50% |
| **4D Asteroids** | `4d_asteroids` | Continuous Quadray | 4D (a,b,c,d) | 2D Canvas Projection | Thrust/Rotate, Wrapping | Inertia, Wrapping | 100% |

**Proposed enhancement idea:** **4D Doom** — expand with multiple levels, new weapon types, and WebRTC multiplayer (priority: High).

---

## 🚀 Proposed New Games

These concepts are designed to uniquely demonstrate the power of Quadray coordinates and the Isotropic Vector Matrix (IVM), ranging from simple mechanics to complex simulations.

### Simple & Casual

| Game | Genre | Core Quadray Mechanic |
|------|-------|-----------------------|
| 🎳 **4D Bowling** | Physics | Rolling a sphere down a tetrahedral lane; physics collisions on IVM |
| 🎱 **4D Billiards** | Physics | Momentum transfer between spheres naturally suited to the IVM close-packing |
| 🧠 **4D Simon Says** | Memory | Memorizing sequences based purely on the 4 primary Quadray basis vectors |
| 🪀 **4D Labyrinth** | Puzzle | Tilting the coordinate system to roll a marble through volumetric IVM mazes |
| 🔠 **4D Scrabble** | Word | Placing interlocking words across the 12 IVM planar directions |

### Complex & Advanced

| Game | Genre | Core Quadray Mechanic |
|------|-------|-----------------------|
| 🏭 **4D Factorio** | Automation | Routing conveyor belts and assembling machines deeply packed in the IVM grid |
| 🌀 **4D Portal** | Puzzle | Non-Euclidean topology mapping and momentum conservation across Quadray boundaries |
| 🏙️ **4D SimCity** | Simulation | Zoning and traffic routing taking advantage of 12-neighbor spherical density |
| 🌍 **4D Civilization** | 4X Strategy | Hex/Tetra expansion, exploiting continuous terrain generation without polar distortion |
| 🍄 **4D Platformer** | Action | Gravity that dynamically aligns to the 4 Quadray basis planes (A, B, C, D) |
| ☄️ **4D Space Program** | Simulation | Orbital mechanics using purely Quadray mathematics instead of Cartesian physics |

---

## Contributing a New Game

1. **Scaffold** with `GameScaffold` (recommended) or create manually:

   ```python
   from games.src.scaffold import GameScaffold
   # game_key must be NEW (create() refuses existing dirs unless overwrite=True)
   GameScaffold('bowling', '4D Bowling', optional_modules=['base_board.js', 'pathfinding.js']).create()
   ```

2. Import shared modules from `../4d_generic/` in `index.html`
3. **Check the Module Adoption Matrix** — use extended modules (`base_board`, `entity_system`, `turn_manager`, `pathfinding`) where applicable
4. Implement `<name>_board.js`, `<name>_renderer.js`, `<name>_game.js` in `js/`
5. Add tests in `tests/`
6. Add entry to `GAMES` registry in `games/src/core/registry.py`
7. Run `python3 games/run_games.py --validate` to confirm structural integrity
8. **Add a row to the portfolio table above**
9. Verify with `python3 games/run_games.py --validate && python3 games/run_games.py --test`

---

*Part of the [QuadCraft](../) project — Exploring 4D tetrahedral geometry through interactive applications.*
