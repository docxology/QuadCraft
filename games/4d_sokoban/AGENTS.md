# 4D Sokoban — Agent Instructions

## Overview

Box-pushing puzzle on 4D IVM grid. Push boxes onto goals using 12 IVM directions (permutations of 0,1,1,2). Keys 1-9,0,Q,W select direction.

## Architecture

| File | Class | Extends | Purpose |
|------|-------|---------|---------|
| `js/sokoban_board.js` | `SokobanBoard` | `BaseBoard` | Grid state, push logic, win detection |
| `js/sokoban_renderer.js` | `SokobanRenderer` | `BaseRenderer` | 3D-projected rendering |
| `js/sokoban_game.js` | `SokobanGame` | `BaseGame` | Keyboard input, HUD |

## Commands

```bash
python3 ../../run_games.py --game sokoban              # Launch on port 8122
node tests/test_sokoban.js  # Run unit tests
```
