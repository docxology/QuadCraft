# Shared geometry test maintenance — metric invariants and API distinctions

Read the [local suite map](README.md) and [shared-module instructions](../AGENTS.md). Keep the canonical shared and modular-browser APIs distinct when adding regressions; neither is the C++ `Vector3` interface.

Prefer signed/fractional positions, independent large common offsets, Cartesian metric comparisons, real round trips and consumer-visible snap/graph behavior. Do not assert the raw four-coefficient norm as physical distance or mistake integer component snapping for a nearest-FCC search.

The local suites do not cover every shared module or browser lifecycle. Select additional consumer suites under `games/tests/` and real Canvas/input checks when affected. Retain meaningful output and nonzero failure exits for launcher discovery; never replace behavior checks with wording, exported-name, file-existence or permanent-count assertions. Report only checks actually executed; see the [repository testing guide](../../../docs/development/testing_guide.md).
