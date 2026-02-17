# 🎮 QuadCraft Games Portfolio — GAMES_INDEX.md

> **Canonical index** of all 4D games built on the Quadray tetrahedral coordinate system.
> Each game is a **standalone browser application** — self-contained for easy porting, forking, and independent versioning.

---

### Wave 1: Strategy & Board Games

| # | Game | Directory | Status | Tests | Key Mechanic |
| --- | ------ | --------- | ------ | ----- | -------------- |
| 1 | ♟️ **4D Chess** | [`4d_chess/`](4d_chess/) | ✅ Complete | 91 | Turn-based strategy, check/checkmate |
| 2 | 🏁 **4D Checkers** | [`4d_checkers/`](4d_checkers/) | ✅ Complete | 11 | Diagonal capture + promotion |
| 3 | ⚫ **4D Reversi** | [`4d_reversi/`](4d_reversi/) | ✅ Complete | 11 | Disc flipping across 80 directions |
| 4 | 🧬 **4D Life** | [`4d_life/`](4d_life/) | ✅ Complete | 8 | Cellular automata with 4D wrapping |
| 5 | 🚀 **4D Asteroids** | [`4d_asteroids/`](4d_asteroids/) | ✅ Complete | 12 | Continuous motion + wrap-around |
| 6 | 🐜 **4D SimAnt** | [`4d_simant/`](4d_simant/) | ✅ Complete | 10 | Pheromone trails, foraging AI |
| 7 | 🎲 **4D Backgammon** | [`4d_backgammon/`](4d_backgammon/) | ✅ Complete | 8 | 24-point 4D spiral track + dice |
| 8 | ⛏️ **4D Minecraft** | [`4d_minecraft/`](4d_minecraft/) | ✅ Complete | 74 | Terrain gen, trees, block inventory |
| 9 | 🏝️ **4D Catan** | [`4d_catan/`](4d_catan/) | ✅ Complete | 10 | 19 tiles, resources, settlements |
| 10 | 🏰 **4D Tower Defense** | [`4d_tower_defense/`](4d_tower_defense/) | ✅ Complete | 98 | Waves, auto-targeting towers, gold |
| 11 | 👹 **4D Doom** | [`4d_doom/`](4d_doom/) | ✅ Complete | 116 | Hitscan FPS, enemy AI pursuit |
| 12 | 🀄 **4D Mahjong** | [`4d_mahjong/`](4d_mahjong/) | ✅ Complete | 7 | 144-tile 4-layer matching |

### Wave 2: Classic Arcade & Puzzle Games

| # | Game | Directory | Status | Tests | Key Mechanic |
| --- | ------ | --------- | ------ | ----- | -------------- |
| 13 | 🧱 **4D Tetris** | [`4d_tetris/`](4d_tetris/) | ✅ Complete | 18 | Falling tetrominoes on IVM grid |
| 14 | 🐍 **4D Snake** | [`4d_snake/`](4d_snake/) | ✅ Complete | 15 | Growing snake, food collection |
| 15 | 🏓 **4D Pong** | [`4d_pong/`](4d_pong/) | ✅ Complete | 19 | Paddle-ball in tetrahedral space |
| 16 | 🧨 **4D Breakout** | [`4d_breakout/`](4d_breakout/) | ✅ Complete | 20 | Brick-breaking with Quadray physics |
| 17 | 👾 **4D Pac-Man** | [`4d_pacman/`](4d_pacman/) | ✅ Complete | 19 | Maze navigation, ghost AI |
| 18 | 👽 **4D Space Invaders** | [`4d_space_invaders/`](4d_space_invaders/) | ✅ Complete | 22 | Wave-based shooting, formations |
| 19 | 🐸 **4D Frogger** | [`4d_frogger/`](4d_frogger/) | ✅ Complete | 23 | Lane-crossing, obstacle avoidance |
| 20 | 💣 **4D Bomberman** | [`4d_bomberman/`](4d_bomberman/) | ✅ Complete | 22 | Grid bombs, destructible walls |
| 21 | 🔴 **4D Connect Four** | [`4d_connect_four/`](4d_connect_four/) | ✅ Complete | 70 | Gravity-drop 4-in-a-row detection |
| 22 | 💥 **4D Minesweeper** | [`4d_minesweeper/`](4d_minesweeper/) | ✅ Complete | 23 | Mine-counting with IVM neighbors |

**Total: 22 games, 707 unit tests, all passing ✅**

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

| Module | Contents |
| ------ | -------- |
| `quadray.js` | Quadray class (single source of truth) |
| `camera.js` | CameraController (drag-to-rotate) |
| `projection.js` | projectQuadray() + drawQuadrayAxes() |
| `zoom.js` | setupZoom() (mouse-wheel zoom) |
| `synergetics.js` | Synergetics constants + verification |
| `base_game.js` | BaseGame lifecycle (init, start, pause, reset) |
| `base_renderer.js` | BaseRenderer (canvas, projection, axes) |
| `game_loop.js` | GameLoop (rAF with delta tracking) |
| `grid_utils.js` | GridUtils (IVM neighbors, distance, sorting) |
| `hud.js` | HUD rendering (status, controls, geometry) |
| `input_controller.js` | InputController (keyboard/mouse events) |
| `score_manager.js` | ScoreManager (win/loss/score tracking) |
| `hud-style.css` | Shared CSS for HUD panels and overlays |

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

1. Create `games/4d_<name>/` following the standalone structure
2. Import shared modules from `../4d_generic/` in `index.html`
3. Implement `<name>_board.js`, `<name>_renderer.js`, `<name>_game.js` in `js/`
4. Add tests in `tests/`
5. Add entry to `GAMES` registry in `games/src/registry.py`
6. Run `python3 games/scripts/regenerate_scripts.py` to generate `run_<name>.sh`
7. **Add a row to the portfolio table above**

---

*Part of the [QuadCraft](../) project — Exploring 4D tetrahedral geometry through interactive applications.*
