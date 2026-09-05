# 4D 2048 — Agent Instructions
## Overview
Tile-merging puzzle using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/2048_board.js` | `Twenty48Board` | `BaseBoard` |
| `js/2048_renderer.js` | `Twenty48Renderer` | `BaseRenderer` |
| `js/2048_game.js` | `Twenty48Game` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game 2048
node tests/test_2048.js
```
