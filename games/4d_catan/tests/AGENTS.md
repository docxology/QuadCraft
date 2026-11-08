# 4D Catan test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep board resource accounting separate from controller phases and helper effects. Preserve HTML load order: board constants precede card/trading/robber/AI helpers. Do not infer complete standard-Catan legality or pause ownership from the shared base.

## Evidence limits

Resource layout/player state, building and city upgrades, road/metadata/reset helpers, shared math, and trading/robber/development-card functions evaluated with test helper objects. This does not establish real browser turn-flow coverage.

The historical `test.html` references missing `../js/quadray.js` and an incomplete dependency order. Use the Node suite and live game separately; the HTML page is not current evidence of passing checks.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
