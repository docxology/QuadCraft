# 🎮 QuadCraft Games Portfolio — GAMES_INDEX.md

> **Canonical index** of all 4D games built on the Quadray tetrahedral coordinate system.
> Each game is a **standalone browser application** — self-contained for easy porting, forking, and independent versioning.

---

## Portfolio Summary

| Metric | Value |
|--------|-------|
| **Implemented Games** | 22 |
| **Total Unit Tests** | 1,060 (707 per-game + 353 shared) |
| **Shared Modules** | 17 (12 core + 4 extended + hud-style.css) |
| **Proposed Games** | 28 |
| **Architecture** | Standalone HTML + `4d_generic/` shared modules |

---

## 🏗️ Implemented Games — By Genre

### Strategy & Board Games

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 1 | ♟️ **4D Chess** | [`4d_chess/`](4d_chess/) | ✅ | 91 | 2 | 8⁴ discrete | Minimax | Click | Turn-based strategy, check/checkmate |
| 2 | 🏁 **4D Checkers** | [`4d_checkers/`](4d_checkers/) | ✅ | 11 | 2 | 8⁴ discrete | Rule-based | Click | Diagonal capture + promotion |
| 3 | ⚫ **4D Reversi** | [`4d_reversi/`](4d_reversi/) | ✅ | 11 | 2 | 8⁴ discrete | Greedy | Click | Disc flipping across 80 directions |
| 7 | 🎲 **4D Backgammon** | [`4d_backgammon/`](4d_backgammon/) | ✅ | 8 | 2 | 24-point spiral | Dice-driven | Click | 24-point 4D spiral track + dice |
| 9 | 🏝️ **4D Catan** | [`4d_catan/`](4d_catan/) | ✅ | 10 | 2-4 | 19-hex tile | Trade AI | Click | 19 tiles, resources, settlements |
| 12 | 🀄 **4D Mahjong** | [`4d_mahjong/`](4d_mahjong/) | ✅ | 7 | 1 | 4-layer stack | — | Click | 144-tile 4-layer matching |
| 21 | 🔴 **4D Connect Four** | [`4d_connect_four/`](4d_connect_four/) | ✅ | 70 | 2 | 7⁴ gravity | Lookahead | Click | Gravity-drop 4-in-a-row detection |

### Arcade & Action

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 5 | 🚀 **4D Asteroids** | [`4d_asteroids/`](4d_asteroids/) | ✅ | 12 | 1 | Continuous wrap | — | Keyboard | Continuous motion + wrap-around |
| 15 | 🏓 **4D Pong** | [`4d_pong/`](4d_pong/) | ✅ | 19 | 1-2 | Continuous | Tracking | Keyboard | Paddle-ball in tetrahedral space |
| 16 | 🧨 **4D Breakout** | [`4d_breakout/`](4d_breakout/) | ✅ | 20 | 1 | Brick grid | — | Keyboard | Brick-breaking with Quadray physics |
| 18 | 👽 **4D Space Invaders** | [`4d_space_invaders/`](4d_space_invaders/) | ✅ | 22 | 1 | Formation grid | Formation | Keyboard | Wave-based shooting, formations |
| 20 | 💣 **4D Bomberman** | [`4d_bomberman/`](4d_bomberman/) | ✅ | 22 | 1 | Destructible grid | Patrol | Keyboard | Grid bombs, destructible walls |

### Maze & Navigation

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 17 | 👾 **4D Pac-Man** | [`4d_pacman/`](4d_pacman/) | ✅ | 19 | 1 | Maze graph | Ghost chase | Keyboard | Maze navigation, ghost AI |
| 19 | 🐸 **4D Frogger** | [`4d_frogger/`](4d_frogger/) | ✅ | 23 | 1 | Lane-based | Traffic | Keyboard | Lane-crossing, obstacle avoidance |
| 14 | 🐍 **4D Snake** | [`4d_snake/`](4d_snake/) | ✅ | 15 | 1 | Discrete wrap | — | Keyboard | Growing snake, food collection |

