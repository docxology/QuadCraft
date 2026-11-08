# Heuristic board catalog, audit and textual migration

`audit.py` provides `BoardAudit`/`AuditResult` for detected BaseBoard inheritance and local method names. `catalog.py` provides `BoardCatalog`/`BoardInfo` for one board file per game directory, methods and heuristic pattern classification. These are text scans, not complete JavaScript analysis or mandates to remove overrides.

Pass the actual games root explicitly. See [Python interfaces](../../doc/python_infrastructure.md) for signatures and migration limitations: `migrate.py` can add require/extends/super text but its CLI root is currently wrong and it does not reconcile gameplay/storage/reset semantics.
