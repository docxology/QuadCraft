#!/usr/bin/env python3
"""Generate the shared-module usage matrix for all registered games.

Prints a Markdown table showing which shared JS modules each game's
index.html references. Read-only: writes nothing.
"""
import sys
from pathlib import Path

# Add parent directory to path to import from src
game_root = Path(__file__).resolve().parent.parent
if str(game_root) not in sys.path:
    sys.path.insert(0, str(game_root))

from src.core.registry import GAMES

modules = [
    ("quadray.js", "QR"), ("synergetics.js", "SY"), ("grid_utils.js", "GU"),
    ("camera.js", "CA"), ("projection.js", "PR"), ("zoom.js", "ZM"),
    ("base_renderer.js", "BR"), ("game_loop.js", "GL"), ("base_game.js", "BG"),
    ("score_manager.js", "SM"), ("input_controller.js", "IC"), ("hud.js", "HD"),
    ("base_board.js", "bb"), ("entity_system.js", "es"), ("turn_manager.js", "tm"), ("pathfinding.js", "pf")
]

def main():
    print("| Game | " + " | ".join([abbr for _, abbr in modules]) + " |")
    print("|------|" + "|".join(["----" for _ in modules]) + "|")

    for key, meta in GAMES.items():
        name = meta["name"].replace("4D ", "")
        html_path = game_root / meta["dir"] / "index.html"
        if not html_path.exists(): continue
        html = html_path.read_text()

        row = f"| {name} | "
        for mod, abbr in modules:
            used = "●" if f'"{mod}"' in html or f"'{mod}'" in html or mod in html else ("—" if abbr in ("bb","es","tm","pf") else "—")
            row += f"{used} | "
        print(row)


if __name__ == "__main__":
    main()
