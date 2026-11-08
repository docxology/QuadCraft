# 4D Lights Out test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep canonical cells and normalized bounded-neighbor toggles aligned. Random generation must not get trapped by the player-facing won guard. Do not document unsupported ScoreManager low-score options as implemented.

## Evidence limits

Canonical physical cells, twelve direction permutations, self-plus-neighbor toggling, double-toggle reversal, win detection, nonblank randomization, metadata and reset. These do not prove an optimal solver or browser scoring persistence.

There is no local HTML test runner. Run the Node logic suite and separately inspect click picking, reset and HUD on the served page.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
