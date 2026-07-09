# Configuration Reference

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.

> All configuration surfaces for the QuadCraft games framework.

---

## Configuration Sources

| Source | Location | Format | Scope |
|--------|----------|--------|-------|
| `config.py` | `src/core/config.py` | Python constants | Infrastructure defaults |
| `games_*.json` | (User-provided) | JSON config | Deployment overrides |
| `registry.py` | `src/core/registry.py` | Python dict | Game definitions |
| CLI flags | `run_games.py` | argparse | Per-invocation overrides |

---

## `src/core/config.py` — Infrastructure Constants

### Paths

| Constant | Value | Description |
|----------|-------|-------------|
| `REPO_ROOT` | Auto-detected | Repository root (2 levels up from `config.py`) |
| `GAMES_DIR` | `{REPO_ROOT}/games` | Games directory |
| `GENERIC_DIR` | `{GAMES_DIR}/4d_generic` | Shared JS module directory |

### Networking

| Constant | Value | Description |
|----------|-------|-------------|
| `BASE_PORT` | `8100` | Default starting port for game servers |

### Shared Module List

```python
SHARED_MODULES = [
    "quadray.js", "camera.js", "projection.js", "zoom.js",
    "synergetics.js", "input_controller.js", "game_loop.js",
    "hud.js", "score_manager.js", "grid_utils.js",
    "base_renderer.js", "base_game.js",
]
```

Used by: `validation.py` (import checks), `shared/ModuleRegistry`, `analytics/GameAnalytics`

### Required Files

```python
REQUIRED_FILES = ["index.html", "AGENTS.md"]
```

Used by: `analytics/GameAnalytics` (health scoring)

### JS Patterns

```python
REQUIRED_JS_PATTERNS = {
    "board":    "{game}_board.js",
    "renderer": "{game}_renderer.js",
    "game":     "{game}_game.js",
}
```

Used by: `scaffold/GameScaffold` (file generation)

### Logging

| Constant | Value | Description |
|----------|-------|-------------|
| `LOG_PREFIX` | `"[QuadCraft]"` | Prefix for log messages |

---

## `games_config.json` — Runtime Config

```json
{
    "games": ["chess", "checkers", "reversi", ...],
    "base_port": 8100,
    "open_browser": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `games` | `string[]` | All 30 | Game keys to launch |
| `base_port` | `int` | `8100` | Starting port number |
| `open_browser` | `bool` | `true` | Auto-open browser windows |

**Usage:**

```bash
python3 run_games.py --config games_config.json
```

> **Tip:** Create alternative config files for subsets (e.g., `arcade_config.json` with just arcade games).

---

## Port Mapping

Each game's port = `base_port + port_offset` (from `registry.py`).

| Offset | Game | Port (base_port 8100) |
|--------|------|------------------------|
| 0 | chess | 8100 |
| 1 | checkers | 8101 |
| 2 | reversi | 8102 |
| 3 | life | 8103 |
| 4 | asteroids | 8104 |
| 5 | simant | 8105 |
| 6 | backgammon | 8106 |
| 7 | minecraft | 8107 |
| 8 | catan | 8108 |
| 9 | tower_defense | 8109 |
| 10 | doom | 8110 |
| 11 | mahjong | 8111 |
| 12 | tetris | 8112 |
| 13 | snake | 8113 |
| 14 | pong | 8114 |
| 15 | breakout | 8115 |
| 16 | pacman | 8116 |
| 17 | space_invaders | 8117 |
| 18 | frogger | 8118 |
| 19 | bomberman | 8119 |
| 20 | connect_four | 8120 |
| 21 | minesweeper | 8121 |

> **Custom ports:** Use `--base-port N` on the CLI or `"base_port": N` in the config file.

---

## Validation Configuration

`validation.py` uses hardcoded constants:

| Constant | Value | Purpose |
|----------|-------|---------|
| `SHARED_MODULES` | all 12 entries from `core/config.py` (`quadray.js`, `synergetics.js`, `grid_utils.js`, `camera.js`, `projection.js`, `zoom.js`, `base_renderer.js`, `game_loop.js`, `base_game.js`, `score_manager.js`, `input_controller.js`, `hud.js`) | Imports checked in `index.html` |
| `SHARED_DIR_NAME` | `"4d_generic"` | Expected shared module directory |
| `ES_MODULE_GAMES` | `{"doom"}` | Games exempt from shared-import checks |
| `EXPECTED_BOARD_METHODS` | `["getCell", "setCell"]` | Expected board API (warning only) |

---

## Precedence

When multiple sources set the same value, the precedence is:

```text
CLI flags  >  Config JSON  >  config.py defaults
```

For example, `--base-port 9000` overrides `"base_port": 8100` from JSON, which overrides `BASE_PORT = 8100` from `config.py`.

---

*See also: [launch_operations.md](launch_operations.md) · [python_infrastructure.md](python_infrastructure.md) · [game_template.md](game_template.md)*
