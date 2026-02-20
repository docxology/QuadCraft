# Game Template — Standard Directory Structure

> Canonical structure, naming conventions, and required patterns for every QuadCraft game.

---

## Standard Layout

```text
games/4d_<game>/
├── index.html                    # Entry point — imports shared + game modules
├── AGENTS.md                     # Game-specific agent instructions
├── run.sh                        # Standalone launch script
├── js/
│   ├── <game>_board.js           # Board / world state logic
│   ├── <game>_renderer.js        # Canvas rendering
│   └── <game>_game.js            # Controller + UI (extends BaseGame)
└── tests/
    └── test_<game>.js            # Node.js unit tests
```

### Optional (Mature Games)

```text
├── README.md                     # Player-facing documentation
├── CONTRIBUTING.md               # Contributor guide
├── docs/                         # Extended game-specific documentation
└── js/
    ├── <game>_ai.js              # AI / bot logic
    ├── <game>_physics.js         # Physics engine
    └── <game>_entities.js        # Entity definitions
```

> **Example:** `4d_chess/` has 9 JS files, `4d_doom/` has 11 JS files, while Wave 2 games typically have 3.

---

## Required Files

Enforced by `qa/validation.py` and `REQUIRED_FILES` in `core/config.py`:

| File | Purpose | Validation |
|------|---------|------------|
| `index.html` | Browser entry point | Must exist |
| `js/` directory | Game-specific JavaScript | Must exist |
| `tests/` directory | Unit tests | Must contain `test_*.js` |
| `AGENTS.md` | AI agent instructions | Must exist |
| `run.sh` | Standalone launcher | Required by config |

---

## `index.html` Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>4D <Game> — QuadCraft</title>
    <link rel="stylesheet" href="../4d_generic/hud-style.css">
    <style>
        body { margin: 0; overflow: hidden; background: #0f172a; color: #fff; }
        canvas { display: block; }
        .hud { position: absolute; top: 10px; left: 10px; pointer-events: none; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <div class="hud" id="hud">Score: 0</div>

    <!-- Shared Modules (ORDER MATTERS) -->
    <script src="../4d_generic/quadray.js"></script>
    <script src="../4d_generic/camera.js"></script>
    <script src="../4d_generic/projection.js"></script>
    <script src="../4d_generic/zoom.js"></script>
    <script src="../4d_generic/synergetics.js"></script>
    <script src="../4d_generic/grid_utils.js"></script>
    <script src="../4d_generic/game_loop.js"></script>
    <script src="../4d_generic/input_controller.js"></script>
    <script src="../4d_generic/score_manager.js"></script>
    <script src="../4d_generic/hud.js"></script>
    <script src="../4d_generic/base_renderer.js"></script>
    <script src="../4d_generic/base_game.js"></script>

    <!-- Game-Specific Modules -->
    <script src="js/<game>_board.js"></script>
    <script src="js/<game>_renderer.js"></script>
    <script src="js/<game>_game.js"></script>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const game = new <Game>Game(canvas);
    </script>
</body>
</html>
```

> **Critical:** All shared imports use `../4d_generic/` relative paths. The HTTP server **must** serve the parent `games/` directory as root.

---

## JS File Naming Convention

From `REQUIRED_JS_PATTERNS` in `core/config.py`:

| Role | Pattern | Class Name | Responsibility |
|------|---------|------------|----------------|
| Board | `{game}_board.js` | `{Game}Board` | State management: grid, pieces, world |
| Renderer | `{game}_renderer.js` | `{Game}Renderer` | Canvas drawing, extends `BaseRenderer` |
| Game | `{game}_game.js` | `{Game}Game` | Controller lifecycle, extends `BaseGame` |

**Examples:**

| Game Key | Board | Renderer | Game |
|----------|-------|----------|------|
| `snake` | `snake_board.js` → `SnakeBoard` | `snake_renderer.js` → `SnakeRenderer` | `snake_game.js` → `SnakeGame` |
| `tower_defense` | `tower_defense_board.js` → `TowerDefenseBoard` | `tower_defense_renderer.js` → `TowerDefenseRenderer` | `tower_defense_game.js` → `TowerDefenseGame` |

---

## Validation Rules

`qa/validation.py` enforces these rules for each game:

| Rule | Severity | Detail |
|------|----------|--------|
| No local `quadray.js` copy | Error | Must use `../4d_generic/quadray.js` |
| Shared module imports | Error | `index.html` must reference `quadray.js`, `camera.js`, `projection.js`, `zoom.js` |
| Board file ≥200 bytes | Error | Prevents scaffold stubs passing validation |
| No `[scaffold]` markers | Error | Renderer and game files must be implemented |
| No `TODO: Implement` stubs | Error | Scaffold TODOs must be replaced |

---

## ES-Module Exception

**4D Doom** uses `import/export` syntax instead of `<script>` tags:

```javascript
// Doom uses ES modules — EXEMPT from shared-import validation
import { DoomMap } from './doom_map.js';
```

Games in `ES_MODULE_GAMES = {"doom"}` are exempt from checks 3–4 in validation.

---

## Port Assignment

Each game gets a unique port via `base_port + port_offset`:

| Offset | Game | Default Port |
|--------|------|-------------|
| 0 | Chess | 8100 |
| 1 | Checkers | 8101 |
| ... | ... | ... |
| 21 | Minesweeper | 8121 |

> Define `port_offset` when adding to `core/registry.py`. See [configuration.md](configuration.md) for port details.

---

*See also: [scaffold_guide.md](scaffold_guide.md) · [shared_modules_reference.md](shared_modules_reference.md) · [contributing.md](contributing.md)*
