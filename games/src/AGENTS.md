# Maintaining Python portfolio infrastructure

Read [repository rules](../../AGENTS.md), [package map](README.md) and [Python interfaces](../doc/python_infrastructure.md). Keep this tooling separate from browser rules and native APIs.

## Source ownership

`core/registry.py` drives launch, QA and ports; directory-scanning analytics/catalogs have different discovery semantics. `core/config.py` contains policy lists, not a complete inventory of shared assets. Its path constants currently nest games/games: use explicit caller roots where supported and document the defect, not fabricated working defaults. Do not establish an alternate game registry in docs.

`server/launcher.py` must preserve per-handler document roots, process cwd and loopback/threaded shutdown behavior. `qa/testing.py` recursively discovers shared JS/Python tests, rejects nonzero/empty executions and uses sys.executable for Python children. `qa/validation.py` is textual; do not describe it as parsed rule/export/browser verification.

## Analysis and generation

Follow scoped package instructions. Read actual signatures and callers before editing templates or claiming parity. Board/analytics/module coverage reports are heuristics, not runtime correctness. Scaffold output has known path/projection/launcher integration issues; never label its basic checks complete gameplay. Migration scripts can write source and require separate authorization.

`space/` uses floating point and declared units; link [canonical portfolio contracts](../../docs/games.md), retain raw occupancy distinctions and do not copy scientific-package APIs or snapping conventions. Do not maintain timeless export/test/line totals or regenerate handcrafted documentation blindly. Verification commands and separation are in [the QA guide](../doc/testing_guide.md); obey the current assignment's execution restrictions.
