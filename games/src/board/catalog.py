"""
games.src.board.catalog — Catalog all game board classes, patterns, and methods.

Parses all *_board.js files to build a structured inventory of game board
classes, their game-type pattern (turn-based, real-time, sandbox), and
method inventories. Useful for identifying further extraction opportunities.
"""

import os
import re
from pathlib import Path
from typing import NamedTuple
from ..core.config import GAMES_DIR


class BoardInfo(NamedTuple):
    """Metadata for a single game board class."""
    game_key: str
    class_name: str
    board_file: str
    line_count: int
    methods: list  # list of method names
    pattern: str   # 'turn-based', 'real-time', 'sandbox', 'unknown'
    extends_base: bool
    has_entity_system: bool
    has_turn_manager: bool


# Heuristics for detecting game patterns
TURN_BASED_SIGNALS = ['currentPlayer', 'getValidMoves', 'executeMove', 'place(']
REAL_TIME_SIGNALS = ['step(', 'vel', 'distTo', 'collidesWith', 'update(dt']
SANDBOX_SIGNALS = ['seedRandom', 'generation', 'countNeighbors']


class BoardCatalog:
    """Catalog all game board JS files in the games directory."""

    def __init__(self, games_dir: str | Path | None = None):
        if games_dir is None:
            games_dir = GAMES_DIR
        self.games_dir = Path(games_dir)

    def _detect_pattern(self, content: str) -> str:
        """Heuristically detect whether a game is turn-based, real-time, or sandbox."""
        turn_hits = sum(1 for s in TURN_BASED_SIGNALS if s in content)
        rt_hits = sum(1 for s in REAL_TIME_SIGNALS if s in content)
        sb_hits = sum(1 for s in SANDBOX_SIGNALS if s in content)

        if sb_hits >= 2:
            return 'sandbox'
        if turn_hits >= 2:
            return 'turn-based'
        if rt_hits >= 2:
            return 'real-time'
        if turn_hits > rt_hits:
            return 'turn-based'
        if rt_hits > turn_hits:
            return 'real-time'
        return 'unknown'

    def _extract_methods(self, content: str, class_name: str) -> list[str]:
        """Extract method names from a class definition."""
        methods = []
        # Match method declarations: name(args) { or name(args) =>
        pattern = re.compile(
            rf'^\s+(?:static\s+)?(?:async\s+)?(\w+)\s*\(',
            re.MULTILINE
        )
        for match in pattern.finditer(content):
            name = match.group(1)
            if name not in ('constructor', 'if', 'for', 'while', 'switch', 'return', 'const', 'let', 'var'):
                methods.append(name)
        return sorted(set(methods))

    def _extract_class_name(self, content: str) -> str:
        """Extract the board class name."""
        match = re.search(r'class\s+(\w+Board\w*)', content)
        return match.group(1) if match else 'Unknown'

    def scan_game(self, game_dir: Path) -> BoardInfo | None:
        """Parse a game's board file and return structured info."""
        js_dir = game_dir / 'js'
        if not js_dir.is_dir():
            return None

        board_files = list(js_dir.glob('*_board.js')) + list(js_dir.glob('td_board.js'))
        board_files = list(set(board_files))
        if not board_files:
            return None

        board_file = board_files[0]
        content = board_file.read_text(encoding='utf-8', errors='replace')
        line_count = content.count('\n') + 1

        class_name = self._extract_class_name(content)
        methods = self._extract_methods(content, class_name)
        pattern = self._detect_pattern(content)
        extends_base = bool(re.search(r'extends\s+BaseBoard', content))
        has_entity = 'EntityManager' in content or 'QuadrayEntity' in content
        has_turns = 'TurnManager' in content

        game_key = game_dir.name.replace('4d_', '')

        return BoardInfo(
            game_key=game_key,
            class_name=class_name,
            board_file=str(board_file.relative_to(self.games_dir)),
            line_count=line_count,
            methods=methods,
            pattern=pattern,
            extends_base=extends_base,
            has_entity_system=has_entity,
            has_turn_manager=has_turns,
        )

    def scan_all(self) -> list[BoardInfo]:
        """Scan all game directories."""
        results = []
        for d in sorted(self.games_dir.iterdir()):
            if not d.is_dir() or not d.name.startswith('4d_'):
                continue
            if d.name == '4d_generic':
                continue
            result = self.scan_game(d)
            if result:
                results.append(result)
        return results

    def find_shared_methods(self, min_count: int = 3) -> dict[str, list[str]]:
        """Identify methods that appear in min_count+ board files.
        Returns { method_name: [game_keys] }.
        """
        results = self.scan_all()
        method_games: dict[str, list[str]] = {}
        for r in results:
            for m in r.methods:
                method_games.setdefault(m, []).append(r.game_key)

        return {
            m: games for m, games in sorted(method_games.items(), key=lambda x: -len(x[1]))
            if len(games) >= min_count
        }

    def summary_report(self) -> str:
        """Generate a markdown summary of all board classes."""
        results = self.scan_all()
        if not results:
            return "No board files found."

        total_lines = sum(r.line_count for r in results)
        patterns = {}
        for r in results:
            patterns.setdefault(r.pattern, []).append(r.game_key)

        lines = [
            "# Board Catalog",
            "",
            f"**Games:** {len(results)} | **Total lines:** {total_lines:,}",
            "",
            "## By Pattern",
            "",
        ]

        for pat, games in sorted(patterns.items()):
            lines.append(f"### {pat.title()} ({len(games)})")
            for g in games:
                lines.append(f"- `{g}`")
            lines.append("")

        lines.append("## All Boards")
        lines.append("")
        lines.append("| Game | Class | Lines | Pattern | Base | Methods |")
        lines.append("|------|-------|------:|---------|:----:|--------:|")
        for r in results:
            base = '✅' if r.extends_base else '—'
            lines.append(
                f"| `{r.game_key}` | `{r.class_name}` | {r.line_count} | {r.pattern} | {base} | {len(r.methods)} |"
            )
        lines.append("")

        # Shared methods
        shared = self.find_shared_methods(3)
        if shared:
            lines.append("## Shared Methods (3+ games)")
            lines.append("")
            lines.append("| Method | Count | Games |")
            lines.append("|--------|------:|-------|")
            for m, games in list(shared.items())[:20]:
                game_str = ', '.join(games[:5])
                if len(games) > 5:
                    game_str += f' +{len(games) - 5}'
                lines.append(f"| `{m}` | {len(games)} | {game_str} |")

        return '\n'.join(lines)


if __name__ == '__main__':
    catalog = BoardCatalog()
    print(catalog.summary_report())
