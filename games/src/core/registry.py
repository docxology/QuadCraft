"""
games.src.registry — Central game registry and config loading.

Maps short game keys (e.g. 'chess') to directory names, display names,
and port offsets for all 22 QuadCraft games. Used by launcher, testing,
validation, and analytics modules.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Union

logger = logging.getLogger(__name__)
GAMES: Dict[str, Dict[str, Union[str, int]]] = {
    "chess":         {"dir": "4d_chess",         "name": "4D Chess",         "port_offset": 0},
    "checkers":      {"dir": "4d_checkers",      "name": "4D Checkers",      "port_offset": 1},
    "reversi":       {"dir": "4d_reversi",       "name": "4D Reversi",       "port_offset": 2},
    "life":          {"dir": "4d_life",          "name": "4D Life",          "port_offset": 3},
    "asteroids":     {"dir": "4d_asteroids",     "name": "4D Asteroids",     "port_offset": 4},
    "simant":        {"dir": "4d_simant",        "name": "4D SimAnt",        "port_offset": 5},
    "backgammon":    {"dir": "4d_backgammon",    "name": "4D Backgammon",    "port_offset": 6},
    "minecraft":     {"dir": "4d_minecraft",     "name": "4D Minecraft",     "port_offset": 7},
    "catan":         {"dir": "4d_catan",         "name": "4D Catan",         "port_offset": 8},
    "tower_defense": {"dir": "4d_tower_defense", "name": "4D Tower Defense", "port_offset": 9},
    "doom":          {"dir": "4d_doom",          "name": "4D Doom",          "port_offset": 10},
    "mahjong":       {"dir": "4d_mahjong",       "name": "4D Mahjong",       "port_offset": 11},
    # ── Wave 2: Classic Games ──────────────────────────────────────────────
    "tetris":        {"dir": "4d_tetris",        "name": "4D Tetris",        "port_offset": 12},
    "snake":         {"dir": "4d_snake",         "name": "4D Snake",         "port_offset": 13},
    "pong":          {"dir": "4d_pong",          "name": "4D Pong",          "port_offset": 14},
    "breakout":      {"dir": "4d_breakout",      "name": "4D Breakout",      "port_offset": 15},
    "pacman":        {"dir": "4d_pacman",        "name": "4D Pac-Man",       "port_offset": 16},
    "space_invaders":{"dir": "4d_space_invaders","name": "4D Space Invaders","port_offset": 17},
    "frogger":       {"dir": "4d_frogger",       "name": "4D Frogger",       "port_offset": 18},
    "bomberman":     {"dir": "4d_bomberman",     "name": "4D Bomberman",     "port_offset": 19},
    "connect_four":  {"dir": "4d_connect_four",  "name": "4D Connect Four",  "port_offset": 20},
    "minesweeper":   {"dir": "4d_minesweeper",   "name": "4D Minesweeper",   "port_offset": 21},
}

logger.debug("[Registry] Loaded %d games", len(GAMES))


def load_config(config_path: str) -> Dict[str, Any]:
    """Load game selection from a JSON config file.

    Expected format:
        {"games": ["chess", "doom"], "base_port": 8100, "open_browser": true}
    """
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(path) as f:
        data = json.load(f)
    logger.info("[Registry] Loaded config from %s: %d game(s)", path.name, len(data.get("games", [])))
    return data


def get_port(game_key: str, base_port: int | None = None) -> int:
    """Compute the HTTP port for a game. Uses config.BASE_PORT if base_port is None."""
    if base_port is None:
        from .config import BASE_PORT
        base_port = BASE_PORT
    return base_port + GAMES[game_key]["port_offset"]
