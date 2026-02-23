# 4D Sudoku — Agent Instructions
## Overview
Constraint-satisfaction logic puzzle using IVM 12-neighbor topology (permutations of 0,1,1,2 in Quadray coordinates).
## Architecture
| File | Class | Extends |
|------|-------|---------|
| `js/sudoku_board.js` | `UsudokuBoard` | `BaseBoard` |
| `js/sudoku_renderer.js` | `UsudokuRenderer` | `BaseRenderer` |
| `js/sudoku_game.js` | `UsudokuGame` | `BaseGame` |
## Commands
```bash
python3 ../../run_games.py --game sudoku
node tests/test_sudoku.js
```
