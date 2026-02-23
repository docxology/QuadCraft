# Python Infrastructure — `src/`

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.

> Reference for the Python package that powers game registration, launching, testing, validation, scaffolding, analytics, shared-module metadata, and coordinate math.

---

## Package Structure

```text
src/
├── __init__.py       # Unified public API (35 exports)
├── core/             # Core infrastructure
│   ├── config.py     # Shared constants (ports, paths, module lists)
│   └── registry.py   # GAMES dict + load_config()
├── server/           # Serving infrastructure
│   └── launcher.py   # GameServer + QuietHTTPHandler
├── qa/               # Quality Assurance
│   ├── testing.py    # Node.js + Python test runner
│   └── validation.py # Structural audit engine
├── scaffold/         # GameScaffold code generator
├── analytics/        # GameAnalytics + health scoring
├── shared/           # ModuleRegistry + JSModule metadata
└── space/            # Quadray / IVM / XYZ / geometry
```

---

## `config.py` — Shared Constants

| Constant | Type | Value | Purpose |
|----------|------|-------|---------|
| `REPO_ROOT` | `str` | Auto-detected | Repository root path |
| `GAMES_DIR` | `str` | `{REPO_ROOT}/games` | Games directory |
| `GENERIC_DIR` | `str` | `{GAMES_DIR}/4d_generic` | Shared JS modules |
| `BASE_PORT` | `int` | `8400` | Default starting port |
| `SHARED_MODULES` | `list[str]` | 12 filenames | Required JS modules from `4d_generic/` |
| `REQUIRED_FILES` | `list[str]` | `[\"index.html\", \"AGENTS.md\"]` | Required files per game |
| `REQUIRED_JS_PATTERNS` | `dict` | `{board, renderer, game}` | Expected `js/` file naming patterns |
| `LOG_PREFIX` | `str` | `"[QuadCraft]"` | Logging prefix |

> See [configuration.md](configuration.md) for full config details.

---

## `registry.py` — Game Registry

The canonical mapping of game keys → metadata. Drives launching, testing, and validation.

```python
GAMES = {
    "chess":    {"dir": "4d_chess",    "name": "4D Chess",    "port_offset": 0},
    "checkers": {"dir": "4d_checkers", "name": "4D Checkers", "port_offset": 1},
    # ... 30 entries total
}
```

| Field | Type | Description |
|-------|------|-------------|
| `dir` | `str` | Directory name (`4d_<key>`) |
| `name` | `str` | Display name |
| `port_offset` | `int` | Added to `base_port` for serving |

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `load_config` | `(config_path: str) → dict` | Load JSON config file with game selections |

---

## `launcher.py` — HTTP Server

### `QuietHTTPHandler`

Extends `SimpleHTTPRequestHandler` with suppressed per-request logging.

### `GameServer`

Serves a single game on its own HTTP port.

| Method | Signature | Description |
|--------|-----------|-------------|
| `__init__` | `(game_key, base_port, games_dir, open_browser=True)` | Configure server from registry |
| `start()` | `→ bool` | Start HTTP server in background thread |
| `stop()` | `→ None` | Shutdown server |

**Key design:** The server serves the **parent `games/` directory** as the document root, so `../4d_generic/` relative paths resolve correctly from any game's `index.html`.

### `open_url(url)`

Platform-aware browser launcher (macOS `open`, Linux `xdg-open`, Windows `os.startfile`).

---

## `testing.py` — Test Runner

### `run_tests(games_dir, game_keys=None) → bool`

Orchestrates all tests. Returns `True` if everything passes.

**Execution flow:**

1. **Shared tests** — `games/tests/test_*.js` + `4d_generic/tests/test_*.js` (if running full suite)
2. **Python tests** — `games/tests/test_*.py` via `_run_python_test()`
3. **Per-game tests** — `4d_<game>/tests/test_*.js` for each requested game

### Internal Details

| Function | What it does |
|----------|-------------|
| `_run_test_file(tf, cwd, label)` | Run one `.js` test file via `node`, parse `=== Results: N passed, M failed ===` |
| `_run_python_test(tf, cwd, label)` | Run one `.py` test file via `python3`, parse unittest output |

**Fallback parsing:** If no structured results line found, counts `✅`/`❌` emoji lines.

> See [testing_guide.md](testing_guide.md) for writing tests.

---

## `validation.py` — Structural Audit

### `validate_game(games_dir, key) → list[str]`

Checks a single game for:

| # | Check | Details |
|---|-------|---------|
| 1 | Directory exists | `4d_<key>/` must exist |
| 2 | Required files | `index.html`, `js/`, `tests/` with `test_*.js` |
| 3 | No local quadray.js | Should use shared from `4d_generic/` |
| 4 | Shared imports | `index.html` must import `quadray.js`, `camera.js`, `projection.js`, `zoom.js` |
| 5 | AGENTS.md | Must exist |
| 6 | Board logic | `*_board.js` must exist and be ≥200 bytes |
| 7 | Renderer not scaffold | No `[scaffold]` markers or TODO stubs |
| 8 | Game controller not scaffold | No scaffold markers |

**ES-module exemption:** Games in `ES_MODULE_GAMES` (currently `{"doom"}`) skip checks 3–4.

### `check_shared_dir(games_dir) → list[str]`

Verifies `4d_generic/` contains all required shared modules.

### `audit_all(games_dir) → bool`

Full validation: shared dir + all registered games. Prints formatted report.

---

## `__init__.py` — Public API

All 35 exports are available from `from games.src import ...`:

| Category | Exports |
|----------|---------|
| Config | `REPO_ROOT`, `GAMES_DIR`, `GENERIC_DIR`, `BASE_PORT`, `SHARED_MODULES`, `REQUIRED_FILES`, `REQUIRED_JS_PATTERNS`, `LOG_PREFIX` |
| Registry | `GAMES`, `load_config` |
| Launcher | `GameServer` |
| Testing | `run_tests` |
| Validation | `validate_game` |
| Scaffold | `GameScaffold` |
| Analytics | `GameAnalytics`, `SuiteReport`, `GameMetrics` |
| Shared | `ModuleRegistry`, `JSModule`, `resolve_module_path` |
| Space | `Quadray`, `IVM`, `SYNERGETICS`, `quadray_to_xyz`, `xyz_to_quadray` |

---

*See also: [architecture.md](architecture.md) · [scaffold_guide.md](scaffold_guide.md) · [analytics_reporting.md](analytics_reporting.md) · [space_math_reference.md](space_math_reference.md)*
