# Analytics & Reporting — `GameAnalytics`

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.

> Suite-wide health scoring, metrics collection, and reporting for all QuadCraft games.

---

## Quick Start

```python
from games.src.analytics import GameAnalytics

report = GameAnalytics().full_report()
print(report.summary())         # Human-readable health report
print(report.to_json())         # Machine-readable JSON
```

---

## Data Classes

### `GameMetrics`

Per-game metrics collected during analysis.

| Field | Type | Description |
|-------|------|-------------|
| `key` | `str` | Game registry key |
| `name` | `str` | Display name |
| `dir_path` | `str` | Absolute directory path |
| `js_files` | `int` | Number of `.js` files in `js/` |
| `total_js_lines` | `int` | Total lines of JavaScript |
| `has_board` | `bool` | `*_board.js` found |
| `has_renderer` | `bool` | `*_renderer.js` found |
| `has_game_controller` | `bool` | `*_game.js` found |
| `has_game_loop` | `bool` | `GameLoop` reference in game controller |
| `has_input_controller` | `bool` | `InputController` reference in game controller |
| `shared_modules_used` | `list[str]` | Shared modules imported in `index.html` |
| `missing_files` | `list[str]` | Required files not found |
| `issues` | `list[str]` | All detected issues |

### `health_score` Property

Returns `0.0–1.0` based on 7 completeness checks:

| Check | Weight |
|-------|--------|
| Has board file | 1/7 |
| Has renderer file | 1/7 |
| Has game controller | 1/7 |
| Has GameLoop integration | 1/7 |
| Has InputController integration | 1/7 |
| No missing required files | 1/7 |
| ≥3 JS files | 1/7 |

**Health interpretation:** `≥85%` = ✅ healthy · `≥50%` = ⚠️ warning · `<50%` = ❌ critical

---

### `SuiteReport`

Aggregate report for the entire game suite.

| Field | Type | Description |
|-------|------|-------------|
| `games` | `list[GameMetrics]` | Per-game metrics |
| `shared_module_count` | `int` | JS files in `4d_generic/` |
| `total_js_files` | `int` | Sum of all game JS files |
| `total_js_lines` | `int` | Sum of all JS lines |

| Method | Returns | Description |
|--------|---------|-------------|
| `summary()` | `str` | Formatted table with health scores, JS counts, issue counts |
| `to_json()` | `str` | JSON serialization for programmatic consumption |

#### Sample `summary()` Output

```text
╔════════════════════════════════════════════╗
║   QuadCraft Game Suite Health Report       ║
╚════════════════════════════════════════════╝

Games scanned: 22
Shared modules: 13
Total JS files: 89
Total JS lines: 14,237

Game                      Health   JS  Lines  Issues
───────────────────────────────────────────────────────
✅ asteroids                100%    3    412       0
✅ chess                    100%    9   2140       0
⚠️ example                  57%    2    180       2
```

---

## `GameAnalytics` Engine

### Constructor

```python
GameAnalytics(
    games_dir: str = None,     # Defaults to GAMES_DIR from config
    generic_dir: str = None,   # Defaults to GENERIC_DIR from config
)
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `scan_game(game_dir: Path)` | `GameMetrics` | Analyze a single game directory |
| `full_report()` | `SuiteReport` | Scan all `4d_*` directories (excluding `4d_generic`) |

### `scan_game()` Analysis Steps

1. Check required files (`index.html`, `AGENTS.md`)
2. Scan `js/*.js` — count files, lines, detect board/renderer/game patterns
3. Check `index.html` for shared module imports
4. Flag missing `GameLoop` / `InputController` integration

---

## Integration Points

| Tool | How it uses analytics |
|------|----------------------|
| `run_games.py --validate` | Uses `validation.py` (separate); analytics is complementary |
| Custom CI scripts | `GameAnalytics().full_report().to_json()` for machine-readable reporting |
| Health dashboards | Parse `summary()` or `to_json()` output |

---

*See also: [python_infrastructure.md](python_infrastructure.md) · [configuration.md](configuration.md) · [testing_guide.md](testing_guide.md)*
