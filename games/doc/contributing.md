# Adding or changing a browser portfolio game

Work from the QuadCraft repository root with Python 3.13 and Node.js available. Browser verification additionally needs the directory-local Playwright/Chromium dependencies. Read the target game's instructions, [layout](game_template.md), [shared APIs](shared_modules_reference.md) and [canonical contracts](../../docs/games.md) first.

## Implement the actual game boundary

For a new game, use [GameScaffold](scaffold_guide.md) only with its documented path override and integration limitations understood, or create the standard directory manually. The generator is not a finished game. Implement real state transitions, drawing, input, reset and terminal behavior. Choose raw-slot versus canonical-point storage explicitly and define each metric/adjacency. Do not assume twelve-neighbor geometry applies to all game rules.

If using BaseGame, compose real board/renderer objects and override its actual hooks. Shared loop callbacks receive fixed seconds while tick intervals are milliseconds. Discrete boards can own logical ticks. Random streams and reset semantics are game-specific; there is no universal seeded replay API. Input must not apply retroactively to accumulated elapsed time.

## Register and integrate

1. Add `GAMES[key] = {"dir": "4d_<key>", "name": display_name, "port_offset": offset}` in `games/src/core/registry.py`, choosing a unique offset after inspecting the actual maximum (current offsets 0–29).
2. Update the [inventory](../GAMES_INDEX.md), player/scoped guides and any explicit JSON selection that should include the game. A manifest does not register it.
3. Review shell integration: `run.sh` has its own key list, while `regenerate_scripts.py` generates per-game wrappers from the registry. Do not assume regenerating those wrappers updates the master list.
4. Add/maintain actual Node rule-transition tests and a real browser input/state/rendering scenario in the appropriate browser scenario group. The browser harness currently expects thirty unique games; a genuine catalog addition must update that explicit gate consistently.
5. Keep `4d_generic/` imports and dependency order correct; deploy/serve the parent `games/` directory.

## Verification layers

These commands are guidance for an authorized verification pass, not evidence they have been run by a documentation editor:

```sh
python3.13 games/run_games.py --validate
python3.13 games/run_games.py --test --game chess
python3.13 games/run_games.py --test
python3.13 games/run_games.py --game chess
```

Replace `chess` with an actual registered key under review. [Testing](testing_guide.md) explains recursive shared discovery, subprocess failure semantics and the independent [Chromium gate](../tests/browser/README.md). Verify legal/blocked/terminal/reset transitions and rendered input alignment, not merely symbol existence, default fields or a saved pass count. Do not claim browser correctness from Node canvas doubles or text validation.

## Documentation handoff

Use informative topic titles and canonical links; preserve filenames. Describe actual controls, units, raw identity, implemented rules and meaningful limitations. Do not invent APIs, publish subjective completeness percentages, copy stale test totals, or overwrite handcrafted game notes with a generic generator. Report only exercised verification with checkout/date and diagnostic paths. [Maintenance scripts](scripts_reference.md) documents which utilities write files and why some legacy generators are unsafe as a blanket refresh.
