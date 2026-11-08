# 4D Life test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve the raw Set and 80-offset toroidal update rule; do not replace it with GridUtils’s twelve-neighbor graph. Keep the wall-clock speed gate distinct from the shared loop’s fixed-second callback units.

## Evidence limits

Raw cell set/get and keys, generation increments, random seeding, named-pattern loading, wrapped indices, metadata/reset and shared readouts. Tests do not establish pattern dynamics or the controller’s wall-clock speed behavior.

The historical `test.html` loads missing `../js/quadray.js` and omits shared dependencies. Use the Node suite for logic; verify simulation controls on the actual game entrypoint.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
