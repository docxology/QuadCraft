# 4D Quadray Chess test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve canonical keys, inclusive normalized bounds and directed piece offsets. Keep pseudo-legal move generation distinct from check detection. Audit real TurnManager records before claiming persistence/history compatibility.

## Evidence limits

Quadray/piece/board behavior, movement examples, math, analysis and storage helper objects, and edge cases. The suite does not instantiate the actual browser Game for its legacy storage round-trip checks.

`test.html` references missing local `../js/quadray.js` and does not load the current shared/storage dependency chain. The `lib_*.js` files are separate helper material, not proof of live-controller behavior.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
