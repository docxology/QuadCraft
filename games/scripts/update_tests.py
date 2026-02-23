import os
import re

TEST_COUNTS = {
    '4d_asteroids': 12,
    '4d_bomberman': 22,
    '4d_breakout': 20,
    '4d_connect_four': 69,
    '4d_frogger': 23,
    '4d_minecraft': 74,
    '4d_minesweeper': 23,
    '4d_pong': 19,
    '4d_snake': 15,
    '4d_space_invaders': 22,
    '4d_tetris': 18,
    '4d_tower_defense': 225,
    '4d_sokoban': 34,
    '4d_2048': 10,
    '4d_rogue': 11,
    '4d_go': 9,
    '4d_hex': 7,
    '4d_memory': 5,
    '4d_sudoku': 7,
    '4d_lights_out': 45
}

def update_test_counts():
    games_dir = '/Users/4d/Documents/GitHub/QuadCraft/games'
    
    for game, count in TEST_COUNTS.items():
        agents_md_path = os.path.join(games_dir, game, 'AGENTS.md')
        
        if not os.path.exists(agents_md_path):
            continue
            
        with open(agents_md_path, 'r') as f:
            content = f.read()
            
        original_content = content
        
        # Replace occurrences of "(X tests)" or "X tests" pattern
        # Be careful, typical formats: "Test suite (8 tests)", "| `test_asteroids.js` | 8 |", "8 tests"
        
        # Replace "(X tests)"
        content = re.sub(r'\(\d+ tests\)', f'({count} tests)', content)
        
        # Replace the markdown table rows like "| `test_*.js` | 8 |" or "| test_all.js | 8 |"
        content = re.sub(r'(\|\s*`?test_[a-z0-9_]+\.js`?\s*\|\s*)\d+(\s*\|)', fr'\g<1>{count}\g<2>', content)
        
        # Wait, for games like 4d_chess there are multiple files, but it's not in the list.
        # So it's safe to just replace digits in the test table where the column is clearly tests.
        
        if content != original_content:
            with open(agents_md_path, 'w') as f:
                f.write(content)
            print(f"Updated {agents_md_path} with {count} tests.")

        # Let's also check README.md just in case it hardcodes tests
        readme_md_path = os.path.join(games_dir, game, 'README.md')
        if os.path.exists(readme_md_path):
            with open(readme_md_path, 'r') as f:
                r_content = f.read()
            original_r_content = r_content
            r_content = re.sub(r'\(\d+ tests\)', f'({count} tests)', r_content)
            if r_content != original_r_content:
                with open(readme_md_path, 'w') as f:
                    f.write(r_content)
                print(f"Updated {readme_md_path} with {count} tests.")

if __name__ == '__main__':
    update_test_counts()
