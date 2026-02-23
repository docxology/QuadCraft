# 4D Rogue — Agent Instructions
## Overview
Procedural roguelike dungeon crawl using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/rogue_board.js` | `UrogueBoard` | `BaseBoard` |
| `js/rogue_renderer.js` | `UrogueRenderer` | `BaseRenderer` |
| `js/rogue_game.js` | `UrogueGame` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game rogue
node tests/test_rogue.js
```
