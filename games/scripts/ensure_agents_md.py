#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add parent directory to path to import from src
game_root = str(Path(__file__).resolve().parent.parent)
if game_root not in sys.path:
    sys.path.insert(0, game_root)

from src.registry import GAMES

# Standard AGENTS.md template
TEMPLATE = """# {name}

## 🤖 Game Overview
**{name}** is a 4D browser game built on the QuadCraft engine. It runs in the browser using [Quadray coordinates](../../docs/mathematics/quadray_coordinates.md) for 4D spatial logic.

## 📂 Architecture
- **Entry Point**: `index.html` (Loads shared modules + game scripts)
- **Logic**: `{dir}/js/{key}_board.js` (State management)
- **Rendering**: `{dir}/js/{key}_renderer.js` (Canvas drawing)
- **Control**: `{dir}/js/{key}_game.js` (Input & Game Loop)

> **Note**: Legacy games (Wave 1) might use `board.js`, `renderer.js`, `game.js`.

## 🛠️ Development

### Shared Modules
This game imports core libraries from `../4d_generic/`:
- `quadray.js`: Vector math
- `camera.js`: 4D Camera controller
- `projection.js`: 4D-to-2D projection
- `input_controller.js`: Keyboard/Mouse handling

### Running Locally
Use the Python launcher to ensure correct module loading (do not just open HTML file if checking headers/imports):
```bash
python3 ../../run_games.py --game {key}
```

### 🧪 Testing
Run unit tests for this game:
```bash
python3 ../../run_games.py --test --game {key}
```
"""

def main():
    # games/scripts/ -> games/
    games_root = Path(__file__).parent.parent

    for key, meta in GAMES.items():
        dir_name = meta["dir"]
        agents_md_path = games_root / dir_name / "AGENTS.md"
        
        if not agents_md_path.exists():
            print(f"Creating missing AGENTS.md for {meta['name']}...")
            content = TEMPLATE.format(
                name=meta["name"], 
                key=key,
                dir=dir_name
            )
            with open(agents_md_path, "w") as f:
                f.write(content)
        else:
            print(f"✅ Found AGENTS.md for {meta['name']}")

if __name__ == "__main__":
    main()