### Puzzle & Logic

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 13 | 🧱 **4D Tetris** | [`4d_tetris/`](4d_tetris/) | ✅ | 18 | 1 | Falling-piece | — | Keyboard | Falling tetrominoes on IVM grid |
| 22 | 💥 **4D Minesweeper** | [`4d_minesweeper/`](4d_minesweeper/) | ✅ | 23 | 1 | Discrete reveal | — | Click | Mine-counting with IVM neighbors |

### Simulation & World

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 4 | 🧬 **4D Life** | [`4d_life/`](4d_life/) | ✅ | 8 | — | Cellular automaton | CA rules | — | Cellular automata with 4D wrapping |
| 6 | 🐜 **4D SimAnt** | [`4d_simant/`](4d_simant/) | ✅ | 10 | 1 | Pheromone grid | Swarm | — | Pheromone trails, foraging AI |
| 8 | ⛏️ **4D Minecraft** | [`4d_minecraft/`](4d_minecraft/) | ✅ | 74 | 1 | Voxel chunks | — | Keyboard + Click | Terrain gen, trees, block inventory |

### Tower Defense & FPS

| # | Game | Dir | Status | Tests | Players | Grid | AI | Input | Key Mechanic |
|---|------|-----|--------|-------|---------|------|-----|-------|-------------|
| 10 | 🏰 **4D Tower Defense** | [`4d_tower_defense/`](4d_tower_defense/) | ✅ | 98 | 1 | Path grid | Spawn waves | Click | Waves, auto-targeting towers, gold |
| 11 | 👹 **4D Doom** | [`4d_doom/`](4d_doom/) | ✅ | 116 | 1 | Raycasted 3D | Pursuit | Keyboard + Mouse | Hitscan FPS, enemy AI pursuit |

**Total: 22 games, 1,060 unit tests (707 per-game + 353 shared), all passing ✅**

---

## 🔧 Shared Module Adoption Matrix

All games import from `4d_generic/`. The **Core 12** modules are used by every game (except Doom, which uses ES module imports). The **Extended 4** modules are available but not yet adopted — they represent the highest-value integration targets for new and existing games.

### Core Modules (12) — Universal Adoption

| Module | Category | Description | Used By |
|--------|----------|-------------|---------|
| `quadray.js` | Math | Quadray class `(a,b,c,d)` with arithmetic | 21/22 |
| `synergetics.js` | Math | IVM constants, tetra/octa volumes, Jitterbug | 21/22 |
| `grid_utils.js` | Math | IVM grid gen, neighbors, distance, depth sort | 21/22 |
| `camera.js` | Rendering | Shift-drag camera rotation controller | 21/22 |
| `projection.js` | Rendering | Quadray → screen-space projection | 21/22 |
| `zoom.js` | Rendering | Mouse-wheel zoom with clamping | 21/22 |
| `base_renderer.js` | Rendering | Base canvas renderer with Quadray projection | 21/22 |
| `game_loop.js` | Engine | Fixed-timestep rAF loop with pause/stop | 21/22 |
| `base_game.js` | Engine | Base controller: GameLoop + InputController + Camera | 21/22 |
| `score_manager.js` | Engine | Score/level/lives with localStorage persistence | 21/22 |
| `input_controller.js` | Input | Unified keyboard input: bindings + polled state | 21/22 |
| `hud.js` | UI | Color-coded HUD state manager | 21/22 |

### Extended Modules (4) — 🎯 Available for Adoption

These modules exist in `4d_generic/` but **no game currently imports them**. They represent ready-to-use infrastructure for future games and refactoring of existing ones.

| Module | Category | Description | Best Candidates | Used By |
|--------|----------|-------------|-----------------|---------|
| `base_board.js` | Engine | Grid ops, distances, integrity checks, metadata | Chess, Checkers, Reversi, Catan, Minesweeper | **20/22** |
| `entity_system.js` | Engine | QuadrayEntity + EntityManager (collision, wrapping) | Asteroids, SimAnt, Doom, Tower Defense, Frogger | **8/22** |
| `turn_manager.js` | Engine | Player rotation, undo/redo stack | Chess, Checkers, Reversi, Backgammon, Connect Four, Catan | **7/22** |
| `pathfinding.js` | Engine | BFS, A*, flood fill, line-of-sight | Pac-Man, Tower Defense, Doom, SimAnt, Bomberman | **5/22** |

