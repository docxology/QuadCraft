# GameScaffold generation and integration limits

Source: [`src/scaffold/__init__.py`](../src/scaffold/__init__.py). This generator writes a starter implementation, not finished gameplay or release-ready browser integration.

## Actual constructor and creation API

```python
from pathlib import Path
from games.src.scaffold import GameScaffold

scaffold = GameScaffold("puzzle", "4D Puzzle", grid_size=6, tick_rate=20,
                        optional_modules=["base_board.js"])
# Run from the QuadCraft repository root; correct the known default path.
scaffold.game_dir = Path("games/4d_puzzle").resolve()
path = scaffold.create()
issues = scaffold.validate()
```

`GameScaffold(game_key,display_name,*,grid_size=8,tick_rate=16,optional_modules=None)` has no `games_dir` constructor argument. `tick_rate` is **milliseconds per tick**, not updates per second. Optional names must belong to the configured optional list: base_board, entity_system, turn_manager, pathfinding JS filenames; unknown names raise `ValueError`. Adding an optional import does not cause generated classes to use it.

`create(*,overwrite=False) -> Path` rejects an existing target with `FileExistsError` unless overwrite is enabled. Overwrite rewrites generated files without deleting unrelated ones. `validate()` checks required docs/index and the three named JS files, not playability or behavior. The default target inherits the [nested games/games path defect](configuration.md); the explicit `game_dir` assignment above avoids it without claiming a source fix.

## Generated output

| File | Current generated behavior |
|---|---|
| `js/<key>_board.js` | Standalone class; raw `size**4` array of `{a,b,c,d,value}`; no getCell/setCell or BaseBoard inheritance; empty `step()` plus reset |
| `js/<key>_renderer.js` | Standalone canvas renderer and `_project`; not BaseRenderer inheritance |
| `js/<key>_game.js` | Standalone controller composing InputController/GameLoop; `init`, `update(dtSeconds)` forwarding to board step, reset and HUD helpers |
| `index.html` | Core imports plus requested optional imports, fixed canvas, constructed controller and `init()` |
| `manifest.json` | key, name, dir, grid_size, tick_rate, shared_modules, optional_modules; not read by the launcher as registry/config |
| `AGENTS.md` | Generated local architecture/control notes |
| `run.sh` | Legacy inline local HTTP command, not the central wrapper template |
| `tests/test_<key>.js` | Basic creation/reset assertions, not implemented rule tests |

Class names capitalize underscore-separated parts and append Board/Renderer/Game. The generator does not register the key, allocate a port, add documentation navigation or add a Chromium scenario.

## Known browser integration limitations

The generated renderer currently calls `projectQuadray(a,b,c,d,this)`, while the real shared function requires `(Quadray,options)`. Its camera is not synchronized into renderer rotation, and the generated local `run.sh` serves the individual directory, breaking sibling shared imports. Replace these integration defects in a separately authorized new-game implementation before treating output as playable; use [actual shared APIs](shared_modules_reference.md) and [central launch operations](launch_operations.md). Basic generated tests and `validate()` do not catch these defects.

The generated board `step` is deliberately empty. Implement real rules and meaningful transitions rather than retaining the generated assertions as evidence of completion. Follow [contributing](contributing.md) and [game layout](game_template.md) for integration, unique registry offset and browser verification.
