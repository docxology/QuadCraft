# 4D 2048 maintenance — Raw-label directional tile slides and merges

Read the [game guide](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md) before changing behavior. This folder is a browser game, not the native QuadCraft runtime.

## Source ownership

- [index.html](index.html) is authoritative for script order, page controls and construction.
- [js/README.md](js/README.md) maps `Twenty48Board`, `Twenty48Renderer` and `Twenty48Game` to their actual files.
- [tests/README.md](tests/README.md) records the actual source paths and historical browser-runner limitations.

## Preserve game-specific invariants

Preserve raw slide bounds and the exact twelve-key/index mapping; this board does not normalize slide destinations. Keep each destination’s once-per-slide merge guard. Do not infer canonical FCC adjacency from the direction labels.

Slides are discrete key actions; inherited update has no continuous simulation. Slide callbacks explicitly reject paused input. P toggles the shared loop; R resets the board/scoring.

## Supported scope

There is no undo, solver or seeded replay. Reaching 2048 sets `won` but does not itself stop slides. The controller passes unsupported ScoreManager option `key` (not `storageKey`) and returns a string from `_getHUDState`, although BaseGame expects `{text,color}`; do not promise a persistent Best record or a working shared HUD.

Do not infer inherited APIs from scripts merely being loaded. Keep raw storage, normalized physical points, graph edges and display geometry separate. Link shared math rather than copying a conflicting distance formula or fabricated local `quadray.js` API.

## Verification expectations

From the QuadCraft root, use `python3.13 games/run_games.py --test --game 2048` for the registered suites. Also validate the portfolio with `python3.13 games/run_games.py --validate` and inspect the served page for console errors, real controls, camera/zoom and reset behavior. Follow the [repository testing guide](../../docs/development/testing_guide.md); Node logic results alone do not establish browser correctness. Report only checks actually run, without permanent passing-count claims.
