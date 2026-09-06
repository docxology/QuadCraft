# Scripts Module

Thin orchestrator scripts for the QuadCraft game portfolio: each script sets
paths, then delegates to entrypoints in `games/src/` (mainly
`src.core.registry`). See [AGENTS.md](AGENTS.md) for the thin-orchestrator
contract and gotchas.

## Inventory

| Script | Purpose | Delegates to | Run command |
|--------|---------|--------------|-------------|
| `regenerate_scripts.py` | Generates `games/run_<game>.sh` launcher wrappers from `_run_template.sh` + registry | `src.core.registry` | `python3 games/scripts/regenerate_scripts.py` |
| `ensure_agents_md.py` | Creates missing per-game `AGENTS.md` stubs | `src.core.registry` | `python3 games/scripts/ensure_agents_md.py` |
| `generate_test_html.py` | Generates per-game browser test harness pages | `src.core.registry` | `python3 games/scripts/generate_test_html.py` |
| `generate_matrix.py` | Prints a Markdown matrix of shared JS modules referenced by each game's `index.html` | `src.core.registry` | `python3 games/scripts/generate_matrix.py` |
| `audit_docs.py` | Prints README/AGENTS.md completeness audit across `games/` (read-only) | — | `python3 games/scripts/audit_docs.py` |
| `fix_docs.py` | Creates missing README/AGENTS.md stubs for games and infra dirs | — | `python3 games/scripts/fix_docs.py` |
| `update_tests.py` | Writes per-game test counts into game `AGENTS.md`/`README.md` | — | `python3 games/scripts/update_tests.py` |

`_run_template.sh` is a template consumed by `regenerate_scripts.py`, not run
directly.
