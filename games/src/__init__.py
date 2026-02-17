"""
games.src — Core logic for QuadCraft Games Launcher.

Provides game registry, HTTP serving, test running, validation,
scaffold generation, analytics reporting, and shared module registry.
"""

from .config import (
    REPO_ROOT, GAMES_DIR, GENERIC_DIR,
    BASE_PORT, SHARED_MODULES, REQUIRED_FILES,
    REQUIRED_JS_PATTERNS, LOG_PREFIX,
)
from .registry import GAMES, load_config
from .launcher import GameServer
from .testing import run_tests
from .validation import validate_game
from .scaffold import GameScaffold
from .analytics import GameAnalytics, SuiteReport, GameMetrics
from .shared import ModuleRegistry, JSModule, resolve_module_path
from .space import Quadray, IVM, SYNERGETICS, quadray_to_xyz, xyz_to_quadray

__all__ = [
    # Config
    "REPO_ROOT", "GAMES_DIR", "GENERIC_DIR",
    "BASE_PORT", "SHARED_MODULES", "REQUIRED_FILES",
    "REQUIRED_JS_PATTERNS", "LOG_PREFIX",
    # Registry
    "GAMES", "load_config",
    # Launcher
    "GameServer",
    # Testing
    "run_tests",
    # Validation
    "validate_game",
    # Scaffold
    "GameScaffold",
    # Analytics
    "GameAnalytics", "SuiteReport", "GameMetrics",
    # Shared module registry
    "ModuleRegistry", "JSModule", "resolve_module_path",
    # Space (Quadray / IVM / XYZ)
    "Quadray", "IVM", "SYNERGETICS",
    "quadray_to_xyz", "xyz_to_quadray",
]

