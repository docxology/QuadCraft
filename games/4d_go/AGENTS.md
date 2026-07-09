# 4D Go — Agent Instructions
## Overview
Territory-capturing strategy game using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/go_board.js` | `GoBoard` | `BaseBoard` |
| `js/go_renderer.js` | `GoRenderer` | `BaseRenderer` |
| `js/go_game.js` | `GoGame` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game go
node tests/test_go.js
```
