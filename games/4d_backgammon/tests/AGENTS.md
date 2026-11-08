# 4D Backgammon test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep point indices, bar/off sentinels and dice consumption distinct from projected coordinates. Audit the first-valid-move click policy separately from board move generation.

## Evidence limits

Board initialization, dice range, distinct point projections, lane assignment, valid-move array, metadata/reset and shared geometry checks. The suite does not establish exhaustive legal-play or UI coverage.

The historical `test.html` references missing `../js/quadray.js` and does not reproduce the live entrypoint dependency chain. Use the Node suite for logic and the actual game page for browser checks; do not report this page as a working equivalent runner.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
