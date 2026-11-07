"""
games.src.testing — Unit test runner for QuadCraft game directories.

Discovers and runs all test_*.js files via Node.js. Reports per-game
pass/fail counts via regex parsing of the standardized test output
format: "=== Results: N passed, M failed ==="

Supports nested shared module tests (games/tests/, 4d_generic/tests/)
and per-game tests (games/4d_*/tests/). Nonzero exits, missing game suites,
and files without executed-check evidence are failures.
"""
import re
import subprocess
import sys
import logging
from pathlib import Path
from ..core.registry import GAMES

logger = logging.getLogger(__name__)

# Shared and per-game suites use different prefixes but the same count fields.
RESULTS_RE = re.compile(r'(\d+)\s*passed,\s*(\d+)\s*failed', re.IGNORECASE)


def _run_test_file(tf: Path, cwd: Path, label: str) -> tuple[int, int]:
    """
    Run a single test file via Node.js and return (passed, failed) counts.

    Parses the standardized results line format:
        === Results: N passed, M failed ===

    Falls back to emoji counting if no results line found.
    """
    try:
        result = subprocess.run(
            ["node", str(tf)],
            capture_output=True, text=True, cwd=str(cwd),
            timeout=30  # Prevent hanging
        )

        output = result.stdout + "\n" + result.stderr
        summaries = RESULTS_RE.findall(output)
        if summaries:
            test_count, fail_count = map(int, summaries[-1])
        else:
            lines = output.splitlines()
            test_count = sum(1 for line in lines if '✅' in line and 'Results' not in line)
            fail_count = sum(1 for line in lines if '❌' in line and 'Results' not in line)

        # A later crash or an empty suite must not look like a passing run.
        no_checks = test_count + fail_count == 0
        if result.returncode != 0 or no_checks:
            fail_count = max(1, fail_count)

        status = "✅" if result.returncode == 0 and fail_count == 0 else "❌"
        detail = f"{test_count} passed"
        if fail_count > 0:
            detail += f", {fail_count} failed"
        if no_checks:
            detail += " (no executed checks reported)"

        print(f"  {status} {label:20s} — {tf.name}: {detail}")

        if fail_count:
            if result.stdout:
                print(result.stdout.rstrip())
            if result.stderr:
                print(result.stderr.rstrip())

        return (test_count, fail_count)

    except subprocess.TimeoutExpired:
        print(f"  ❌ {label:20s} — TIMEOUT (30s)")
        logger.error(f"Test timed out: {tf}")
        return (0, 1)
    except FileNotFoundError:
        print(f"  ❌ {label:20s} — Node.js not found in PATH")
        return (0, 1)
    except Exception as e:
        print(f"  ❌ {label:20s} — ERROR: {e}")
        logger.exception(f"Unexpected error running {tf}")
        return (0, 1)


def _run_python_test(tf: Path, cwd: Path, label: str) -> tuple[int, int]:
    """
    Run a python unittest file and parse output.
    Format expected: "Ran N tests in ... OK" or "FAILED (failures=M)"
    """
    try:
        import os
        env = os.environ.copy()
        # Add the working directory (repo_root) to PYTHONPATH so modules resolve
        env["PYTHONPATH"] = f"{cwd}{os.pathsep}{env.get('PYTHONPATH', '')}"

        # We run from repo root so imports like 'games.src...' work
        # Assumption: repo_root has 'games' module
        result = subprocess.run(
            [sys.executable, str(tf)],
            capture_output=True, text=True, cwd=str(cwd), env=env,
            timeout=30
        )
        
        output = result.stderr + result.stdout # unittest prints to stderr usually
        
        # Parse "Ran N tests"
        run_match = re.search(r'Ran (\d+) test', output)
        test_count = int(run_match.group(1)) if run_match else 0
        
        # unittest's run count includes skipped tests, not executed checks.
        skip_match = re.search(r'skipped=(\d+)', output)
        skipped = int(skip_match.group(1)) if skip_match else 0
        fail_match = re.search(r'failures=(\d+)', output)
        err_match = re.search(r'errors=(\d+)', output)
        fails = int(fail_match.group(1)) if fail_match else 0
        errs = int(err_match.group(1)) if err_match else 0
        fail_count = fails + errs
        pass_count = max(0, test_count - skipped - fail_count)
        no_checks = test_count - skipped == 0
        if result.returncode != 0 or "FAILED" in output or no_checks:
            fail_count = max(1, fail_count)

        status = "✅" if fail_count == 0 and result.returncode == 0 else "❌"
        detail = f"{pass_count} passed"
        if fail_count > 0:
            detail += f", {fail_count} failed"
        if no_checks:
            detail += " (no executed checks reported)"
            
        print(f"  {status} {label:20s} — {tf.name}: {detail}")
        
        if fail_count > 0:
            if result.stdout:
                print(result.stdout.rstrip())
            if result.stderr:
                print(result.stderr.rstrip())

        return (pass_count, fail_count)

    except Exception as e:
        print(f"  ❌ {label:20s} — ERROR executing {tf.name}: {e}")
        return (0, 1)


def run_tests(games_dir: Path, game_keys: list[str] | None = None) -> bool:
    """
    Run unit tests for the specified games (or all), plus shared module tests.

    Returns True if all tests passed, False otherwise.
    """
    keys = list(GAMES) if game_keys is None else game_keys
    passed = 0
    failed = 0
    repo_root = games_dir.parent

    # ── Shared module tests (games/tests/ and games/4d_generic/tests/) ──
    # Run if no specific games requested, OR if we are running the full suite
    should_run_shared = (game_keys is None) or (set(game_keys) == set(GAMES))
    
    if should_run_shared:
        print("📦 Shared Module Tests\n")
        shared_dirs = [
            (games_dir / "tests", "Shared Modules"),
            (games_dir / "4d_generic" / "tests", "4d_generic"),
        ]
        
        # 1. Run Node.js tests
        for test_dir, label in shared_dirs:
            if not test_dir.is_dir():
                 continue

            # JS Tests
            test_files = sorted(test_dir.rglob("test_*.js"))
            for tf in test_files:
                if tf.name == "test_all_shared.js":
                    continue  # Skip the runner, run individual files
                p, f = _run_test_file(tf, repo_root, label)
                passed += p
                failed += f
            
            # Python Tests (unittest)
            py_test_files = sorted(test_dir.rglob("test_*.py"))
            for tf in py_test_files:
                # We'll run each python test file as a separate process to keep isolation
                p, f = _run_python_test(tf, games_dir, label)
                passed += p
                failed += f

    # ── Per-game tests ──
    print(f"\n🎮 Running tests for {len(keys)} game(s)...\n")

    for key in keys:
        if key not in GAMES:
            print(f"  ❌ Unknown game: {key}")
            failed += 1
            continue

        meta = GAMES[key]
        game_dir = games_dir / meta["dir"]
        test_files = sorted(game_dir.glob("tests/test_*.js"))

        if not test_files:
            print(f"  ❌ {meta['name']:20s} — No tests found")
            failed += 1
            continue

        for tf in test_files:
            p, f = _run_test_file(tf, repo_root, meta['name'])
            passed += p
            failed += f

    if passed + failed == 0:
        print("  ❌ No executed checks reported")
        failed += 1

    # ── Summary ──
    print(f"\n{'═' * 48}")
    print(f"  Total: {passed} passed, {failed} failed", end="")
    print()
    if failed == 0:
        print("  ✅ All tests passed!")
    else:
        print("  ❌ Some tests failed — see output above.")
    print(f"{'═' * 48}\n")

    return failed == 0
