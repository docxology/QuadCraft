import unittest
from src.core.registry import GAMES

class TestRegistry(unittest.TestCase):
    def test_registry_games_exist(self):
        """Verify the games registry structure."""
        self.assertIsInstance(GAMES, dict)
        self.assertIn("chess", GAMES)
        self.assertIn("minesweeper", GAMES)
        
    def test_registry_game_fields(self):
        """Verify fields of a known game."""
        meta = GAMES["minesweeper"]
        self.assertEqual(meta["dir"], "4d_minesweeper")
        self.assertEqual(meta["name"], "4D Minesweeper")

if __name__ == '__main__':
    unittest.main()
