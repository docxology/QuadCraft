
import os
from pathlib import Path

# Template for Game README.md
GAME_README_TEMPLATE = """# {name}

## Overview
{name} is a 4D browser-based game built on the QuadCraft engine.

## Quick Start
To play this game, run the following from the project root:

```bash
python3 games/run_games.py --game {slug}
```

## Documentation
- **Agent Instructions**: [AGENTS.md](AGENTS.md) - Technical details and architecture.
- **Game Index**: [Index](../GAMES_INDEX.md) - List of all QuadCraft games.

## Verify
Run the test suite for this game:
```bash
python3 games/run_games.py --test --game {slug}
```
"""

# Template for Source/Infra README.md
INFRA_README_TEMPLATE = """# {name} Module

## Purpose
This directory contains {desc}.

## Contents
See [AGENTS.md](AGENTS.md) for detailed file inventory and usage instructions.
"""

# Template for Source/Infra AGENTS.md
INFRA_AGENTS_TEMPLATE = """# {name} - Agent Instructions

## Overview
This module provides {desc} for the QuadCraft engine.

## File Inventory
(Auto-generated placeholder - Agent should update with specific file details)

## Usage
Refer to parent documentation or specific file docstrings for usage details.
"""

# Targets
MISSING_GAMES_README = [
    "games/4d_bomberman", "games/4d_breakout", "games/4d_connect_four",
    "games/4d_frogger", "games/4d_generic", "games/4d_minesweeper",
    "games/4d_pacman", "games/4d_pong", "games/4d_snake",
    "games/4d_space_invaders", "games/4d_tetris"
]

INFRA_DIRS = {
    "games/scripts": "utility scripts for building, testing, and managing the project",
    "games/src": "core source code for the QuadCraft engine and launcher",
    "games/src/analytics": "analytics and metrics collection modules",
    "games/src/scaffold": "templates and generators for new games",
    "games/src/shared": "shared game logic and utility modules (Quadray, Input, etc.)",
    "games/src/space": "4D spatial mathematics and geometry libraries",
    "games/tests": "global test suites and test runners",
}

def create_file(path, content):
    if not path.exists():
        print(f"Creating {path}...")
        path.write_text(content, encoding='utf-8')
    else:
        print(f"Skipping {path} (already exists)")

# 1. Fix Game READMEs
for game_dir in MISSING_GAMES_README:
    path = Path(game_dir)
    slug = path.name.replace("4d_", "")
    name = path.name.replace("_", " ").title().replace("4D", "4D")
    content = GAME_README_TEMPLATE.format(name=name, slug=slug)
    create_file(path / "README.md", content)

# 2. Fix Infra Docs
for dir_path, desc in INFRA_DIRS.items():
    path = Path(dir_path)
    if not path.exists():
        continue
        
    name = path.name.title()
    
    # AGENTS.md
    agents_content = INFRA_AGENTS_TEMPLATE.format(name=name, desc=desc)
    create_file(path / "AGENTS.md", agents_content)
    
    # README.md
    readme_content = INFRA_README_TEMPLATE.format(name=name, desc=desc)
    create_file(path / "README.md", readme_content)

print("Documentation generation complete.")
