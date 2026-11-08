# 4D 2048 test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve raw slide bounds and the exact twelve-key/index mapping; this board does not normalize slide destinations. Keep each destination’s once-per-slide merge guard. Do not infer canonical FCC adjacency from the direction labels.

## Evidence limits

Initial raw cells/tiles, at least one slide, invalid direction indices, move counters, metadata/reset and shared geometry. The randomized merge smoke assertion allows a nonnegative score without an actual merge, so it is not a strong merge-correctness regression.

There is no local HTML test runner. Node tests cover the board; the actual game page is needed for keyboard directions, pause, projection and HUD checks.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
