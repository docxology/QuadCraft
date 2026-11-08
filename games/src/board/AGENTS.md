# Maintaining board source-analysis tools

Inspect `audit.py`, `catalog.py`, `migrate.py` and real board consumers. Read [Python interfaces](../../doc/python_infrastructure.md). BoardAudit/Catalog use explicit games_dir overrides to avoid flawed config defaults; each scans one matching board, and regex results are heuristics.

Local overrides and raw-key storage can be intentional. Do not mechanically delete them based on a migration report. `migrate_board(board_path,dry_run)` adds require/extends/super text; it does not prove constructor, reset or rule compatibility. Its module CLI anchors games under src and is not a safe portfolio-wide apply command. Any source migration requires separate authorization and real behavior review, not documentation-pass execution.
