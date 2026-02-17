# 4D Generic — Shared Module Library

## Overview

`4d_generic/` is the **shared foundation** for all QuadCraft games. It contains the canonical copies of all shared JavaScript modules. All 22 games import these via `<script src="../4d_generic/...">` tags.

> **Not a playable game** — this is a library directory.

## Quick Start

```bash
# Run shared module tests
node games/4d_generic/tests/test_quadray.js
node games/4d_generic/tests/test_synergetics.js

# Run all shared tests (from games/)
node tests/test_all_shared.js
```

## Documentation

- **Agent Instructions**: [AGENTS.md](AGENTS.md) — Module inventory and code standards
- **Game Index**: [GAMES_INDEX.md](../GAMES_INDEX.md) — Full portfolio of all QuadCraft games
