# 4D Asteroids test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep raw periodic state separate from physical nearest-image distance. Preserve the independent seeded RNG and event-time ordering, including residual fragment flight and pending respawn cancellation on reset.

## Evidence limits

Wrapping, fixed-loop partitioning, paused commands, physical nearest images, swept seams/grazing contacts, impact ordering, fragment remainder time, simulation timers, independent seeded reset and respawn ownership. The browser path additionally exercises the real Canvas renderer.

`test.html` loads the same kernel checks plus the actual controller/Canvas path; use the served `/4d_asteroids/tests/test.html` URL. Node does not exercise the browser-only Canvas branch.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
