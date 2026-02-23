# 4D Memory — Agent Instructions
## Overview
Flip-and-match card game using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/memory_board.js` | `UmemoryBoard` | `BaseBoard` |
| `js/memory_renderer.js` | `UmemoryRenderer` | `BaseRenderer` |
| `js/memory_game.js` | `UmemoryGame` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game memory
node tests/test_memory.js
```
