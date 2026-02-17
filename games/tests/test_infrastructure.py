
import unittest
import tempfile
import json
import shutil
from pathlib import Path
from games.src.registry import GAMES, load_config
from games.src.space.geometry import verify_geometric_identities, Quadray, angle_between
from games.src.validation import validate_game

class TestInfrastructure(unittest.TestCase):

    def test_registry_games(self):
        """Verify the games registry structure."""
        self.assertIsInstance(GAMES, dict)
        self.assertIn("chess", GAMES)
        self.assertIn("minesweeper", GAMES)
        meta = GAMES["minesweeper"]
        self.assertEqual(meta["dir"], "4d_minesweeper")
        self.assertEqual(meta["name"], "4D Minesweeper")

    def test_load_config(self):
        """Test loading configuration from JSON."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({"test_key": "test_value"}, f)
            config_path = f.name
        
        try:
            config = load_config(config_path)
            self.assertEqual(config["test_key"], "test_value")
        finally:
            Path(config_path).unlink()

    def test_geometry_verification(self):
        """Run the internal geometry verification suite."""
        report = verify_geometric_identities()
        self.assertTrue(report.all_passed, f"Geometry Verification Failed:\n{report.summary()}")
        self.assertEqual(report.pass_count, 8)

    def test_quadray_angles(self):
        """Test specific Quadray angle calculations."""
        q1 = Quadray(1, 0, 0, 0)
        q2 = Quadray(0, 1, 0, 0)
        angle = angle_between(q1, q2)
        # Tetrahedral angle is ~109.47 degrees
        self.assertAlmostEqual(angle, 109.4712, places=3)

    def test_validation_minesweeper(self):
        """Validation should pass for the known-good Minesweeper game."""
        # Assume we are running from repo root
        repo_root = Path.cwd() / "games"
        if not repo_root.exists():
            repo_root = Path.cwd() # Fallback
            
        # We need to find the actual games dir
        # If we are in /Users/4d/Documents/GitHub/QuadCraft, then games/ is right there.
        # But validate_game expects the parent of game_dir.
        
        issues = validate_game(repo_root, "minesweeper")
        self.assertEqual(issues, [], f"Minesweeper validation failed: {issues}")

if __name__ == '__main__':
    unittest.main()
