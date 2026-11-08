# 4D Hex test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Preserve canonical cells and the exact face conditions. A winning fixture must follow real bounded-neighbor edges, not assume arbitrary coefficient-axis steps are FCC contacts.

## Evidence limits

Canonical board cells, alternating placement, duplicate rejection, reset and a genuine neighbor-connected red face-to-face win path, plus shared math checks. The suite is not an exhaustive proof of all connection/end states.

There is no local HTML test runner. The Node suite covers board logic; verify picking, camera and controls on the actual served page.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
