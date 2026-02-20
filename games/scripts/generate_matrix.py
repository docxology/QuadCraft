import sys
sys.path.append('.')
from src.core.registry import GAMES
from pathlib import Path

modules = [
    ("quadray.js", "QR"), ("synergetics.js", "SY"), ("grid_utils.js", "GU"),
    ("camera.js", "CA"), ("projection.js", "PR"), ("zoom.js", "ZM"),
    ("base_renderer.js", "BR"), ("game_loop.js", "GL"), ("base_game.js", "BG"),
    ("score_manager.js", "SM"), ("input_controller.js", "IC"), ("hud.js", "HD"),
    ("base_board.js", "bb"), ("entity_system.js", "es"), ("turn_manager.js", "tm"), ("pathfinding.js", "pf")
]

games_dir = Path.cwd()
print("| Game | " + " | ".join([abbr for _, abbr in modules]) + " |")
print("|------|" + "|".join(["----" for _ in modules]) + "|")

for key, meta in GAMES.items():
    name = meta["name"].replace("4D ", "")
    html_path = games_dir / meta["dir"] / "index.html"
    if not html_path.exists(): continue
    html = html_path.read_text()
    
    row = f"| {name} | "
    for mod, abbr in modules:
        used = "●" if f'"{mod}"' in html or f"'{mod}'" in html or mod in html else ("—" if abbr in ("bb","es","tm","pf") else "—")
        row += f"{used} | "
    print(row)
