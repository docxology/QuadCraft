"""
games.src.config — Shared constants for QuadCraft Games infrastructure.

Centralises ports, paths, shared module names, and required file lists
so launcher, testing, and validation modules stay DRY.
"""

import os

# ─── Paths ──────────────────────────────────────────────────────────────────
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GAMES_DIR = os.path.join(REPO_ROOT, "games")
GENERIC_DIR = os.path.join(GAMES_DIR, "4d_generic")
SHARED_DIR_NAME = "4d_generic"

# ─── Networking ─────────────────────────────────────────────────────────────
BASE_PORT = 8100

# ─── Shared JS modules (from 4d_generic) ────────────────────────────────────
# Core 12 — used by every game (except Doom ES-module variant)
SHARED_MODULES = [
    "quadray.js",
    "synergetics.js",
    "grid_utils.js",
    "camera.js",
    "projection.js",
    "zoom.js",
    "base_renderer.js",
    "game_loop.js",
    "base_game.js",
    "score_manager.js",
    "input_controller.js",
    "hud.js",
]

# Extended 4 — available for adoption but not universally imported
OPTIONAL_SHARED_MODULES = [
    "base_board.js",
    "entity_system.js",
    "turn_manager.js",
    "pathfinding.js",
]

# Combined for validation / discovery
ALL_SHARED_MODULES = SHARED_MODULES + OPTIONAL_SHARED_MODULES

# ─── Required files per game directory ──────────────────────────────────────
REQUIRED_FILES = [
    "index.html",
    "AGENTS.md",
]

# ─── Required JS structure per game ────────────────────────────────────────
REQUIRED_JS_PATTERNS = {
    "board":    "{game}_board.js",
    "renderer": "{game}_renderer.js",
    "game":     "{game}_game.js",
}

# ─── Logging ────────────────────────────────────────────────────────────────
LOG_PREFIX = "[QuadCraft]"

