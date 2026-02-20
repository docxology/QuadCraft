# Games

Collection of **22 standalone 4D games** built on the QuadCraft Quadray coordinate system. Each game runs directly in the browser — no server, no build step.

> **📋 Full portfolio with status and metadata:** See [GAMES_INDEX.md](GAMES_INDEX.md)

## All Games

### Wave 1: Strategy & Board Games

| Game | Description | Tests | Status |
|------|-------------|-------|--------|
| ♟️ [4D Chess](4d_chess/) | Full chess with 6 piece types in 4D Quadray space | 91 | ✅ |
| 🏁 [4D Checkers](4d_checkers/) | Diagonal capture + King promotion in 4D | 11 | ✅ |
| ⚫ [4D Reversi](4d_reversi/) | Disc flipping across 80 directions in 4D | 11 | ✅ |
| 🧬 [4D Life](4d_life/) | Conway's Game of Life with 4D wrapping neighbors | 8 | ✅ |
| 🚀 [4D Asteroids](4d_asteroids/) | Continuous motion, wrap-around, asteroid splitting | 12 | ✅ |
| 🐜 [4D SimAnt](4d_simant/) | Pheromone trails, foraging AI, colony simulation | 10 | ✅ |
| 🎲 [4D Backgammon](4d_backgammon/) | 24-point track in 4D spiral, dice + bearing-off | 8 | ✅ |
| ⛏️ [4D Minecraft](4d_minecraft/) | Terrain gen, trees, block place/remove, inventory | 74 | ✅ |
| 🏝️ [4D Catan](4d_catan/) | 19 hex tiles, resource production, settlements | 10 | ✅ |
| 🏰 [4D Tower Defense](4d_tower_defense/) | Path waves, auto-targeting towers, gold economy | 98 | ✅ |
| 👹 [4D Doom](4d_doom/) | Hitscan FPS, enemy AI pursuit, wall collision | 116 | ✅ |
| 🀄 [4D Mahjong](4d_mahjong/) | 144-tile 4-layer matching with hint system | 7 | ✅ |

### Wave 2: Classic Arcade & Puzzle Games

| Game | Description | Tests | Status |
|------|-------------|-------|--------|
| 🧱 [4D Tetris](4d_tetris/) | Falling tetrominoes on 4D IVM grid | 18 | ✅ |
| 🐍 [4D Snake](4d_snake/) | Growing snake, food collection in 4D | 15 | ✅ |
| 🏓 [4D Pong](4d_pong/) | Paddle-ball in tetrahedral space | 19 | ✅ |
| 🧨 [4D Breakout](4d_breakout/) | Brick-breaking with Quadray physics | 20 | ✅ |
| 👾 [4D Pac-Man](4d_pacman/) | Maze navigation, ghost AI in 4D | 19 | ✅ |
| 👽 [4D Space Invaders](4d_space_invaders/) | Wave-based shooting, formations in 4D | 22 | ✅ |
| 🐸 [4D Frogger](4d_frogger/) | Lane-crossing, obstacle avoidance in 4D | 23 | ✅ |
| 💣 [4D Bomberman](4d_bomberman/) | Grid bombs, destructible walls in 4D | 22 | ✅ |
| 🔴 [4D Connect Four](4d_connect_four/) | Gravity-drop 4-in-a-row in 4D | 70 | ✅ |
| 💥 [4D Minesweeper](4d_minesweeper/) | Mine-counting with IVM neighbors | 23 | ✅ |

**Total: 22 games, 1,060 unit tests, all passing.**

## Quick Start

```bash
# Launch a single game
./games/4d_chess/run.sh                   # Opens 4D Chess on port 8100

# Launch via Python (Recommended - Handles shared imports correctly)
python3 run_games.py --game chess           # One game
python3 run_games.py --game chess doom life # Multiple games
python3 run_games.py --all                  # All 22 games simultaneously
python3 run_games.py --config games_config.json  # From config file

# List all games
python3 run_games.py --list

# Run all unit tests
python3 run_games.py --test

# Run structural validation
python3 run_games.py --validate
```

## Run Scripts

Each game has a standalone `run.sh` inside its directory:

| Game | Script path | Port |
|------|-------------|------|
| 4D Chess | `4d_chess/run.sh` | 8100 |
| 4D Checkers | `4d_checkers/run.sh` | 8101 |
| ... | ... | ... |
| 4D Minesweeper | `4d_minesweeper/run.sh` | 8121 |

