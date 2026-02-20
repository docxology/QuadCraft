# Games/Src — Infrastructure & Shared Python Modules

## Overview

The `games/src` directory contains the core Python infrastructure for the QuadCraft project. This includes the game launcher, test runner, validation tools, board analysis, analytics engine, scaffold generator, and shared libraries used by the 22 games.

## Directory Structure

### Root Modules

| Module               | Purpose                                                                |
|----------------------|------------------------------------------------------------------------|
| `core/config.py`     | Global constants: paths, ports, shared module lists, required files    |
| `core/registry.py`   | Game registry (GAMES dict), config file loading                        |
| `server/launcher.py` | HTTP server per game with browser launch                               |
| `qa/testing.py`      | Node.js + Python test discovery and execution                          |
| `qa/validation.py`   | Structural linting: required files, shared imports, scaffold detection |

### Subpackages

#### `analytics/` — Suite Health Reporting

| Export | Description |
|--------|-------------|
| `GameAnalytics` | Scans game dirs, computes health metrics |
| `GameMetrics` | Per-game metrics (JS files, lines, patterns) |
| `SuiteReport` | Aggregate report with `summary()` and `to_json()` |

#### `board/` — Board Analysis & Migration

| Export | Description |
|--------|-------------|
| `BoardAudit` | Detects BaseBoard migration status, local method overrides |
| `BoardCatalog` | Catalogs board classes, patterns (turn-based/real-time/sandbox), shared methods |
| `migrate_board()` | Conservative migration: adds `extends BaseBoard` + `super()` |

#### `scaffold/` — Game Generation

| Export | Description |
|--------|-------------|
| `GameScaffold` | Creates new game dirs with HTML, JS, tests, docs, manifest |

#### `shared/` — JS Module Registry

| Export | Description |
|--------|-------------|
| `ModuleRegistry` | 17-module registry with dependency-safe load ordering |
| `JSModule` | Metadata dataclass (name, filename, category, deps) |
| `resolve_module_path()` | Resolve a module filename to its absolute path |

#### `space/` — Quadray / IVM / XYZ Math

| File | Contents |
|------|----------|
| `quadrays.py` | `Quadray` class with arithmetic, normalization, XYZ conversion |
| `ivm.py` | `SynergeticsConstants`, `IVMGrid`, `Jitterbug` transform |
| `xyz.py` | Coordinate transforms, `project_quadray()`, `rotate_xyz()` |
| `geometry.py` | Distances, angles, grid generation, verification suite |

## Usage

```bash
# Run all tests via master script
python3 games/run_games.py --test

# Run Python infrastructure tests directly
python3 -m pytest games/tests/

# Validate structure
python3 games/run_games.py --validate

# Board migration report
python3 -c "from games.src.board import BoardAudit; print(BoardAudit().migration_report())"

# Board catalog
python3 -c "from games.src.board import BoardCatalog; print(BoardCatalog().summary_report())"

# Shared module coverage
python3 -c "from games.src.shared import ModuleRegistry; print(ModuleRegistry().coverage_report())"

# Analytics health report
python3 -c "from games.src.analytics import GameAnalytics; print(GameAnalytics().full_report().summary())"
```

## Maintenance Guide

### Adding a New Shared Module

1. Create the JS file in `games/4d_generic/`.
2. Add a `JSModule(...)` entry to `games/src/shared/__init__.py` `_MODULE_DEFS`.
3. Add to `SHARED_MODULES` or `OPTIONAL_SHARED_MODULES` in `games/src/config.py`.
4. Add to `REQUIRED_SHARED_MODULES` or `OPTIONAL_SHARED_MODULES` in `games/src/validation.py`.
5. Add tests in `games/tests/`.

### Adding a New Game

1. Use `GameScaffold('key', 'Display Name').create()` or create manually.
2. Add entry to `games/src/registry.py` `GAMES` dict.
3. Run `python3 games/scripts/regenerate_scripts.py`.
4. Add to `GAMES_INDEX.md`.
