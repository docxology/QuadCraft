# Scripts — Agent Instructions

## Overview

This directory contains **maintenance and code generation scripts** for the QuadCraft game portfolio. These tools handle shell script generation, documentation enforcement, and test HTML creation.

## File Inventory

| File | Purpose |
|------|---------|
| `_run_template.sh` | Shell script template used by `regenerate_scripts.py` to create per-game `run.sh` files |
| `regenerate_scripts.py` | Generates/refreshes `run.sh` for all games from the template + registry |
| `ensure_agents_md.py` | Ensures every game directory has an `AGENTS.md` file (creates stubs if missing) |
| `generate_test_html.py` | Generates `tests/test.html` browser test harnesses for each game |
| `audit_docs.py` | Audits documentation completeness across all game directories |
| `fix_docs.py` | Auto-fixes common documentation issues (missing sections, stale counts) |

## Usage

```bash
# Regenerate all run.sh scripts from template
python3 scripts/regenerate_scripts.py

# Ensure all games have AGENTS.md
python3 scripts/ensure_agents_md.py

# Generate browser test HTML pages
python3 scripts/generate_test_html.py

# Audit documentation completeness
python3 scripts/audit_docs.py
```
