# Game Design Documentation

Gameplay mechanics, world generation, block system, and controls documentation for QuadCraft.

## Contents

| Document | Description |
| --- | --- |
| [gameplay_overview.md](gameplay_overview.md) | Core gameplay mechanics, modes, and player experience |
| [world_generation.md](world_generation.md) | Procedural terrain, biomes, and structure generation |
| [block_system.md](block_system.md) | Tetrahedral block types, placement, and material properties |
| [controls_and_navigation.md](controls_and_navigation.md) | Keyboard/mouse controls, camera movement |
| [advanced_building_techniques.md](advanced_building_techniques.md) | Structural principles, patterns, and building tips |

## Design in Practice: The 30 Games

These design principles come to life in the 30 standalone browser games under `games/` (see [`games/GAMES_INDEX.md`](../../games/GAMES_INDEX.md) for the live count and per-game breakdown). Each applies tetrahedral geometry differently:

| Design Concept | Exemplified By |
| -------------- | -------------- |
| Block placement/removal | ⛏️ 4D Minecraft |
| Tetrahedral movement | 🚀 4D Asteroids, 🐜 4D SimAnt |
| Turn-based strategy in 4D | ♟️ 4D Chess, 🏁 4D Checkers, ⚫ 4D Reversi |
| Resource economy | 🏝️ 4D Catan, 🏰 4D Tower Defense |
| FPS combat mechanics | 👹 4D Doom |
| Cellular automata | 🧬 4D Life |
| Pattern matching | 🀄 4D Mahjong |
| Dice-driven movement | 🎲 4D Backgammon |

See [Games Overview](../games.md) for the full portfolio, launch instructions, and architecture.

## Quick Reference

### Core Controls

Controls vary per game (see each game's `Input`/`Camera` columns in
[`games/GAMES_INDEX.md`](../../games/GAMES_INDEX.md)), but most share the
`4d_generic/` `CameraController` and `zoom.js` modules:

| Input | Action | Source |
| --- | ------ | ------ |
| Click | Primary action (place block, select piece, etc. — per game) | e.g. `games/4d_minecraft/js/minecraft_game.js` `_bindMouse()` |
| Alt+Click | Secondary action (e.g. remove block) | `games/4d_minecraft/js/minecraft_game.js` `_bindMouse()` |
| Shift+drag (or right-click drag) | Rotate camera (`shift-drag` mode — most games) | `games/4d_generic/camera.js` |
| Left-click drag | Rotate camera (`left-drag` mode — chess/checkers-pattern games) | `games/4d_generic/camera.js` |
| Scroll wheel | Zoom | `games/4d_generic/zoom.js` |
| 1-8/1-9 | Select item/block type (board- and building-games) | e.g. `games/4d_minecraft/` |
| Keyboard (WASD/arrows) | Movement (arcade titles: Asteroids, Snake, Pac-Man, Doom, etc.) | see `Input` column in `GAMES_INDEX.md` |

There is no universal debug-overlay or menu key (F1/F2/Esc) across `games/`
— no F-key bindings exist in any game's JS.

### Block Cell Types

QuadCraft's IVM grid distinguishes cells by coordinate-sum parity, not by a
four-orientation lookup table:

| Cell type | Rule | Source |
| ---- | ----- | ---------- |
| `tetra` | `(a+b+c+d) % 2 === 0` | `games/4d_generic/quadray.js` `Quadray.cellType()` |
| `octa` | `(a+b+c+d) % 2 !== 0` | `games/4d_generic/quadray.js` `Quadray.cellType()` |

## Cross-References

- [Architecture](../architecture.md) — system design overview
- [Mathematics](../mathematics/README.md) — coordinate system and geometry
- [Games Portfolio](../games.md) — live implementations of these designs
