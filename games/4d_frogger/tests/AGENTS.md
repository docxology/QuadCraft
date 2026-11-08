# 4D Frogger test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve raw wrapped B/C/D state and bounded A progress. Keep timer/speed units per board step, and do not invent four-goal home slots or pause-gated hop ownership.

## Evidence limits

Initial state, hop direction, a step, entity records, distances/neighbors, metadata and reset. Several checks are structural smoke assertions, not comprehensive collision, timeout or controller verification.

`test.html` loads game subclasses without the complete shared BaseBoard/BaseGame dependencies and uses small inline checks. It is historical smoke wiring, not parity with the Node suite.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
