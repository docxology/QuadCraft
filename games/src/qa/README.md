# Logic-suite execution and structural portfolio checks

`testing.py` provides `run_tests(games_dir: Path, game_keys=None) -> bool`, recursively including shared JS/Python suites on full runs and direct JS files per selected game. Python child processes use sys.executable. Nonzero exits, missing suites and no executed checks fail.

`validation.py` provides `validate_game`, `check_shared_dir`, `audit_all`: textual file/import/scaffold checks, not browser or gameplay verification. See [testing guide](../../doc/testing_guide.md) for real entrypoints and the independent [Chromium gate](../../tests/browser/README.md).
