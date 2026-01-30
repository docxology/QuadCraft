# Browser Application

This directory contains the standalone browser-based QuadCraft implementation.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main game application (QuadrayGrid4/5) |
| `indexOld_quadraygrid4.html` | Previous version backup |
| `lib/` | JavaScript utility libraries |
| `saves/` | JSON save files |
| `pic/` | Development screenshots |

## Quick Start

Open `index.html` directly in a modern browser - no server required for basic functionality.

## Features

### Core Gameplay

- Tetrahedral voxel placement and removal
- 12-direction navigation on quadray grid
- Octahedron and tetrahedron shapes (Z and C types)

### CCP Ball Grid System

- Close-Centered Packing for efficient ball management
- Physics-based ball bouncing
- Multiple paintbrush tools for pattern creation

### Save System

- QuickSave slots (1-5) using localStorage
- File-based JSON export/import
- Cross-session persistence

### Controls

**Navigation:**

- QWERTY (q,w,e,r,t,y): Move backward in 6 directions
- ASDFGH (a,s,d,f,g,h): Move forward in 6 directions

**Camera:**

- Arrow Keys: Pan camera
- Mouse: Left-drag rotate, right-drag pan, scroll zoom

**Shapes:**

- X: Place/remove octahedron
- Z: Place/remove tetrahedron Z
- C: Place/remove tetrahedron C
- Space: Toggle all shapes

## Implementation Notes

This is the primary actively-developed version of QuadCraft. Most new features are implemented here first before being ported to other implementations.

## Related

- `src/js/experiments/browser/` - Modular version with separated concerns
- `docs/development/javascript_implementation.md` - Technical documentation
