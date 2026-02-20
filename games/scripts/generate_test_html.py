#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add parent directory to path to import from src
game_root = str(Path(__file__).resolve().parent.parent)
if game_root not in sys.path:
    sys.path.insert(0, game_root)

from src.core.registry import GAMES

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{name} - Tests</title>
    <style>
        body {{ font-family: monospace; background: #111; color: #eee; padding: 20px; }}
        .pass {{ color: #4f4; }}
        .fail {{ color: #f44; font-weight: bold; }}
        .group {{ margin-top: 15px; border-bottom: 1px solid #333; padding-bottom: 5px; }}
        h1 {{ color: #add8e6; }}
    </style>
</head>
<body>
    <h1>🧪 Unit Tests: {name}</h1>
    <div id="results">Running tests...</div>

    <!-- Core Dependencies -->
    <script src="../js/quadray.js"></script>
    
    <!-- Game Modules (Load order matters) -->
    {modules}

    <!-- Test Runner Helper -->
    <script>
        const results = document.getElementById('results');
        results.innerHTML = ''; // Clear "Running tests..."
        
        let passed = 0;
        let failed = 0;

        // Global assert for browser tests that don't have their own reporting
        window.assert = function(condition, message) {{
            const div = document.createElement('div');
            if (condition) {{
                div.className = 'pass';
                div.textContent = '✅ PASS: ' + message;
                passed++;
            }} else {{
                div.className = 'fail';
                div.textContent = '❌ FAIL: ' + message;
                failed++;
                console.error('FAIL:', message);
            }}
            results.appendChild(div);
            updateSummary();
        }};
        
        window.updateSummary = function() {{
            let summary = document.getElementById('summary');
            if (!summary) {{
                summary = document.createElement('h2');
                summary.id = 'summary';
                document.body.prepend(summary);
            }}
            summary.textContent = `Total: ${{passed}} Passed, ${{failed}} Failed`;
            summary.style.color = failed === 0 ? '#4f4' : '#f44';
        }};

        // Mock Node.js require/module for hybrid scripts
        window.require = function(module) {{
            // Attempt to return global objects if they exist
            if (module.includes('quadray')) return {{ Quadray: window.Quadray }};
            // Return empty object or mock as needed
            return {{}};
        }};
        
        window.module = {{ exports: {{}} }};
    </script>
    
    <!-- Test Script -->
    <script {script_type} src="{test_script}"></script>
</body>
</html>
"""

# Enhanced metadata for test generation (could be moved to registry in future if widely used)
TEST_CONFIG = {
    "4d_chess": {
        "modules": [
            "../js/pieces.js",
            "../js/board.js",
            "../js/analysis.js"
        ],
        "test_script": "test_chess.js"
    },
    "4d_checkers": {
        "modules": ["../js/checkers_board.js"],
        "test_script": "test_checkers.js"
    },
    "4d_reversi": {
        "modules": ["../js/reversi_board.js"],
        "test_script": "test_reversi.js"
    },
    "4d_life": {
        "modules": ["../js/life_board.js"],
        "test_script": "test_life.js"
    },
    "4d_asteroids": {
        "modules": ["../js/asteroids_board.js"],
        "test_script": "test_asteroids.js"
    },
    "4d_simant": {
        "modules": ["../js/simant_board.js", "../js/simant_ai.js", "../js/simant_combat.js"],
        "test_script": "test_simant.js"
    },
    "4d_backgammon": {
        "modules": ["../js/backgammon_board.js"],
        "test_script": "test_backgammon.js"
    },
    "4d_minecraft": {
        "modules": ["../js/minecraft_board.js"],
        "test_script": "test_minecraft.js"
    },
    "4d_catan": {
        "modules": ["../js/catan_cards.js", "../js/catan_board.js", "../js/catan_trading.js"],
        "test_script": "test_catan.js"
    },
    "4d_tower_defense": {
        "modules": ["../js/td_board.js"],
        "test_script": "test_td.js"
    },
    "4d_doom": {
        "modules": [],
        "test_script": "test_doom.js",
        "is_module": True
    },
    "4d_mahjong": {
        "modules": ["../js/mahjong_board.js"],
        "test_script": "test_mahjong.js"
    }
}

def main():
    # games/scripts/ -> games/
    games_root = Path(__file__).parent.parent
    
    for key, meta in GAMES.items():
        dir_name = meta["dir"]
        if dir_name not in TEST_CONFIG:
            print(f"⚠️  Skipping {key} (no test config)")
            continue
            
        config = TEST_CONFIG[dir_name]
        
        test_html_path = games_root / dir_name / "tests/test.html"
        
        # Determine script type
        script_type = 'type="module"' if config.get("is_module") else ''
        
        module_tags = "\n    ".join([f'<script src="{m}"></script>' for m in config.get("modules", [])])
        
        content = TEMPLATE.format(
            name=meta["name"],
            modules=module_tags,
            script_type=script_type,
            test_script=config["test_script"]
        )
        
        print(f"Updating {test_html_path}...")
        with open(test_html_path, "w") as f:
            f.write(content)

if __name__ == "__main__":
    main()
