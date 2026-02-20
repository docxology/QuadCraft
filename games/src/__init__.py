"""
games.src — Core logic for QuadCraft Games Launcher.

Provides game registry, HTTP serving, test running, validation,
scaffold generation, analytics reporting, board analysis,
shared module registry, and Quadray/IVM space math.
"""

from .core.config import (
    REPO_ROOT, GAMES_DIR, GENERIC_DIR, SHARED_DIR_NAME,
    BASE_PORT, SHARED_MODULES, OPTIONAL_SHARED_MODULES,
    ALL_SHARED_MODULES, REQUIRED_FILES,
    REQUIRED_JS_PATTERNS, LOG_PREFIX,
)
from .core.registry import GAMES, load_config, get_port
from .server.launcher import GameServer
from .qa.testing import run_tests
from .qa.validation import validate_game, audit_all
from .scaffold import GameScaffold
from .analytics import GameAnalytics, SuiteReport, GameMetrics
from .shared import ModuleRegistry, JSModule, resolve_module_path
from .board import BoardAudit, AuditResult, BoardCatalog, BoardInfo
from .space import (
    Quadray, IVM, SYNERGETICS,
    quadray_to_xyz, xyz_to_quadray,
    project_quadray, rotate_xyz, ScreenPoint, project_basis_axes,
    IVMGrid, Jitterbug,
    angle_between, distance, manhattan_4d, euclidean_4d,
    verify_round_trip, verify_geometric_identities,
    CheckResult, VerificationReport,
    generate_grid, neighbors_8, bounded_neighbors,
    in_bounds, depth_sort, random_coord,
)

__all__ = [
    # Config
    "REPO_ROOT", "GAMES_DIR", "GENERIC_DIR", "SHARED_DIR_NAME",
    "BASE_PORT", "SHARED_MODULES", "OPTIONAL_SHARED_MODULES",
    "ALL_SHARED_MODULES", "REQUIRED_FILES",
    "REQUIRED_JS_PATTERNS", "LOG_PREFIX",
    # Registry
    "GAMES", "load_config", "get_port",
    # Launcher
    "GameServer",
    # Testing
    "run_tests",
    # Validation
    "validate_game", "audit_all",
    # Scaffold
    "GameScaffold",
    # Analytics
    "GameAnalytics", "SuiteReport", "GameMetrics",
    # Shared module registry
    "ModuleRegistry", "JSModule", "resolve_module_path",
    # Board tools
    "BoardAudit", "AuditResult", "BoardCatalog", "BoardInfo",
    # Space — Quadray / IVM / XYZ
    "Quadray", "IVM", "SYNERGETICS",
    "quadray_to_xyz", "xyz_to_quadray",
    "project_quadray", "rotate_xyz", "ScreenPoint", "project_basis_axes",
    "IVMGrid", "Jitterbug",
    # Space — Geometry
    "angle_between", "distance", "manhattan_4d", "euclidean_4d",
    "verify_round_trip", "verify_geometric_identities",
    "CheckResult", "VerificationReport",
    "generate_grid", "neighbors_8", "bounded_neighbors",
    "in_bounds", "depth_sort", "random_coord",
]
