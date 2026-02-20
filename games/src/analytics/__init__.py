"""
games.src.analytics — Game analytics, health checks, and reporting.

Provides tools to scan all game directories, collect metrics
(file counts, JS patterns, shared module usage), and generate
health reports for the entire QuadCraft games suite.

Usage:
    from games.src.analytics import GameAnalytics
    report = GameAnalytics().full_report()
    print(report.summary())
"""

import json
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from ..core.config import GAMES_DIR, GENERIC_DIR, SHARED_MODULES, ALL_SHARED_MODULES, REQUIRED_FILES

logger = logging.getLogger(__name__)


# ─── Data Classes ────────────────────────────────────────────────────────────

@dataclass
class GameMetrics:
    """Metrics for a single game directory."""
    key: str
    name: str
    dir_path: str
    js_files: int = 0
    total_js_lines: int = 0
    has_board: bool = False
    has_renderer: bool = False
    has_game_controller: bool = False
    has_game_loop: bool = False
    has_input_controller: bool = False
    shared_modules_used: List[str] = field(default_factory=list)
    missing_files: List[str] = field(default_factory=list)
    issues: List[str] = field(default_factory=list)

    @property
    def health_score(self) -> float:
        """0.0–1.0 health score based on completeness."""
        checks = [
            self.has_board,
            self.has_renderer,
            self.has_game_controller,
            self.has_game_loop,
            self.has_input_controller,
            len(self.missing_files) == 0,
            self.js_files >= 3,
        ]
        return sum(checks) / len(checks)


@dataclass
class SuiteReport:
    """Aggregate report for all games."""
    games: List[GameMetrics] = field(default_factory=list)
    shared_module_count: int = 0
    total_js_files: int = 0
    total_js_lines: int = 0

    def summary(self) -> str:
        """Human-readable summary string."""
        lines = [
            "╔════════════════════════════════════════════╗",
            "║   QuadCraft Game Suite Health Report       ║",
            "╚════════════════════════════════════════════╝",
            "",
            f"Games scanned: {len(self.games)}",
            f"Shared modules: {self.shared_module_count}",
            f"Total JS files: {self.total_js_files}",
            f"Total JS lines: {self.total_js_lines}",
            "",
            f"{'Game':<25s} {'Health':>7s} {'JS':>4s} {'Lines':>6s} {'Issues':>7s}",
            "─" * 55,
        ]
        for g in sorted(self.games, key=lambda x: x.key):
            health_pct = f"{g.health_score * 100:.0f}%"
            icon = "✅" if g.health_score >= 0.85 else "⚠️" if g.health_score >= 0.5 else "❌"
            lines.append(
                f"{icon} {g.key:<23s} {health_pct:>6s} {g.js_files:>4d} {g.total_js_lines:>6d} {len(g.issues):>7d}"
            )
        return '\n'.join(lines)

    def to_json(self) -> str:
        """Serialize to JSON."""
        return json.dumps({
            "game_count": len(self.games),
            "shared_modules": self.shared_module_count,
            "total_js_files": self.total_js_files,
            "total_js_lines": self.total_js_lines,
            "games": [
                {
                    "key": g.key,
                    "health": round(g.health_score, 3),
                    "js_files": g.js_files,
                    "js_lines": g.total_js_lines,
                    "issues": g.issues,
                }
                for g in self.games
            ],
        }, indent=2)


# ─── Analytics Engine ────────────────────────────────────────────────────────

class GameAnalytics:
    """Scans game directories and computes health metrics."""

    def __init__(self, games_dir: str = None, generic_dir: str = None):
        self.games_dir = Path(games_dir or GAMES_DIR)
        self.generic_dir = Path(generic_dir or GENERIC_DIR)
        logger.info("[Analytics] Initialized: games=%s", self.games_dir)

    def scan_game(self, game_dir: Path) -> GameMetrics:
        """Analyze a single game directory."""
        key = game_dir.name.replace("4d_", "")
        m = GameMetrics(key=key, name=key.replace("_", " ").title(), dir_path=str(game_dir))

        # Check required files
        for f in REQUIRED_FILES:
            if not (game_dir / f).exists():
                m.missing_files.append(f)
                m.issues.append(f"Missing: {f}")

        # Scan JS files
        js_dir = game_dir / "js"
        if js_dir.is_dir():
            for js_file in js_dir.glob("*.js"):
                m.js_files += 1
                try:
                    lines = js_file.read_text().splitlines()
                    m.total_js_lines += len(lines)
                    content = js_file.read_text()

                    if "Board" in content and "class " in content:
                        m.has_board = True
                    if "Renderer" in content and "class " in content:
                        m.has_renderer = True
                    if "class " in content and "Game" in content:
                        m.has_game_controller = True
                    if "GameLoop" in content or "requestAnimationFrame" in content:
                        m.has_game_loop = True
                    if "InputController" in content or "addEventListener('keydown'" in content:
                        m.has_input_controller = True
                except Exception as e:
                    m.issues.append(f"Error reading {js_file.name}: {e}")

        # Check HTML for shared module imports
        index_html = game_dir / "index.html"
        if index_html.exists():
            try:
                html_content = index_html.read_text()
                for mod in SHARED_MODULES:
                    if mod in html_content:
                        m.shared_modules_used.append(mod)
            except Exception:
                pass

        if not m.has_game_loop:
            m.issues.append("Missing GameLoop integration")
        if not m.has_input_controller:
            m.issues.append("Missing InputController integration")

        logger.debug("[Analytics] Scanned %s: health=%.2f", key, m.health_score)
        return m

    def full_report(self) -> SuiteReport:
        """Scan all game directories and produce a suite report."""
        report = SuiteReport()

        # Count shared modules (JS + CSS)
        if self.generic_dir.is_dir():
            report.shared_module_count = sum(
                1 for f in self.generic_dir.iterdir()
                if f.suffix in ('.js', '.css')
            )

        # Scan each 4d_* directory
        for d in sorted(self.games_dir.iterdir()):
            if d.is_dir() and d.name.startswith("4d_") and d.name != "4d_generic":
                metrics = self.scan_game(d)
                report.games.append(metrics)
                report.total_js_files += metrics.js_files
                report.total_js_lines += metrics.total_js_lines

        logger.info("[Analytics] Full report: %d games scanned", len(report.games))
        return report
