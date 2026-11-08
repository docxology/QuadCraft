# 4D Go test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Keep one canonical cell per physical point. Capture/liberty traversal must use the same normalized bounded-neighbor graph; retain P as pass rather than silently restoring a base pause shortcut.

## Evidence limits

Canonical uniqueness, placement/occupancy/turns, pass/reset, a capture across a normalized boundary, rejection of a shifted-origin extra slot and shared geometry. No full scoring/ko or live browser UI coverage is implied.

There is no local HTML test runner in this directory. Run the Node logic suite and inspect the served game page separately.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
