# 4D Checkers test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Use canonical piece keys consistently; bounds and promotion operate on normalized positions. Do not silently import mandatory-capture/multi-jump rules from standard checkers.

## Evidence limits

Initial arrangement, origin moves, a jump/captured-piece removal and promotion. These focused board tests do not establish exhaustive turn, input, camera or rules coverage.

The historical `test.html` still loads missing `../js/quadray.js` and lacks the shared board dependencies. Treat it as stale wiring, not a current browser test result.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
