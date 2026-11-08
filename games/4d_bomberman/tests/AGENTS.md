# 4D Bomberman test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve raw keys and the eight signed movement/explosion directions. Keep logical bomb ticks separate from fixed-second loop callback units; examine paused event callbacks explicitly.

## Evidence limits

Movement blocking, bomb capacity/timing, explosion-center propagation, enemies, reset and rendered-entity records. These are board-level checks, not a complete input/render proof.

`test.html` loads game subclasses without the required shared BaseBoard/BaseGame dependency chain. It is a historical inline smoke page, not demonstrated parity with the Node suite.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
