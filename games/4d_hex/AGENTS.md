# 4D Hex — Agent Instructions
## Overview
Connection strategy game using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/hex_board.js` | `UhexBoard` | `BaseBoard` |
| `js/hex_renderer.js` | `UhexRenderer` | `BaseRenderer` |
| `js/hex_game.js` | `UhexGame` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game hex
node tests/test_hex.js
```
