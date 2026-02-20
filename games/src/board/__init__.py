"""
games.src.board — Board analysis, cataloging, and migration tools.

Provides:
    BoardAudit     — Detect games using local methods vs shared BaseBoard
    BoardCatalog   — Catalog all board classes, patterns, and methods
    BoardMigrator  — Migrate game boards to extend BaseBoard

Usage:
    from games.src.board import BoardAudit, BoardCatalog
    catalog = BoardCatalog()
    print(catalog.summary_report())
"""

from .audit import BoardAudit, AuditResult
from .catalog import BoardCatalog, BoardInfo
from .migrate import (
    add_baseboard_script,
    add_baseboard_require,
    add_extends,
    add_super_call,
    migrate_board,
)

__all__ = [
    "BoardAudit", "AuditResult",
    "BoardCatalog", "BoardInfo",
    "add_baseboard_script", "add_baseboard_require",
    "add_extends", "add_super_call", "migrate_board",
]
