# Python launcher and portfolio-analysis interfaces

Python tooling under [`src/`](../src/) manages files and static serving; it is not the browser simulation runtime. Imports below assume the QuadCraft repository root is on Python's import path. Use Python 3.13; no third-party Python package is required by these modules.

## Package map

| Module | Public entrypoints and scope |
|---|---|
| `core/config.py` | Constants for ports, files and module-policy lists; see [path caveat](configuration.md) |
| `core/registry.py` | `GAMES`, `load_config(path)`, `get_port(key, base_port=None)` |
| `server/launcher.py` | `GameServer(key, base_port, games_dir, open_browser=True)`; `start() -> bool`, `stop()` |
| `qa/testing.py` | `run_tests(games_dir: Path, game_keys=None) -> bool` |
| `qa/validation.py` | `validate_game(games_dir, key) -> list[str]`, `check_shared_dir(games_dir)`, `audit_all(games_dir) -> bool` |
| `scaffold/__init__.py` | `GameScaffold`, a file generator, not a complete game |
| `analytics/__init__.py` | `GameAnalytics`, `GameMetrics`, `SuiteReport`; textual file metrics |
| `shared/__init__.py` | `JSModule`, `ModuleRegistry`, `resolve_module_path(filename)`; JS metadata, not executable JS |
| `board/` | `BoardAudit`, `AuditResult`, `BoardCatalog`, `BoardInfo`; heuristic source scans |
| `space/` | Floating-point `Quadray`, transforms, geometry, grid and reference constants |

`src/__init__.py` re-exports selected interfaces. `check_shared_dir` and `migrate_board` are imported from their defining modules, not that facade. Do not use obsolete `games.src.registry`, `games.src.config` or `games.src.testing` paths.

## Explicit-path library use

```python
from pathlib import Path
from games.src.analytics import GameAnalytics
from games.src.board import BoardAudit, BoardCatalog

games = Path("games").resolve()
report = GameAnalytics(games_dir=str(games), generic_dir=str(games / "4d_generic")).full_report()
print(report.summary())
print(BoardAudit(games).migration_report())
print(BoardCatalog(games).summary_report())
```

The default paths in `core/config.py` currently nest `games/games`; the CLI avoids them. Read [configuration](configuration.md) before using default constructors or interpreting missing-file reports. `ModuleRegistry` has no root constructor parameter and its `JSModule.path` uses that default.

## Shared-module metadata

`JSModule(name, filename, category, description, depends_on=[])` exposes `path`, `exists`, `subfolder`. `ModuleRegistry` offers `get(filename)`, `all_modules()`, `by_category(category)`, `categories()`, `load_order()`, `missing_modules()`, `coverage_report()`. `load_order()` returns module metadata in dependency order; it does not import scripts or inject HTML. Its sixteen JS definitions omit the additional graph kernel and CSS. `resolve_module_path(filename)` returns an existing default-root/subfolder path or `None`; file presence is not test coverage. For deployment paths use the actual checkout root explicitly rather than interpreting this registry as a full runtime loader.

## Board scanning and migration

`BoardAudit(games_dir=None)` returns `AuditResult(game_key, board_file, extends_base_board, local_methods, missing_import)` from `scan_game(Path)` or `scan_all()`. Its `missing_import` flag is a text heuristic, not resolved dependency analysis.

`BoardCatalog(games_dir=None)` supplies `scan_game`, `scan_all`, `find_shared_methods(min_count=3)` and `summary_report()`. `BoardInfo` records class/file, line count, methods, heuristic pattern and detected helper names. Both tools inspect one matching board per directory; catalogs are not complete JS parsers. A local override can be intentional and is not automatically dead code.

`games.src.board.migrate.migrate_board(board_path, dry_run)` performs textual require/extends/super additions and returns change flags; it does not reconcile raw storage, reset, constructors or rule semantics. Its CLI's `GAMES_DIR` currently points into `games/src`, so it is not a reliable portfolio-wide migration command. Inspect a dry-run and each actual caller before any separately authorized migration; documentation work does not run `--apply`.

## Further references

[Launch](launch_operations.md) · [QA](testing_guide.md) · [Scaffold](scaffold_guide.md) · [Analytics](analytics_reporting.md) · [Space math](space_math_reference.md) · [Browser APIs](shared_modules_reference.md)
