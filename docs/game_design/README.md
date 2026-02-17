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

## Design in Practice: The 12 Games

These design principles come to life in the 12 standalone browser games. Each applies tetrahedral geometry differently:

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

| Key | Action |
| --- | ------ |
| WASD | Movement |
| Mouse | Look around |
| Left Click | Remove block |
| Right Click | Place block |
| 1-9 | Select block type |
| F1 | Toggle debug info |
| F2 | Toggle quadray grid |
| Esc | Menu |

### Block Types

| Type | Shape | Properties |
| ---- | ----- | ---------- |
| Type Z | Upward tetrahedron | Standard orientation |
| Type C | Downward tetrahedron | Inverted orientation |

## Cross-References

- [Architecture](../architecture.md) — system design overview
- [Mathematics](../mathematics/README.md) — coordinate system and geometry
- [Games Portfolio](../games.md) — live implementations of these designs