### Additional Shared Assets

| File | Type | Description |
|------|------|-------------|
| `hud-style.css` | CSS | Shared HUD panel and overlay styles |

### Per-Game Module Map

Legend: ● = uses module | ○ = would benefit from module | — = not applicable

| Game | QR | SY | GU | CA | PR | ZM | BR | GL | BG | SM | IC | HD | bb | es | tm | pf |
|------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| Chess | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Checkers | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Reversi | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Life | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Asteroids | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| SimAnt | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | ● |
| Backgammon | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Minecraft | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Catan | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Tower Defense | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | ● |
| Doom | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Mahjong | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Tetris | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — | — |
| Snake | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Pong | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Breakout | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Pac-Man | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● |
| Space Invaders | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | — |
| Frogger | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● |
| Bomberman | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● |
| Connect Four | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |
| Minesweeper | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | — | ● | — |

> **Column key:** QR=quadray, SY=synergetics, GU=grid_utils, CA=camera, PR=projection, ZM=zoom, BR=base_renderer, GL=game_loop, BG=base_game, SM=score_manager, IC=input_controller, HD=hud, **bb=base_board, es=entity_system, tm=turn_manager, pf=pathfinding** (extended — lowercase = not yet adopted)

---

## 🚀 Proposed Games — Waves 3–5

Future games with recommended shared module adoption. Games marked with 🎯 are high-value candidates for the **extended modules**.

### Wave 3: RPG, Roguelike & Adventure

| # | Game | Proposed Dir | Genre | Players | Grid | AI | Input | Key Mechanic | bb | es | tm | pf |
|---|------|-------------|-------|---------|------|-----|-------|-------------|----|----|----|----|
| 23 | ⚔️ **4D Rogue** | `4d_rogue/` | Roguelike | 1 | Dungeon rooms | Wander/chase | Keyboard | Procedural dungeon, permadeath | 🎯 | 🎯 | 🎯 | 🎯 |
| 24 | 🧙 **4D Gauntlet** | `4d_gauntlet/` | Action RPG | 1-4 | Arena tiles | Swarm | Keyboard | Monster spawners, class abilities | 🎯 | 🎯 | — | 🎯 |
| 25 | 🗡️ **4D Zelda** | `4d_zelda/` | Adventure | 1 | Screen rooms | Patrol/attack | Keyboard | Room-based exploration, items | 🎯 | 🎯 | — | 🎯 |
| 26 | 🐉 **4D Dragon Quest** | `4d_dragon_quest/` | Turn RPG | 1 | Overworld + battle | Turn-based | Click | Random encounters, party combat | 🎯 | 🎯 | 🎯 | 🎯 |
| 27 | 🏰 **4D Dungeon Crawler** | `4d_dungeon_crawler/` | Dungeon crawl | 1 | First-person grid | Guard paths | Keyboard | Grid movement, torch light, loot | 🎯 | 🎯 | 🎯 | 🎯 |
| 28 | 🧛 **4D Castlevania** | `4d_castlevania/` | Platformer | 1 | Side-scroll tiles | Patrol | Keyboard | Whip combat, sub-weapons, bosses | — | 🎯 | — | — |

### Wave 4: Puzzle, Card & Word Games

