# Games — Agent Instructions

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`. Cartesian (XYZ) analogies are secondary to this true Synergetics foundation.

## Overview

The `games/` directory contains the QuadCraft game portfolio — **30 standalone 4D games** built on Quadray coordinates. Each game is self-contained with its own `index.html`, JavaScript modules, and tests. Shared math, camera, and projection code lives in `4d_generic/`.

> **📋 Full portfolio index:** [GAMES_INDEX.md](GAMES_INDEX.md)

## Quick Commands

```bash
# Launch all games
python3 run_games.py --all

# Launch specific game(s)
python3 run_games.py --game chess doom

# Run all unit tests (1,782 passing)
python3 run_games.py --test

# Run tests for specific game
python3 run_games.py --test --game doom

# Run structural validation
python3 run_games.py --validate

# List all games with ports
python3 run_games.py --list
```

## Game Registry

| Key | Game | Directory | Tests | Port |
| --- | --- | --- | --- | --- |

| chess | 4D Chess | `4d_chess/` | 91 | 8100 |
| checkers | 4D Checkers | `4d_checkers/` | 11 | 8101 |
| reversi | 4D Reversi | `4d_reversi/` | 34 | 8102 |
| life | 4D Life | `4d_life/` | 43 | 8103 |
| asteroids | 4D Asteroids | `4d_asteroids/` | 67 | 8104 |
| simant | 4D SimAnt | `4d_simant/` | 148 | 8105 |
| backgammon | 4D Backgammon | `4d_backgammon/` | 30 | 8106 |
| minecraft | 4D Minecraft | `4d_minecraft/` | 124 | 8107 |
| catan | 4D Catan | `4d_catan/` | 56 | 8108 |
| tower_defense | 4D Tower Defense | `4d_tower_defense/` | 217 | 8109 |
| doom | 4D Doom | `4d_doom/` | 116 | 8110 |
| mahjong | 4D Mahjong | `4d_mahjong/` | 33 | 8111 |
| tetris | 4D Tetris | `4d_tetris/` | 18 | 8112 |
| snake | 4D Snake | `4d_snake/` | 15 | 8113 |
| pong | 4D Pong | `4d_pong/` | 52 | 8114 |
| breakout | 4D Breakout | `4d_breakout/` | 20 | 8115 |
| pacman | 4D Pac-Man | `4d_pacman/` | 74 | 8116 |
| space_invaders | 4D Space Invaders | `4d_space_invaders/` | 43 | 8117 |
| frogger | 4D Frogger | `4d_frogger/` | 27 | 8118 |
| bomberman | 4D Bomberman | `4d_bomberman/` | 22 | 8119 |
| connect_four | 4D Connect Four | `4d_connect_four/` | 124 | 8120 |
| minesweeper | 4D Minesweeper | `4d_minesweeper/` | 23 | 8121 |
| sokoban | 4D Sokoban | `4d_sokoban/` | 34 | 8122 |
| 2048 | 4D 2048 | `4d_2048/` | 28 | 8123 |
| rogue | 4D Rogue | `4d_rogue/` | 120 | 8124 |
| go | 4D Go | `4d_go/` | 31 | 8125 |
| hex | 4D Hex | `4d_hex/` | 29 | 8126 |
| memory | 4D Memory | `4d_memory/` | 27 | 8127 |
| sudoku | 4D Sudoku | `4d_sudoku/` | 31 | 8128 |
| lights_out | 4D Lights Out | `4d_lights_out/` | 45 | 8129 |

## Launch System

**CRITICAL:** Games rely on shared modules via `../4d_generic/`. This works fine when opening `index.html` as a file, but for HTTP serving, the server **must serve the parent `games/` directory** as root.

Do not try to serve `games/4d_chess/` directly. Use the Python launcher:

```bash
# Correct way to launch (serves 'games/' root)
python3 run_games.py --game chess
```

## Architecture

```text
games/
├── run_games.py            # Master launcher (serves this root directory)
├── src/                    # Python infrastructure
├── 4d_generic/             # Shared JS modules (served at /4d_generic/)
│   ├── quadray.js          # Core math
│   ├── camera.js           # Camera controller
│   ├── base_board.js       # BaseBoard (grid, distances, integrity)
│   ├── entity_system.js    # QuadrayEntity + EntityManager
│   ├── turn_manager.js     # TurnManager (rotation, undo/redo)
│   ├── pathfinding.js      # QuadrayPathfinder (BFS, A*, flood)
│   └── ...
└── 4d_<game>/              # Standalone game (served at /4d_<game>/)
    ├── index.html          # Imports ../4d_generic/
    ├── AGENTS.md           # Game-specific instructions
    ├── js/                 # Game-specific logic
    └── tests/              # Unit tests
```

### Standard Game Template

When creating a new game, use this `index.html` structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>4D [Game Name] — QuadCraft</title>
    <style>
        body { margin: 0; overflow: hidden; background: #0f172a; color: #fff; font-family: sans-serif; }
        canvas { display: block; }
        .hud { position: absolute; top: 10px; left: 10px; pointer-events: none; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <div class="hud" id="hud">Score: 0</div>

    <!-- Shared Modules (Order matters!) -->
    <script src="../4d_generic/quadray.js"></script>
    <script src="../4d_generic/camera.js"></script>
    <script src="../4d_generic/projection.js"></script>
    <script src="../4d_generic/zoom.js"></script>
    <script src="../4d_generic/synergetics.js"></script>
    <script src="../4d_generic/grid_utils.js"></script>
    <script src="../4d_generic/game_loop.js"></script>
    <script src="../4d_generic/input_controller.js"></script>

    <!-- Optional: Game-Pattern Modules -->
    <!-- <script src="../4d_generic/base_board.js"></script> -->
    <!-- <script src="../4d_generic/entity_system.js"></script> -->
    <!-- <script src="../4d_generic/turn_manager.js"></script> -->
    <!-- <script src="../4d_generic/pathfinding.js"></script> -->

    <!-- Game Logic -->
    <script src="js/board.js"></script>
    <script src="js/renderer.js"></script>
    <script src="js/game.js"></script>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const game = new Game(canvas); // Your main class
    </script>
</body>
</html>
```

## Adding a New Game

1. Create `games/4d_<name>/`
2. Implement standard structure (`js/`, `tests/`, `index.html`)
3. Add to `games/src/core/registry.py` (GAMES dict)
4. Run `python3 games/scripts/regenerate_scripts.py`
5. **Add to [GAMES_INDEX.md](GAMES_INDEX.md)**

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `404 Not Found` for `../4d_generic/` | Server root is too deep | Use `run_games.py` which serves the parent, or check URL is `/4d_<game>/` |
| `Uncaught ReferenceError: Quadray is not defined` | Script load order | Ensure `quadray.js` is loaded BEFORE your game scripts |
| `Class extends value undefined` | Circular dependency or missing import | Check generic module imports in HTML |
| Canvas is black | Renderer/Camera issue | Check console errors; verify `projectQuadray` calls |

## Verification

Before marking a game as ✅ Complete:

- [ ] All tests pass via `python3 run_games.py --test --game <name>`
- [ ] Validation passes via `python3 run_games.py --validate`
- [ ] Browser loads with no console errors
- [ ] Interaction works (select, move, click)
- [ ] Row added to [GAMES_INDEX.md](GAMES_INDEX.md)
