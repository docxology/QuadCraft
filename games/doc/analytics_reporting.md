# Textual portfolio metrics and completeness reports

Source: [`src/analytics/__init__.py`](../src/analytics/__init__.py). These are file/text heuristics, not measured gameplay quality, test coverage, correctness, performance or player telemetry.

## Generate a report with explicit paths

Run Python from the QuadCraft repository root:

```python
from pathlib import Path
from games.src.analytics import GameAnalytics

games = Path("games").resolve()
analytics = GameAnalytics(games_dir=str(games), generic_dir=str(games / "4d_generic"))
report = analytics.full_report()
print(report.summary())
print(report.to_json())
```

Explicit roots avoid the [current tooling path-default defect](configuration.md). `scan_game(game_dir: Path)` returns one `GameMetrics`; `full_report()` scans sorted `4d_*` directories except `4d_generic`, including unregistered directories. It does not use the registry's selection or run tests.

## What is actually measured

`GameMetrics` contains `key`, `name`, `dir_path`, `js_files`, `total_js_lines`, flags `has_board`, `has_renderer`, `has_game_controller`, `has_game_loop`, `has_input_controller`, and lists `shared_modules_used`, `missing_files`, `issues`.

Only direct `js/*.js` files are scanned. Board/renderer/controller detection looks for class/name substrings, not a specific filename or parsed inheritance. A loop is detected by `GameLoop` or `requestAnimationFrame`; input by `InputController` or the literal single-quoted `addEventListener('keydown'`. Alternate syntax can be missed; comments can match. Shared usage is filename substring matching against the core list in `index.html`, not resolved imports or runtime calls. Required-file checks use `index.html` and `AGENTS.md`.

`health_score` is the fraction of seven booleans: board, renderer, controller, loop, input, no missing required files, at least three JS files. All have equal weight. The summary uses thresholds 0.85 and 0.5 for visual categories; these do not establish “healthy” software. A specialized valid architecture can score lower, and an inert template can score highly.

## Report shape

`SuiteReport` stores `games`, `shared_module_count`, `total_js_files`, `total_js_lines`. Shared count includes direct `.js` **and `.css`** files. `summary()` formats the metrics table. `to_json()` emits `game_count`, `shared_modules`, aggregate JS counts, and game records containing only `key`, rounded `health`, `js_files`, `js_lines`, `issues`; it does not serialize every `GameMetrics` field.

Use fresh reports with a recorded checkout/date instead of copied sample totals. Complement them with [structural, logic and browser gates](testing_guide.md). Analytics is not automatically invoked by `run_games.py --validate`.
