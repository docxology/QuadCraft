# 4D Minecraft - Agent Instructions

## Project Overview

4D Minecraft allows players to place and remove tetrahedral blocks in a procedurally generated IVM (Isotropic Vector Matrix) world. It features a hotbar, multiple block types, and a first-person fly camera logic adapted for tetrahedral space. **Production-ready** with 11 passing tests.

## Quick Commands

```bash
# Run all tests (11 tests, 100% pass)
cd tests && node test_minecraft.js

# Start local server (Port 8107)
./games/run_minecraft.sh

# Open directly in browser
open games/4d_minecraft/index.html
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 3 modules | Core logic (Quadray, Board, Renderer, Game) |
| `tests/` | 1 file | Test suite (74 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order to avoid reference errors:

```
1. minecraft_board.js    # World state, chunks, block storage
2. minecraft_renderer.js # Canvas 3D rendering
3. minecraft_game.js     # Controller, UI, Input handling
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports |
|------|-------------|
| `minecraft_board.js` | `Board` class, `Chunk` management, `BLOCK_TYPES` |
| `minecraft_renderer.js` | `Renderer` class, `drawTestChunk`, `projectPoint` |
| `minecraft_game.js` | `Game` class, input event listeners |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_minecraft.js` | 74 | Block placement, removal, coordinate conversion, chunk boundaries |

## Code Standards

- **Language**: ES6+ JavaScript
- **Comments**: JSDoc for public methods
- **Indentation**: 4 spaces
- **Coordinates**: Always use `Quadray` instances for world positions, `(x,y,z)` for rendering only.

## Key Classes & Data Structures

| Class/Obj | Source | Purpose |
|-----------|--------|---------|
| `Board` | minecraft_board.js | Manages sparse map of blocks: `Map<string, blockId>` |
| `Renderer` | minecraft_renderer.js | Handles canvas drawing context, camera projection |
| `Game` | minecraft_game.js | Main loop, manages `Board` and `Renderer` instances |
| `BLOCK_TYPES`| minecraft_board.js | Enum of block IDs (1=Grass, 2=Dirt, etc.) |

## Verification Checklist

- [ ] Tests pass: `node tests/test_minecraft.js`
- [ ] Game loads without error
- [ ] Movement (WASD) and Look (Mouse) work
- [ ] Block placement (Right Click) and removal (Left Click) work
- [ ] Block selection (1-9) updates hotbar UI
