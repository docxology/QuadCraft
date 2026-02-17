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

# ─── Networking ─────────────────────────────────────────────────────────────
BASE_PORT = 8400

# ─── Shared JS modules (from 4d_generic) ────────────────────────────────────
SHARED_MODULES = [
    "quadray.js",
    "camera.js",
    "projection.js",
    "zoom.js",
    "synergetics.js",
    "input_controller.js",
    "game_loop.js",
    "hud.js",
    "score_manager.js",
    "grid_utils.js",
    "base_renderer.js",
    "base_game.js",
]

# ─── Required files per game directory ──────────────────────────────────────
REQUIRED_FILES = [
    "index.html",
    "run.sh",
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
