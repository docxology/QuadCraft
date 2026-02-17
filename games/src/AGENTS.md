# Games/Src — Infrastructure & Shared Python Modules

## Overview

The `games/src` directory contains the core Python infrastructure for the QuadCraft project. This includes the game launcher, test runner, validation tools, analytics engine, and shared libraries used by the 22+ games.

## Directory Structure

### Root Modules

- **`launcher.py`**: The entry point for the "Game Launcher" GUI. Scans `games/` for valid game subdirectories and presents a unified launch interface.
- **`testing.py`**: A robust test runner that discovers and executes:
  - JavaScript unit tests (`games/*/tests/*.js`) via Node.js
  - Python unit tests (`games/*/tests/*.py`)
  - Shared infrastructure tests
- **`validation.py`**: A structural linter that enforces the "Standard Game Template". Checks for:
  - Required files (`AGENTS.md`, `README.md`, `index.html`)
  - Directory structure (`js/`, `css/`, `tests/`)
  - Valid metadata in `metadata.json` (if present) or `package.json`
- **`registry.py`**: Central registry for game discovery. Handles:
  - Loading game metadata
  - Dependency resolution (e.g., ensuring `4d_generic` is available)
  - Validation of game configuration
- **`config.py`**: Global configuration settings, constants, and path definitions.

### Submodules

#### `analytics/`

Analyzes codebase health and complexity.

- **`health_score.py`**: Calculates a "Health Score" (0-100) for each game based on:
  - Test coverage
  - Documentation presence
  - Code complexity (linting)
- **`metrics.py`**: Collects raw metrics (Line counts, file counts).

#### `scaffold/`

Templates and tools for generating new games.

- **`generator.py`**: Creates a new game directory populated with:
  - `index.html` (Standard template)
  - `js/` (Game loop, Renderer, Board stubs)
  - `tests/` (Basic test suite)
  - Documentation (`AGENTS.md`, `README.md`)

#### `shared/`

Shared Python logic usable by game scripts.

- **`metadata.py`**: Schema and parsers for game metadata.
- **`utils.py`**: Common file I/O and string manipulation utilities.

#### `space/`

Core mathematical libraries for 4D geometry (used by Python tools).

- **`quadrays.py`**: Python implementation of 4D Quadray coordinates (parities `js/quadray.js`).
- **`ivm.py`**: Integer Vector Matrix (IVM) grid utilities.
- **`geometry.py`**: Synergetics geometry constants and helper functions.

## Usage

### Running Tests

Execute the global test runner from the repository root:

```bash
# Run all tests
python3 games/run_games.py --test --all

# Run tests for a specific game
python3 games/run_games.py --test --game snake
```

### Validating Structure

Run the validation suite to ensure all games meet the project standards:

```bash
python3 games/run_games.py --validate
```

### Launching the Dashboard

Start the interactive game launcher:

```bash
python3 games/run_games.py
```

## Maintenance Guide

### Adding a New Shared Module

1. Create the module in `games/src/shared/`.
2. Register it in `games/src/config.py` if it needs global visibility.
3. Add unit tests in `games/tests/test_infrastructure.py`.

### Updating the Validation Rules

Modify `games/src/validation.py` to add new checks (e.g., enforcing a new documentation file).
Ensure to update `games/src/scaffold/` to generate compliant code for new games.
