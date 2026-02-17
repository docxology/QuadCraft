# 4D Catan - Agent Instructions

## Project Overview

4D Catan adapts the classic resource gathering and trading game to a 4D tetrahedral lattice. Players build settlements, roads, and cities on IVM vertices, collect resources based on dice rolls, and trade with the bank or other players. **Production-ready** with 10 passing tests.

## Quick Commands

```bash
# Run all tests (10 tests, 100% pass)
node tests/test_catan.js

# Open in browser
open games/4d_catan/index.html

# Start local server (Port 8108)
./games/run_catan.sh
```

## Key Directories

| Directory | Files | Purpose |
|-----------|-------|---------|
| `js/` | 8 modules | Core logic, AI, Cards, Trading, Robber |
| `tests/` | 1 file | Test suite (10 tests) |

## Shared Modules

Imported via `<script>` tags in `index.html` from `../4d_generic/`:
`quadray.js`, `camera.js`, `projection.js`, `zoom.js`, `synergetics.js`

## Module Dependency Order

Load in this order:

```
1. catan_cards.js      # Dev cards & Resource types
2. catan_board.js      # World map (Tiles, Vertices, Edges)
3. catan_robber.js     # Robber mechanics
4. catan_trading.js    # Trade logic
5. catan_ai.js         # Bot logic
6. catan_renderer.js   # 3D Rendering
8. catan_game.js       # Main Controller
```

## File Inventory

### JavaScript Modules (`js/`)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `catan_board.js` | `Board`, `Tile`, `Structure` | Hex-equivalent map in 4D |
| `catan_cards.js` | `DevCard`, `Resource` | Deck management |
| `catan_robber.js` | `Robber` | Blocking tiles on 7 roll |
| `catan_trading.js` | `TradeOffer` | 4:1, 3:1, 2:1 exchanges |
| `catan_ai.js` | `CatanBot` | Decision making for AI players |
| `catan_renderer.js` | `Renderer` | Visualizing resources/structures |
| `catan_game.js` | `Game` | Turn loop, state machine |

### Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `test_catan.js` | 10 | Resource production, building rules, road connectivity, trading |

## Key Mechanics

### Topology

- **Tiles**: 12-neighbor IVM cells (effectively 4D hexes).
- **Settlements**: Placed on Vertices (interstices).
- **Roads**: Placed on Edges (connecting vertices).

### AI

Bots (`CatanBot`) evaluate potential build spots based on resource variety and probability (pips).

## Verification Checklist

- [ ] All tests pass: `node tests/test_catan.js`
- [ ] Browser loads without errors
- [ ] Map generates with diverse resources
- [ ] Build menu works (Road, Settlement, City)
- [ ] Dice roll distributes resources
- [ ] Robber blocks resources
- [ ] Trade menu works
