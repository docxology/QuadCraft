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

> **Known bug:** `GameScaffold(...).create()` called with no explicit `games_dir` override writes into `GAMES_DIR` from `core/config.py`, which resolves to `{REPO_ROOT}/games` — but `REPO_ROOT` is already the `games/` directory itself, so the scaffold lands in a nested `games/games/4d_<key>/` path, not `games/4d_<key>/` as shown below. `run_games.py` sidesteps the same `REPO_ROOT`/`GAMES_DIR` ambiguity elsewhere by always resolving `games_dir = Path(__file__).parent.resolve()` (`run_games.py:73`) rather than importing `GAMES_DIR`; `GameScaffold` currently has no `games_dir` constructor parameter to do the same, so this needs a code fix (or manual `scaffold.game_dir` correction) before relying on the Quick Start example below as-is.

Running `GameScaffold("puzzle", "4D Puzzle").create()` generates (assuming a correct `games_dir`):

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
| `{key}_renderer.js` | `_write_renderer()` | `PuzzleRenderer` class (no inheritance), `render()` with `_project()` cell projection |
| `{key}_game.js` | `_write_game()` | `PuzzleGame` class (no inheritance), `init()`/`update()` (no args)/`reset()`, `_setupInput()`/`_updateHUD()` helpers; rendering happens inline via the `GameLoop` render callback (`this.renderer.render()`), not a public `render()` method on the game class |
| `run.sh` | `_write_run_sh()` | Standalone bash script built inline as a Python f-string (no `_run_template.sh` file is read); serves the game directory itself on port 8080, which is document-root-incorrect relative to how `GameServer` serves the parent `games/` directory |
| `AGENTS.md` | `_write_agents_md()` | Game-specific agent instructions with architecture notes |
| `manifest.json` | `_write_manifest()` | `{key, name, dir, grid_size, tick_rate, shared_modules, optional_modules}` (no `version` field) |

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
