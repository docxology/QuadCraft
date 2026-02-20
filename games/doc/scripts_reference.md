# Scripts Reference — `scripts/`

> Maintenance and automation scripts for the QuadCraft game portfolio.

---

## Script Inventory

```text
scripts/
├── _run_template.sh           # Shell script template for per-game launchers
├── regenerate_scripts.py      # Generate/update all per-game run.sh files
├── generate_test_html.py      # Generate browser-based test HTML pages
├── ensure_agents_md.py        # Ensure every game has an AGENTS.md
├── audit_docs.py              # Audit documentation completeness
├── fix_docs.py                # Auto-fix common documentation issues
├── AGENTS.md                  # Agent instructions for scripts/
└── README.md                  # Scripts overview
```

---

## Script Details

### `regenerate_scripts.py`

**Purpose:** Generate or update `run.sh` files for all registered games.

```bash
python3 games/scripts/regenerate_scripts.py
```

- Reads the `GAMES` dict from `src/core/registry.py`
- Applies `_run_template.sh` with game-specific substitutions
- Creates `4d_<game>/run.sh` for each registered game
- **When to run:** After adding a new game to the registry

---

### `_run_template.sh`

**Purpose:** Template for per-game `run.sh` scripts.

Provides:

- Game directory detection
- Port configuration (from command-line arg or default)
- Python HTTP server launch serving the parent `games/` directory
- Browser auto-open
- Signal handling for clean shutdown

**Template variables:** `{GAME_DIR}`, `{GAME_NAME}`, `{DEFAULT_PORT}`

---

### `generate_test_html.py`

**Purpose:** Generate HTML test runner pages for browser-based test execution.

```bash
python3 games/scripts/generate_test_html.py
```

- Scans all game directories for `tests/test_*.js` files
- Generates an HTML page that loads and runs tests in the browser
- Useful for debugging tests with browser DevTools

---

### `ensure_agents_md.py`

**Purpose:** Ensure every game directory has an `AGENTS.md` file.

```bash
python3 games/scripts/ensure_agents_md.py
```

- Scans all `4d_*` directories
- Creates `AGENTS.md` from template if missing
- Reports which files were created vs already existed
- **When to run:** After scaffolding new games, as a safety net

---

### `audit_docs.py`

**Purpose:** Check documentation completeness across all game directories.

```bash
python3 games/scripts/audit_docs.py
```

- Verifies presence of `README.md`, `AGENTS.md` in each game
- Checks for empty or stub documentation files
- Reports missing or incomplete docs

---

### `fix_docs.py`

**Purpose:** Auto-fix common documentation issues.

```bash
python3 games/scripts/fix_docs.py
```

- Fixes formatting inconsistencies
- Updates stale references
- Normalizes README structure across games
- **Review changes** after running — not all fixes may be desirable

---

## Workflow Integration

| Scenario | Script to Use |
|----------|--------------|
| Added new game to registry | `regenerate_scripts.py` → `ensure_agents_md.py` |
| Pre-release documentation check | `audit_docs.py` |
| Batch fix doc formatting | `fix_docs.py` |
| Generate browser test page | `generate_test_html.py` |

---

*See also: [contributing.md](contributing.md) · [game_template.md](game_template.md) · [python_infrastructure.md](python_infrastructure.md)*
