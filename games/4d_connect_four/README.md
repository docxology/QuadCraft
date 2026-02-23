# 4D Connect Four

## Overview

4D Connect Four is a gravity-drop 4-in-a-row game built entirely on Quadray/IVM tetrahedral coordinates. Drop pieces into columns in 4D space — discs fall to the lowest open position, and connect four along any IVM direction to win.

## Features

- **Full 4D Gameplay**: Play on a 6×5×3×3 IVM grid with gravity along the A-axis
- **Tetrahedral Geometry**: Cells rendered as diamonds (tetra) or circles (octa) based on IVM parity
- **AI Opponent**: Easy (random), Medium (1-ply), Hard (2-ply minimax) using Quadray distance heuristics
- **Synergetics Integration**: Volume ratios, S3 constant, geometric identity verification on startup
- **Move History**: Real-time display of all moves with Quadray coordinates and cell parity
- **Interactive Camera**: Shift+drag rotation, scroll zoom, depth-sorted 3D rendering
- **70 Automated Tests**: Comprehensive coverage of all Quadray methods and game logic

## Quick Start

```bash
python3 games/run_games.py --game connect_four
```

Or launch directly:

```bash
python3 games/run_games.py --game connect_four
```

## Controls

| Input | Action |
|-------|--------|
| Click | Drop piece |
| N | New game |
| R | Reset |
| P | Pause |
| A | Toggle AI |
| D | Cycle difficulty |
| Shift+drag | Rotate |
| Scroll | Zoom |

## Documentation

- **Agent Instructions**: [AGENTS.md](AGENTS.md) — Architecture, modules, and all Quadray methods used
- **Game Index**: [Index](../GAMES_INDEX.md) — All QuadCraft games

## Verify

```bash
node games/4d_connect_four/tests/test_connect_four.js
# 70 tests covering Quadray storage, cellType parity, IVM directions,
# distance metrics, synergetics constants, geometric identities, AI evaluation
```