**Master Launcher:**

```bash
./games/run.sh --list              # List all games
./games/run.sh chess doom tetris   # Launch specific games
./games/run.sh --all               # Launch all 22 games
```

## Python Launcher (`run_games.py`)

| File | Description |
|---|---|
| `run_games.py` | Main entrypoint for launching one, multiple, or all games. Supports custom ports. |
| `src/core/registry.py` | Central `GAMES` dictionary configuring metadata and unique offsets. |
| `src/core/config.py` | Shared file, folder, and logic constants across python. |
| `src/qa/testing.py` | Universal test harness traversing directories and detecting JS/PY tests. |
| `src/server/launcher.py` | Spawns individual threaded servers per game. |

The master launcher supports:

- `--game NAME [NAME ...]` — launch one or more games
- `--all` — launch all 22 games simultaneously
- `--list` — show all games with ports
- `--test` — run unit tests (optionally with `--game` to filter)
- `--validate` — run structural validation on all game directories
- `--base-port N` — set starting port (default: 8100)
- `--no-browser` — start servers without opening browser
- `--config FILE` — load game selection from JSON

**Config file format** (`games_config.json`):

```json
{
    "games": ["chess", "reversi", "doom"],
    "base_port": 8100,
    "open_browser": true
}
```

## Architecture

### Directory Structure

```text
games/
├── run_games.py            # Main CLI Launcher (--game, --all, --test, --validate)│
├── src/                    # Core Python modules
│   ├── __init__.py         # Consolidated export API
│   ├── core/               # Configuration and Registration
│   │   ├── config.py       # Shared constants, required files lists
│   │   └── registry.py     # Game definitions mapping
│   ├── server/             # Game Server
│   │   └── launcher.py     # HTTP Server
│   ├── qa/                 # Quality Assurance
│   │   ├── validation.py   # Structural validation rules
│   │   └── testing.py      # Test runner
│   ├── scaffold/           # Auto-generates new games
│   ├── analytics/          # Health/Status analytics
│   ├── shared/             # JS module metadata
│   ├── board/              # Board logic utilities
│   └── space/              # Pure Quadray / Synergetics modelinge Tests
├── scripts/                # Maintenance Scripts
│   ├── _run_template.sh    # Shell script template
│   ├── generate_test_html.py
│   ├── regenerate_scripts.py
│   └── ensure_agents_md.py
├── tests/                  # Shared Module Tests
│   ├── test_projection.js  # projectQuadray(), drawQuadrayAxes()
│   ├── test_camera.js      # CameraController
│   ├── test_zoom.js        # setupZoom()
│   ├── test_base_board.js  # BaseBoard
│   ├── test_entity_system.js # QuadrayEntity, EntityManager
│   ├── test_turn_manager.js  # TurnManager
│   ├── test_pathfinding.js   # QuadrayPathfinder
│   └── test_all_shared.js  # Integration runner
├── 4d_generic/             # Shared JS Modules
│   ├── quadray.js          # Quadray class (single source of truth)
│   ├── camera.js           # CameraController
│   ├── projection.js       # projectQuadray() + drawQuadrayAxes()
│   ├── zoom.js             # setupZoom()
│   ├── synergetics.js      # Synergetics constants
│   ├── base_board.js       # BaseBoard (grid, distances, integrity)
│   ├── entity_system.js    # QuadrayEntity + EntityManager
│   ├── turn_manager.js     # TurnManager (rotation, undo/redo)
│   └── pathfinding.js      # QuadrayPathfinder (BFS, A*, flood)
└── 4d_<game>/              # Standalone Game
    ├── index.html          # Imports shared modules from ../4d_generic/
    ├── js/                 # Game-specific logic
    └── tests/              # Game-specific tests
```

See [GAMES_INDEX.md](GAMES_INDEX.md) for the full standalone architecture specification.

## Technical Documentation

Core math and design docs live in [`docs/`](../docs/):

- [Quadray Coordinates](../docs/mathematics/quadray_coordinates.md) — 4D coordinate system
- [Tetrahedral Geometry](../docs/mathematics/tetrahedral_geometry.md) — Geometric foundations
- [Game Design](../docs/game_design/) — Gameplay, controls, world generation
- [Architecture](../docs/architecture.md) — System design

---

*Part of the [QuadCraft](../) project — Exploring 4D tetrahedral geometry through interactive applications.*
