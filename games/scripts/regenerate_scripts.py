#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add parent directory to path to import from src
game_root = str(Path(__file__).resolve().parent.parent)
if game_root not in sys.path:
    sys.path.insert(0, game_root)

from src.core.registry import GAMES

TEMPLATE_FILE = "games/scripts/_run_template.sh"

BASE_PORT = 8100

def main():
    if not os.path.exists(TEMPLATE_FILE):
        print(f"❌ Template file not found: {TEMPLATE_FILE}")
        return

    with open(TEMPLATE_FILE, "r") as f:
        template = f.read()

    for key, meta in GAMES.items():
        port = BASE_PORT + meta["port_offset"]
        content = template.replace("GAMENAME", key) \
                          .replace("DISPLAYNAME", meta["name"]) \
                          .replace("GAMEDIR", meta["dir"]) \
                          .replace("DEFAULTPORT", str(port))
        
        filename = f"games/run_{key}.sh"
        with open(filename, "w") as f:
            f.write(content)
        
        os.chmod(filename, 0o755)
        print(f"✅ Generated {filename}")

if __name__ == "__main__":
    main()
