# Games

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`. Cartesian (XYZ) analogies are secondary to this true Synergetics foundation.

Collection of **30 standalone 4D games** built on the QuadCraft Quadray coordinate system. Each game runs directly in the browser — no server, no build step.

> **📋 Full portfolio index (30 games):** See [GAMES_INDEX.md](GAMES_INDEX.md) for the current per-game and total unit-test counts.

## Quick Start

```bash
# Launch a single game
python3 run_games.py --game chess           # Opens 4D Chess on port 8100

# Launch via Python (Recommended - Handles shared imports correctly)
python3 run_games.py --game chess           # One game
python3 run_games.py --game chess doom life # Multiple games
python3 run_games.py --all                  # All 30 games simultaneously
python3 run_games.py --config games_config.json  # From config file

# List all games
python3 run_games.py --list

# Run all unit tests
python3 run_games.py --test

# Run structural validation
python3 run_games.py --validate
```

## Launching Games

All game launching is centralized through `run_games.py` (or the `run.sh` wrapper):

```bash
# Master launcher (shell wrapper)
./games/run.sh --list              # List all games
./games/run.sh chess doom tetris   # Launch specific games
./games/run.sh --all               # Launch all 30 games

# Python launcher (direct)
python3 run_games.py --game chess   # One game
python3 run_games.py --all          # All 30 games
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
- `--all` — launch all 30 games simultaneously
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