| # | Game | Proposed Dir | Genre | Players | Grid | AI | Input | Key Mechanic | bb | es | tm | pf |
|---|------|-------------|-------|---------|------|-----|-------|-------------|----|----|----|----|
| 29 | 🃏 **4D Solitaire** | `4d_solitaire/` | Card | 1 | Card stacks | — | Click/Drag | Klondike with 4D card dimensions | — | — | — | — |
| 30 | 🎰 **4D 2048** | `4d_2048/` | Puzzle | 1 | 4⁴ merge grid | — | Keyboard | Tile merging in 4 directions | 🎯 | — | — | — |
| 31 | 🔤 **4D Wordle** | `4d_wordle/` | Word | 1 | 5×6 guess grid | — | Keyboard | Letter guessing with 4D color hints | — | — | — | — |
| 32 | 🧩 **4D Sokoban** | `4d_sokoban/` | Puzzle | 1 | Discrete push | — | Keyboard | Box-pushing across IVM grid | 🎯 | 🎯 | — | 🎯 |
| 33 | 🎴 **4D Memory** | `4d_memory/` | Card | 1-2 | Pair grid | — | Click | Flip-match pairs in tetrahedral layout | 🎯 | — | 🎯 | — |
| 34 | 💎 **4D Bejeweled** | `4d_bejeweled/` | Match-3 | 1 | Gem grid | — | Click/Drag | Gem swapping with cascade matches | 🎯 | — | — | — |
| 35 | 🔢 **4D Sudoku** | `4d_sudoku/` | Logic | 1 | 4⁴ constraint | — | Click | Constraint-satisfaction in 4D regions | 🎯 | — | — | — |
| 36 | 🌊 **4D Pipe Dream** | `4d_pipe_dream/` | Puzzle | 1 | Pipe grid | — | Click | Pipe-rotation puzzle, flow simulation | 🎯 | — | — | 🎯 |

### Wave 5: Multiplayer, Sports & Sandbox

| # | Game | Proposed Dir | Genre | Players | Grid | AI | Input | Key Mechanic | bb | es | tm | pf |
|---|------|-------------|-------|---------|------|-----|-------|-------------|----|----|----|----|
| 37 | ⚽ **4D Soccer** | `4d_soccer/` | Sports | 2 | Continuous field | Team AI | Keyboard | Ball physics, passing, goals | — | 🎯 | 🎯 | 🎯 |
| 38 | 🏀 **4D Basketball** | `4d_basketball/` | Sports | 2 | Court | Team AI | Keyboard | Shooting arc, rebounds, plays | — | 🎯 | 🎯 | — |
| 39 | 🎾 **4D Tennis** | `4d_tennis/` | Sports | 1-2 | Court halves | Return AI | Keyboard | Serve, volley, scoring | — | 🎯 | 🎯 | — |
| 40 | 🏎️ **4D Racing** | `4d_racing/` | Racing | 1-4 | Track circuit | Follow path | Keyboard | Tetrahedral track, drifting, laps | — | 🎯 | — | 🎯 |
| 41 | 🌍 **4D SimCity** | `4d_simcity/` | Simulation | 1 | Zoning grid | Population | Click | Zone, build, manage city resources | 🎯 | 🎯 | — | 🎯 |
| 42 | 🐟 **4D Aquarium** | `4d_aquarium/` | Sim/Toy | 1 | Continuous 3D | Flocking | — | Boids flocking in tetrahedral space | — | 🎯 | — | — |
| 43 | 🎯 **4D Archery** | `4d_archery/` | Aim | 1 | Continuous | — | Mouse | Arrow trajectory through 4D space | — | 🎯 | — | — |
| 44 | 🧲 **4D Lemmings** | `4d_lemmings/` | Puzzle | 1 | Scrolling terrain | Walker AI | Click | Assign abilities to save lemmings | — | 🎯 | — | 🎯 |
| 45 | ♠️ **4D Poker** | `4d_poker/` | Card | 2-6 | Card table | Bluff AI | Click | Betting rounds, hand ranking | — | — | 🎯 | — |
| 46 | 🎪 **4D Circus** | `4d_circus/` | Platformer | 1 | Side-scroll | — | Keyboard | Acrobatics, timing jumps, trapeze | — | 🎯 | — | — |
| 47 | 🏗️ **4D Bridge Builder** | `4d_bridge_builder/` | Engineering | 1 | Structural grid | Physics | Click | Structural integrity, load testing | 🎯 | — | — | — |
| 48 | 🗺️ **4D Risk** | `4d_risk/` | Strategy | 2-6 | Territory map | Territorial | Click | Army placement, dice combat, fortify | 🎯 | 🎯 | 🎯 | — |
| 49 | 🐲 **4D Pokemon** | `4d_pokemon/` | Creature RPG | 1 | Overworld grid | Wild/Trainer | Keyboard + Click | Capture, train, battle creatures | 🎯 | 🎯 | 🎯 | 🎯 |
| 50 | 🔫 **4D Contra** | `4d_contra/` | Run-and-gun | 1-2 | Side-scroll | Wave spawn | Keyboard | Spread shot, power-ups, bosses | — | 🎯 | — | — |

