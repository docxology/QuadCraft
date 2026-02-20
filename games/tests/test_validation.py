import unittest
from pathlib import Path
from src.qa.validation import validate_game

class TestValidation(unittest.TestCase):
    def test_validation_minesweeper(self):
        """Validation should pass for the known-good Minesweeper game."""
        # Assume we are running from repo root
        repo_root = Path.cwd() / "games"
        if not repo_root.exists():
            repo_root = Path.cwd() # Fallback
            
        issues = validate_game(repo_root, "minesweeper")
        self.assertEqual(issues, [], f"Minesweeper validation failed: {issues}")

if __name__ == '__main__':
    unittest.main()
