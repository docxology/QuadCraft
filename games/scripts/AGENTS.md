# Scripts — Agent Instructions

## Overview

This directory contains **thin orchestrator scripts** for the QuadCraft game
portfolio: launcher-script generation, documentation scaffolding/auditing, and
browser-test-harness generation. Each script is a thin wrapper — path
bootstrap and a single delegated call — while the reusable logic lives in
`games/src/` (importable and tested).

## Thin-Orchestrator Contract

- Every script has a module docstring, `#!/usr/bin/env python3` shebang, a
  `def main()` entry point, and an `if __name__ == "__main__":` guard. No
  import-time side effects.
- Path bootstrap is anchored, never CWD-dependent:
  `Path(__file__).resolve().parent...` inserted into `sys.path` (or used
  directly), so scripts run from any working directory.
- Business/data/plot logic lives in `games/src/`; scripts only set paths and
  invoke module entrypoints.
- New scripts MUST follow this shape and be added to the inventory below and
  to [README.md](README.md).

## File Inventory

| File | Purpose | Delegates to |
|------|---------|--------------|
| `_run_template.sh` | Shell template for generated launcher wrappers (consumed by `regenerate_scripts.py`, delegates to `run_games.py`) |
| `regenerate_scripts.py` | Generates `games/run_<game>.sh` launcher wrappers from template + registry | `src.core.registry` |
| `ensure_agents_md.py` | Ensures every game directory has an `AGENTS.md` file (creates stubs if missing) | `src.core.registry` |
| `generate_test_html.py` | Generates per-game `tests/test.html` browser test harnesses | `src.core.registry` |
| `generate_matrix.py` | Prints Markdown matrix of shared JS modules used by each game's `index.html` (read-only) | `src.core.registry` |
| `audit_docs.py` | Audits AGENTS.md/README.md completeness across `games/` (read-only) | — |
| `fix_docs.py` | Creates missing README/AGENTS.md stubs for game and infra directories | — |
| `update_tests.py` | Rewrites per-game test counts into game `AGENTS.md`/`README.md` | — |

## Usage

```bash
# Regenerate launcher wrapper scripts from template
python3 games/scripts/regenerate_scripts.py

# Ensure all games have AGENTS.md
python3 games/scripts/ensure_agents_md.py

# Generate browser test HTML pages
python3 games/scripts/generate_test_html.py

# Print shared-module usage matrix (read-only)
python3 games/scripts/generate_matrix.py

# Audit documentation completeness (read-only)
python3 games/scripts/audit_docs.py
```

## Gotchas

- `update_tests.py` writes the hardcoded `TEST_COUNTS` dict into game docs —
  refresh the dict before running or it will write stale numbers.
- `fix_docs.py` and `update_tests.py` mutate files (create stubs / rewrite
  counts); run `git diff` afterwards and revert unwanted changes.
- `generate_test_html.py` keeps per-game metadata in its own `TEST_CONFIG`
  dict rather than the registry; move it to `src/core/registry.py` if a second
  consumer appears.
