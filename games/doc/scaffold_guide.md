# Scaffold Guide — `GameScaffold`

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.


> Generate a fully structured new game directory from templates, ready for game-specific implementation.

---

## Quick Start

```python
from games.src.scaffold import GameScaffold

scaffold = GameScaffold("puzzle", "4D Puzzle", grid_size=6, tick_rate=20)
path = scaffold.create()
print(f"Created: {path}")

# Verify structure
issues = scaffold.validate()
assert len(issues) == 0, f"Validation failed: {issues}"
```

---

## `GameScaffold` Class

### Constructor

```python
GameScaffold(
    game_key: str,        # Registry key (e.g. "puzzle")
    display_name: str,    # Display name (e.g. "4D Puzzle")
    *,
    grid_size: int = 8,   # Default grid dimension
    tick_rate: int = 16,  # GameLoop updates per second
)
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `create(overwrite=False)` | `Path` | Create full directory structure; raises if exists (unless `overwrite=True`) |
| `validate()` | `list[str]` | Check that all required files exist; returns list of issues |

---

## Generated File Structure

Running `GameScaffold("puzzle", "4D Puzzle").create()` generates:

```text
games/4d_puzzle/
├── index.html                  # Entry point with shared module imports
├── AGENTS.md                   # Game-specific agent instructions
├── run.sh                      # Standalone launch script
├── manifest.json               # Game metadata
├── js/
│   ├── puzzle_board.js         # Board/world state class
│   ├── puzzle_renderer.js      # Canvas rendering class
│   └── puzzle_game.js          # Game controller class
└── tests/
    └── test_puzzle.js          # Unit test skeleton
```

### Generated File Details

| File | Generator | Key Contents |
|------|-----------|-------------|
| `index.html` | `_write_html()` | Full `<script>` tag block importing all 12 shared modules + 3 game modules |
| `{key}_board.js` | `_write_board()` | `PuzzleBoard` class with grid array, `getCell()`/`setCell()`, `reset()` |
| `{key}_renderer.js` | `_write_renderer()` | `PuzzleRenderer` extends `BaseRenderer`, `drawBoard()` with cell projection |
| `{key}_game.js` | `_write_game()` | `PuzzleGame` extends `BaseGame`, `init()`/`update(dt)`/`render()` lifecycle |
| `run.sh` | `_write_run_sh()` | From `_run_template.sh`, configured with game-specific paths |
| `AGENTS.md` | `_write_agents_md()` | Game-specific agent instructions with architecture notes |
| `manifest.json` | `_write_manifest()` | `{key, name, grid_size, tick_rate, version}` |

### Class Naming Convention

The scaffold auto-generates PascalCase class names from the game key:

| Game Key | Board Class | Renderer Class | Game Class |
|----------|-------------|----------------|------------|
| `puzzle` | `PuzzleBoard` | `PuzzleRenderer` | `PuzzleGame` |
| `tower_defense` | `TowerDefenseBoard` | `TowerDefenseRenderer` | `TowerDefenseGame` |

---

## End-to-End Workflow

After scaffolding, complete these steps to make the game fully operational:

```bash
# 1. Generate the scaffold
python3 -c "from games.src.scaffold import GameScaffold; GameScaffold('puzzle', '4D Puzzle').create()"

# 2. Register in registry.py — add entry to GAMES dict in src/core/registry.py
# 3. Implement game logic in js/ files
# 4. Write tests in tests/test_puzzle.js
# 5. Regenerate shell scripts
python3 games/scripts/regenerate_scripts.py

# 6. Run validation
python3 run_games.py --validate

# 7. Run tests
python3 run_games.py --test --game puzzle

# 8. Add to GAMES_INDEX.md
```

> See [contributing.md](contributing.md) for the full step-by-step guide.

---

## Parameters Reference

| Parameter | Default | Effect on Generated Code |
|-----------|---------|--------------------------|
| `grid_size` | `8` | Sets `this.size = {grid_size}` in board constructor; grid is `size⁴` |
| `tick_rate` | `16` | Sets `new GameLoop(update, {tick_rate})` in game controller |

---

*See also: [game_template.md](game_template.md) · [contributing.md](contributing.md) · [python_infrastructure.md](python_infrastructure.md)*
