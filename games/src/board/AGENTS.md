# Board — Analysis, Cataloging & Migration

## Overview

Board subpackage for analyzing, cataloging, and migrating game board classes.

## Modules

| Module | Export | Description |
|--------|--------|-------------|
| `audit.py` | `BoardAudit` | Detect BaseBoard migration status per game |
| `catalog.py` | `BoardCatalog` | Catalog board classes, patterns, shared methods |
| `migrate.py` | `migrate_board()` | Conservative migration to `extends BaseBoard` |

## Usage

```bash
# Migration report
python3 -c "from games.src.board import BoardAudit; print(BoardAudit().migration_report())"

# Full catalog
python3 -c "from games.src.board import BoardCatalog; print(BoardCatalog().summary_report())"
```
