# 4D 2048 — Agent Instructions
## Overview
Tile-merging puzzle using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/2048_board.js` | `U2048Board` | `BaseBoard` |
| `js/2048_renderer.js` | `U2048Renderer` | `BaseRenderer` |
| `js/2048_game.js` | `U2048Game` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game 2048
node tests/test_2048.js
```
