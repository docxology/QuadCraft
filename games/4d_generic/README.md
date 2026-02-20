# 4D Generic — Shared Module Library

## Overview

`4d_generic/` is the **shared foundation** for all QuadCraft games. It contains the canonical copies of all shared JavaScript modules. All 22 games import these via `<script src="../4d_generic/...">` tags.

> **Not a playable game** — this is a library directory.

## Quick Start

```bash
# Run shared module tests
node games/4d_generic/tests/test_quadray.js
node games/4d_generic/tests/test_synergetics.js

# Run all shared tests (from games/)
node tests/test_all_shared.js
```

## Modules (17)

| Category | Modules |
|----------|---------|
| **Math** | `quadray.js`, `synergetics.js`, `grid_utils.js` |
| **Rendering** | `camera.js`, `projection.js`, `zoom.js`, `base_renderer.js` |
| **Engine** | `game_loop.js`, `score_manager.js`, `base_game.js`, `entity_system.js`, `turn_manager.js` |
| **Board** | `base_board.js`, `pathfinding.js` |
| **Input** | `input_controller.js` |
| **UI** | `hud.js`, `hud-style.css` |

## Documentation

- **Agent Instructions**: [AGENTS.md](AGENTS.md) — Module inventory and code standards
- **Shared Modules Reference**: [shared_modules_reference.md](../doc/shared_modules_reference.md) — Full API docs
- **Game Index**: [GAMES_INDEX.md](../GAMES_INDEX.md) — Full portfolio of all QuadCraft games
