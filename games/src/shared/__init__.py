"""
games.src.shared — Shared constants, utilities, and JS module registry.

Centralizes metadata about all shared JavaScript modules in 4d_generic/,
provides utility functions for path resolution and module dependency checks,
and defines the canonical module load order.

Usage:
    from games.src.shared import ModuleRegistry, resolve_module_path
    registry = ModuleRegistry()
    for mod in registry.load_order():
        print(mod.name, mod.path)
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from ..core.config import GENERIC_DIR, SHARED_MODULES

logger = logging.getLogger(__name__)


# ─── Module metadata ────────────────────────────────────────────────────────

@dataclass
class JSModule:
    """Metadata for a shared JavaScript module."""
    name: str
    filename: str
    category: str
    description: str
    depends_on: List[str] = field(default_factory=list)

    @property
    def path(self) -> Path:
        return Path(GENERIC_DIR) / self.filename

    @property
    def exists(self) -> bool:
        return self.path.exists()

    @property
    def subfolder(self) -> Optional[str]:
        """Returns 'js' if in js/ subfolder, else None."""
        if not self.exists:
            js_path = Path(GENERIC_DIR) / "js" / self.filename
            if js_path.exists():
                return "js"
        return None


# ─── Module registry ────────────────────────────────────────────────────────

# Canonical module definitions with dependency ordering
_MODULE_DEFS = [
    JSModule("Quadray", "quadray.js", "math",
             "4D Quadray coordinate system (a,b,c,d) with arithmetic operations.",
             depends_on=[]),
    JSModule("Camera", "camera.js", "rendering",
             "Shift-drag camera controller for 3D/4D scene rotation.",
             depends_on=[]),
    JSModule("Projection", "projection.js", "rendering",
             "Quadray → screen-space projection with perspective divide.",
             depends_on=["quadray.js"]),
    JSModule("Zoom", "zoom.js", "rendering",
             "Mouse wheel zoom handler with min/max clamping.",
             depends_on=[]),
    JSModule("Synergetics", "synergetics.js", "math",
             "IVM constants: tetra/octa/icosa volume ratios, Jitterbug, D/R coords.",
             depends_on=["quadray.js"]),
    JSModule("InputController", "input_controller.js", "input",
             "Unified keyboard input: event-driven bindings + polled isDown() state.",
             depends_on=[]),
    JSModule("GameLoop", "game_loop.js", "engine",
             "Fixed-timestep game loop with pause/stop/start lifecycle.",
             depends_on=[]),
    JSModule("HUD", "hud.js", "ui",
             "Color-coded HUD state manager for game status display.",
             depends_on=[]),
    JSModule("ScoreManager", "score_manager.js", "engine",
             "Score/level/lives tracker with localStorage high-score persistence.",
             depends_on=[]),
    JSModule("GridUtils", "grid_utils.js", "math",
             "IVM grid generation, neighbors, bounds, distance, depth sort, shuffle.",
             depends_on=[]),
    JSModule("BaseRenderer", "base_renderer.js", "rendering",
             "Base renderer class with Quadray projection, axis drawing, shape primitives.",
             depends_on=["quadray.js", "projection.js"]),
    JSModule("BaseGame", "base_game.js", "engine",
             "Base game controller with auto-setup for GameLoop, InputController, camera.",
             depends_on=["game_loop.js", "input_controller.js"]),
    # ── Extended Modules (available but not required by all games) ────────
    JSModule("BaseBoard", "base_board.js", "engine",
             "Grid operations, distances, integrity checks, metadata for board games.",
             depends_on=["grid_utils.js"]),
    JSModule("EntitySystem", "entity_system.js", "engine",
             "QuadrayEntity + EntityManager with collision detection and wrapping.",
             depends_on=["quadray.js"]),
    JSModule("TurnManager", "turn_manager.js", "engine",
             "Player rotation, undo/redo stack for turn-based games.",
             depends_on=[]),
    JSModule("Pathfinding", "pathfinding.js", "engine",
             "QuadrayPathfinder with BFS, A*, flood fill, and line-of-sight.",
             depends_on=["grid_utils.js"]),
]


class ModuleRegistry:
    """Registry of all shared JavaScript modules with dependency ordering."""

    def __init__(self):
        self._modules = {m.filename: m for m in _MODULE_DEFS}
        logger.info("[ModuleRegistry] Loaded %d module definitions", len(self._modules))

    def get(self, filename: str) -> Optional[JSModule]:
        """Get module metadata by filename."""
        return self._modules.get(filename)

    def all_modules(self) -> List[JSModule]:
        """All registered modules."""
        return list(self._modules.values())

    def by_category(self, category: str) -> List[JSModule]:
        """Filter modules by category (math, rendering, input, engine, ui)."""
        return [m for m in self._modules.values() if m.category == category]

    def categories(self) -> List[str]:
        """All distinct categories."""
        return sorted(set(m.category for m in self._modules.values()))

    def load_order(self) -> List[JSModule]:
        """Modules in dependency-safe load order (topological sort)."""
        visited = set()
        order = []

        def visit(filename):
            if filename in visited:
                return
            visited.add(filename)
            mod = self._modules.get(filename)
            if mod:
                for dep in mod.depends_on:
                    visit(dep)
                order.append(mod)

        for filename in self._modules:
            visit(filename)

        return order

    def missing_modules(self) -> List[JSModule]:
        """Modules defined but not present on disk."""
        return [m for m in self._modules.values() if not m.exists]

    def coverage_report(self) -> str:
        """Report on module presence and categories."""
        lines = ["Module Coverage Report", "─" * 50]
        for cat in self.categories():
            mods = self.by_category(cat)
            lines.append(f"\n  [{cat.upper()}]")
            for m in mods:
                icon = "✅" if m.exists else "❌"
                lines.append(f"    {icon} {m.name} ({m.filename})")
        present = sum(1 for m in self._modules.values() if m.exists)
        total = len(self._modules)
        lines.append(f"\nCoverage: {present}/{total} ({present/total*100:.0f}%)")
        return '\n'.join(lines)


def resolve_module_path(filename: str) -> Optional[Path]:
    """Resolve a shared module filename to its absolute path."""
    p = Path(GENERIC_DIR) / filename
    if p.exists():
        return p
    # Check js/ subfolder
    p2 = Path(GENERIC_DIR) / "js" / filename
    if p2.exists():
        return p2
    return None
