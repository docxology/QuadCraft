# 4D Breakout test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Do not add a second seconds multiplier to per-step motion or describe rounded raw brick contact as physical collision. Keep score/life synchronization between board and controller.

## Evidence limits

Ball/paddle motion, paddle bounds, wall bounce, life loss, brick damage and destruction, combos, speed clamps and reset. Tests instantiate the board, not a real browser controller.

`test.html` omits shared subclass dependencies and contains its own small inline checks. It is not a substitute for the Node suite plus interaction checks on `index.html`.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