---

## 📊 Genre Distribution

| Genre | Implemented | Proposed | Total |
|-------|------------|----------|-------|
| Strategy & Board | 7 | 1 | 8 |
| Arcade & Action | 5 | 2 | 7 |
| Maze & Navigation | 3 | 0 | 3 |
| Puzzle & Logic | 2 | 6 | 8 |
| Simulation & World | 3 | 2 | 5 |
| Tower Defense & FPS | 2 | 0 | 2 |
| RPG & Adventure | 0 | 6 | 6 |
| Card & Word | 0 | 4 | 4 |
| Sports & Racing | 0 | 4 | 4 |
| Platformer & Run-and-gun | 0 | 3 | 3 |
| **Total** | **22** | **28** | **50** |

---

## 🎯 Extended Module Adoption Roadmap

The 4 extended modules in `4d_generic/` are fully implemented but not yet imported by any game. Adopting them would reduce per-game code and standardize patterns.

### Adoption Priority

| Priority | Module | Games That Would Benefit | Impact |
|----------|--------|------------------------|--------|
| 🔴 High | `turn_manager.js` | Chess, Checkers, Reversi, Backgammon, Connect Four, Catan (6 games) | Standardizes turn rotation + undo/redo |
| 🔴 High | `pathfinding.js` | Pac-Man, Tower Defense, SimAnt, Bomberman, Doom (5 games) | Replaces per-game BFS/A* with shared impl |
| 🟡 Medium | `entity_system.js` | Asteroids, Space Invaders, Frogger, Pong, Breakout, Snake (6 games) | Standardizes collision detection + wrapping |
| 🟡 Medium | `base_board.js` | Chess, Checkers, Reversi, Connect Four, Minesweeper, Catan (6 games) | Unifies grid ops, distance calcs, integrity checks |

### Migration Pattern

```text
Before (per-game):                    After (shared):
chess_board.js: own grid logic   →    import base_board.js + extend
chess_board.js: own move undo    →    import turn_manager.js
pacman_game.js: own BFS          →    import pathfinding.js
asteroids_game.js: own collision →    import entity_system.js
```

---

## Launch System

### Per-Game Shell Scripts

```bash
./games/4d_chess/run.sh          # port 8100
./games/4d_checkers/run.sh       # port 8101
# ...
./games/run.sh --list            # List all
```

### Python Launcher

```bash
python3 run_games.py --list                    # List all games
python3 run_games.py --game chess              # Single game
python3 run_games.py --game chess doom life    # Multiple games
python3 run_games.py --all                     # All 22 simultaneously
python3 run_games.py --all --base-port 9000    # Custom port range
python3 run_games.py --config games_config.json # From config file
python3 run_games.py --test                    # Run all unit tests
python3 run_games.py --validate                # Structural validation
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

> **4D Doom** uses ES-module `import/export` syntax and retains its own quadray.js variant.

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

## Contributing a New Game

1. **Scaffold** with `GameScaffold` (recommended) or create manually:

   ```python
   from games.src.scaffold import GameScaffold
   GameScaffold('rogue', '4D Rogue', optional_modules=['base_board.js', 'pathfinding.js']).create()
   ```

2. Import shared modules from `../4d_generic/` in `index.html`
3. **Check the Module Adoption Matrix** — use extended modules (`base_board`, `entity_system`, `turn_manager`, `pathfinding`) where applicable
4. Implement `<name>_board.js`, `<name>_renderer.js`, `<name>_game.js` in `js/`
5. Add tests in `tests/`
6. Add entry to `GAMES` registry in `games/src/core/registry.py`
7. Run `python3 games/scripts/regenerate_scripts.py` to generate `run_<name>.sh`
8. **Add a row to the portfolio table above**
9. Verify with `python3 games/run_games.py --validate && python3 games/run_games.py --test`

---

*Part of the [QuadCraft](../) project — Exploring 4D tetrahedral geometry through interactive applications.*
