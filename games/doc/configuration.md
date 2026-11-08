# Game selection, ports and tooling path defaults

Source: [`run_games.py`](../run_games.py), [`core/registry.py`](../src/core/registry.py), [`core/config.py`](../src/core/config.py).

## CLI and JSON precedence

From the QuadCraft repository root:

```sh
python3.13 games/run_games.py --game chess doom --base-port 9000 --no-browser
python3.13 games/run_games.py --config games/games_config.json
```

JSON format (all fields optional):

```json
{"games": ["chess", "doom"], "base_port": 9000, "open_browser": false}
```

This is JSON loading, not schema validation. `load_config(path)` parses and returns the object; the CLI rejects unknown game keys.

Actual control flow is important:

1. `--validate` exits before other modes; `--list` is next and uses the CLI base port without reading JSON.
2. `--config` selects games before `--all` or `--game`. Missing JSON `games` defaults to every registry key.
3. JSON `base_port` overrides the CLI value, even an explicit `--base-port`.
4. JSON `open_browser` overrides `--no-browser` if present; otherwise the flag controls it.
5. `--test` executes the selected suite instead of starting servers. Without selection it runs the full portfolio.

An empty selection launches nothing; in test mode an explicit empty selection is not a full run. These are current implementation semantics, not a general “CLI always wins” policy.

## Registry and module lists

`GAMES[key]` contains `dir`, `name`, `port_offset`; `get_port(key, base_port=None)` adds the offset to 8100 unless another base is provided. The [inventory](../GAMES_INDEX.md) lists all thirty offsets (0–29).

`SHARED_MODULES` lists twelve classic JS filenames; `OPTIONAL_SHARED_MODULES` adds `base_board.js`, `entity_system.js`, `turn_manager.js`, `pathfinding.js`. `ALL_SHARED_MODULES` concatenates those lists. These are tooling policies, not a complete disk inventory: `graph_field.js` and `hud-style.css` are outside these lists. Doom skips classic import/local-copy validation.

`REQUIRED_FILES` is `index.html`, `AGENTS.md`. `REQUIRED_JS_PATTERNS` records the board/renderer/game naming convention, but the structural validator searches filename globs rather than enforcing that exact trio. See [testing](testing_guide.md).

## Known path-default limitation

In this checkout `config.py` computes `REPO_ROOT` as `games/`, not the repository root. Consequently `GAMES_DIR` is `games/games/` and `GENERIC_DIR` nests below it. `run_games.py` avoids these defaults by deriving its actual root from its own file.

For library consumers pass explicit `Path("games").resolve()` values to server/QA/board/analytics APIs from the repository root. `GameScaffold` has no directory constructor parameter: set its `game_dir` explicitly before creating files (see [scaffold guide](scaffold_guide.md)). `ModuleRegistry`/`JSModule.path` and `resolve_module_path` retain the flawed default, so default presence reports are not reliable evidence that a real shared file is missing. No source fix is implied by these documentation examples.
