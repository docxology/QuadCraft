import unittest
import tempfile
import json
from pathlib import Path
from src.core.registry import load_config
from src.core.config import BASE_PORT, REPO_ROOT

class TestConfig(unittest.TestCase):
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

    def test_constants(self):
        """Test that key constants are defined."""
        self.assertIsInstance(BASE_PORT, int)
        self.assertIsInstance(REPO_ROOT, str)

if __name__ == '__main__':
    unittest.main()
