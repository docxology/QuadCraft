# Thirty-game browser portfolio and launch ports

The authoritative inventory is [`src/core/registry.py`](src/core/registry.py). These are separate browser applications with selected shared dependencies, not independently copyable single folders or one native-engine runtime. Keep `4d_generic/` alongside them.

## Note on 4D Geometry & Nomenclature

“4D” is the game naming convention. Four quadray coefficients represent three spatial dimensions modulo a common offset. Some game boards deliberately retain distinct raw four-index slots even when they project to the same physical point. The [canonical portfolio contracts](../docs/games.md) specify gauge, units, adjacency, time and RNG distinctions; this index does not redefine them.

## Registered games

Ports below use base 8100; any chosen base is added to the same registry offset. No test totals or completeness percentages are inferred from registration.

| Key | Game and source directory | Offset | Default port |
|---|---|---:|---:|
| `chess` | [4D Chess](4d_chess/) | 0 | 8100 |
| `checkers` | [4D Checkers](4d_checkers/) | 1 | 8101 |
| `reversi` | [4D Reversi](4d_reversi/) | 2 | 8102 |
| `life` | [4D Life](4d_life/) | 3 | 8103 |
| `asteroids` | [4D Asteroids](4d_asteroids/) | 4 | 8104 |
| `simant` | [4D SimAnt](4d_simant/) | 5 | 8105 |
| `backgammon` | [4D Backgammon](4d_backgammon/) | 6 | 8106 |
| `minecraft` | [4D Minecraft](4d_minecraft/) | 7 | 8107 |
| `catan` | [4D Catan](4d_catan/) | 8 | 8108 |
| `tower_defense` | [4D Tower Defense](4d_tower_defense/) | 9 | 8109 |
| `doom` | [4D Doom](4d_doom/) | 10 | 8110 |
| `mahjong` | [4D Mahjong](4d_mahjong/) | 11 | 8111 |
| `tetris` | [4D Tetris](4d_tetris/) | 12 | 8112 |
| `snake` | [4D Snake](4d_snake/) | 13 | 8113 |
| `pong` | [4D Pong](4d_pong/) | 14 | 8114 |
| `breakout` | [4D Breakout](4d_breakout/) | 15 | 8115 |
| `pacman` | [4D Pac-Man](4d_pacman/) | 16 | 8116 |
| `space_invaders` | [4D Space Invaders](4d_space_invaders/) | 17 | 8117 |
| `frogger` | [4D Frogger](4d_frogger/) | 18 | 8118 |
| `bomberman` | [4D Bomberman](4d_bomberman/) | 19 | 8119 |
| `connect_four` | [4D Connect Four](4d_connect_four/) | 20 | 8120 |
| `minesweeper` | [4D Minesweeper](4d_minesweeper/) | 21 | 8121 |
| `sokoban` | [4D Sokoban](4d_sokoban/) | 22 | 8122 |
| `2048` | [4D 2048](4d_2048/) | 23 | 8123 |
| `rogue` | [4D Rogue](4d_rogue/) | 24 | 8124 |
| `go` | [4D Go](4d_go/) | 25 | 8125 |
| `hex` | [4D Hex](4d_hex/) | 26 | 8126 |
| `memory` | [4D Memory](4d_memory/) | 27 | 8127 |
| `sudoku` | [4D Sudoku](4d_sudoku/) | 28 | 8128 |
| `lights_out` | [4D Lights Out](4d_lights_out/) | 29 | 8129 |

## Launch System

Run from the QuadCraft repository root:

```sh
python3.13 games/run_games.py --list
python3.13 games/run_games.py --game chess doom
python3.13 games/run_games.py --all --no-browser
```

The server document root is `games/`, with game URLs `/4d_<key>/index.html`. The Python CLI needs an explicit selection to launch; the shell wrapper with no arguments selects all games. [Launch operations](doc/launch_operations.md) and [configuration](doc/configuration.md) explain flags and JSON precedence.

## Shared Foundation

[`4d_generic/`](4d_generic/) contains coordinate/grid helpers, projection/camera/zoom, lifecycle/input/HUD/scoring, optional board/entity/turn/pathfinding helpers and a separate graph-field kernel. Tooling's core/optional lists are not the complete disk inventory. A script reference does not prove runtime adoption. Doom uses its own ES-module controller with a shared geometry bridge. See [actual shared APIs](doc/shared_modules_reference.md) before reusing a symbol.

## Verification and contribution

The [test guide](doc/testing_guide.md) distinguishes structural file checks, recursive shared and per-game logic suites, and the independent [real Chromium gate](tests/browser/README.md). The browser harness has a scenario for each registered game, with screenshots/state/input evidence, not exhaustive rule coverage or a guarantee that every platform supports pointer lock.

[Documentation hub](doc/README.md) · [Architecture](doc/architecture.md) · [Python infrastructure](doc/python_infrastructure.md) · [Contributing a game](doc/contributing.md) · [Repository overview](../README.md)
