# Maintaining QA discovery and failure evidence

Read [testing guide](../../doc/testing_guide.md) and actual `testing.py`/`validation.py` callers. Preserve recursive shared discovery, aggregate-runner exclusion, nonzero-exit and empty/all-skipped failure semantics. Do not conflate parsed counts with code coverage.

Validation's filename/text heuristics must not be documented as AST/rule/browser checks. Doom's exemption is limited to local shared-copy/import checks, not every structural requirement. The Chromium .mjs gate remains separately invoked; never silently skip unavailable runtimes or suppress real resource failures to make it green.
