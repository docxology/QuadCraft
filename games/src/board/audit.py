"""
games.src.board.audit — Detect board files using local method copies vs shared BaseBoard.

Reports which games have migrated to extending BaseBoard and which still
duplicate shared methods locally. Useful for tracking migration progress.
"""

import os
import re
from pathlib import Path
from typing import NamedTuple
from ..core.config import GAMES_DIR


class AuditResult(NamedTuple):
    """Result for a single game's board audit."""
    game_key: str
    board_file: str
    extends_base_board: bool
    local_methods: list  # methods that should be inherited
    missing_import: bool  # True if BaseBoard is not imported


# Methods that BaseBoard provides — any game still implementing these locally
# is duplicating shared code.
SHARED_METHODS = [
    '_verifyIntegrity',
    'key(',             # key(a, b, c, d)
    'parseKey(',        # parseKey(k)
    'getNeighbors(',    # getNeighbors(q)
    'manhattanDistance(',
    'euclideanDistance(',
    'quadrayDistance(',
    'angleBetween(',
    'inBounds(',
]

# The require preamble pattern
REQUIRE_PREAMBLE = re.compile(
    r"if\s*\(\s*typeof\s+(Quadray|GridUtils|SYNERGETICS)\s*===\s*'undefined'"
)


class BoardAudit:
    """Audit game board files for BaseBoard migration status."""

    def __init__(self, games_dir: str | Path | None = None):
        if games_dir is None:
            games_dir = GAMES_DIR
        self.games_dir = Path(games_dir)

    def scan_game(self, game_dir: Path) -> AuditResult | None:
        """Check if a game's board file extends BaseBoard or duplicates methods."""
        js_dir = game_dir / 'js'
        if not js_dir.is_dir():
            return None

        board_files = list(js_dir.glob('*_board.js'))
        if not board_files:
            return None

        board_file = board_files[0]
        content = board_file.read_text(encoding='utf-8', errors='replace')

        # Check for extends BaseBoard
        extends = bool(re.search(r'class\s+\w+\s+extends\s+BaseBoard', content))

        # Check for local require preamble (should be removed if extending)
        has_local_require = bool(REQUIRE_PREAMBLE.search(content))

        # Find locally-defined shared methods
        local_methods = []
        for method_sig in SHARED_METHODS:
            # Match method definition (not just usage)
            pattern = re.escape(method_sig)
            if re.search(rf'^\s+{pattern}', content, re.MULTILINE):
                local_methods.append(method_sig.rstrip('('))

        game_key = game_dir.name.replace('4d_', '')

        return AuditResult(
            game_key=game_key,
            board_file=str(board_file.relative_to(self.games_dir)),
            extends_base_board=extends,
            local_methods=local_methods,
            missing_import=not extends and not has_local_require,
        )

    def scan_all(self) -> list[AuditResult]:
        """Scan all game directories for migration status."""
        results = []
        for d in sorted(self.games_dir.iterdir()):
            if not d.is_dir() or not d.name.startswith('4d_'):
                continue
            if d.name == '4d_generic':
                continue  # shared modules, not a game
            result = self.scan_game(d)
            if result:
                results.append(result)
        return results

    def migration_report(self) -> str:
        """Generate a markdown report of migration status."""
        results = self.scan_all()
        if not results:
            return "No game board files found."

        migrated = [r for r in results if r.extends_base_board]
        pending = [r for r in results if not r.extends_base_board]

        lines = [
            "# BaseBoard Migration Report",
            "",
            f"**Migrated:** {len(migrated)}/{len(results)} games",
            f"**Pending:**  {len(pending)}/{len(results)} games",
            "",
        ]

        if migrated:
            lines.append("## ✅ Migrated")
            lines.append("")
            for r in migrated:
                extras = f" (⚠ {len(r.local_methods)} overridden)" if r.local_methods else ""
                lines.append(f"- `{r.game_key}`{extras}")
            lines.append("")

        if pending:
            lines.append("## ⏳ Pending Migration")
            lines.append("")
            lines.append("| Game | Board File | Local Methods |")
            lines.append("|------|-----------|---------------|")
            for r in pending:
                methods = ', '.join(r.local_methods) if r.local_methods else '—'
                lines.append(f"| `{r.game_key}` | `{r.board_file}` | {methods} |")
            lines.append("")

        # Summary of most-duplicated methods
        method_counts: dict[str, int] = {}
        for r in pending:
            for m in r.local_methods:
                method_counts[m] = method_counts.get(m, 0) + 1

        if method_counts:
            lines.append("## Most Duplicated Methods")
            lines.append("")
            for m, count in sorted(method_counts.items(), key=lambda x: -x[1]):
                lines.append(f"- `{m}` — {count} games")

        return '\n'.join(lines)


if __name__ == '__main__':
    audit = BoardAudit()
    print(audit.migration_report())
