import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from src.core.registry import GAMES
from src.qa.testing import _run_python_test, _run_test_file, run_tests


class TestProcessFailures(unittest.TestCase):
    def test_crash_after_passing_summary_remains_a_failure(self):
        """A process can fail after its assertions printed a passing summary."""
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            script = directory / "test_exit.js"
            script.write_text(
                "const assert = require('node:assert/strict');\n"
                "assert.equal(2 + 2, 4);\n"
                "console.log('=== Results: 1 passed, 0 failed ===');\n"
                "throw new Error('failure after the summary');\n"
            )
            with contextlib.redirect_stdout(io.StringIO()):
                passed, failed = _run_test_file(script, directory, "exit regression")
            self.assertEqual(passed, 1)
            self.assertEqual(failed, 1)

    def test_failed_assertion_on_stderr_is_not_reported_as_success(self):
        """Legacy suites can report their final counts only on stderr."""
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            script = directory / "test_summary.js"
            script.write_text(
                "const assert = require('node:assert/strict');\n"
                "let failed = 0;\n"
                "try { assert.equal(2 + 2, 5); } catch { failed++; }\n"
                "console.error(`Geometry: 0 passed, ${failed} failed`);\n"
            )
            with contextlib.redirect_stdout(io.StringIO()):
                passed, failed = _run_test_file(script, directory, "summary regression")
            self.assertEqual(passed, 0)
            self.assertEqual(failed, 1)

    def test_javascript_without_executed_checks_fails(self):
        for source in (
            "console.log('suite loaded, but not invoked');\n",
            "console.log('=== Results: 0 passed, 0 failed ===');\n",
        ):
            with self.subTest(source=source), tempfile.TemporaryDirectory() as temporary:
                directory = Path(temporary)
                script = directory / "test_empty.js"
                script.write_text(source)
                with contextlib.redirect_stdout(io.StringIO()):
                    counts = _run_test_file(script, directory, "empty suite")
                self.assertEqual(counts, (0, 1))

    def test_python_without_executed_checks_fails(self):
        for source in (
            "import unittest\n"
            "class NotInvoked(unittest.TestCase):\n"
            "    def test_truth(self): self.assertTrue(True)\n",
            "import unittest\nunittest.main()\n",
            "import unittest\n"
            "class Skipped(unittest.TestCase):\n"
            "    @unittest.skip('not executed')\n"
            "    def test_truth(self): self.assertTrue(True)\n"
            "unittest.main()\n",
        ):
            with self.subTest(source=source), tempfile.TemporaryDirectory() as temporary:
                directory = Path(temporary)
                script = directory / "test_empty.py"
                script.write_text(source)
                with contextlib.redirect_stdout(io.StringIO()):
                    counts = _run_python_test(script, directory, "empty suite")
                self.assertEqual(counts, (0, 1))

    def test_python_stderr_summary_reports_real_checks(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            script = directory / "test_real.py"
            script.write_text(
                "import unittest\n"
                "class Arithmetic(unittest.TestCase):\n"
                "    def test_sum(self): self.assertEqual(2 + 2, 4)\n"
                "unittest.main()\n"
            )
            with contextlib.redirect_stdout(io.StringIO()):
                counts = _run_python_test(script, directory, "real suite")
            self.assertEqual(counts, (1, 0))

    def test_python_crash_after_passing_summary_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            script = directory / "test_exit.py"
            script.write_text(
                "import unittest\n"
                "class Arithmetic(unittest.TestCase):\n"
                "    def test_sum(self): self.assertEqual(2 + 2, 4)\n"
                "unittest.main(exit=False)\n"
                "raise RuntimeError('failure after the summary')\n"
            )
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                passed, failed = _run_python_test(script, directory, "exit regression")
            self.assertEqual(passed, 1)
            self.assertEqual(failed, 1)
            self.assertIn("failure after the summary", output.getvalue())


class TestMissingSuites(unittest.TestCase):
    def test_missing_selected_game_suite_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            with contextlib.redirect_stdout(io.StringIO()):
                result = run_tests(Path(temporary), ["chess"])
            self.assertFalse(result)

    def test_unknown_selected_game_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            with contextlib.redirect_stdout(io.StringIO()):
                result = run_tests(Path(temporary), ["not_registered"])
            self.assertFalse(result)

    def test_missing_registered_suites_fail_despite_a_passing_game(self):
        with tempfile.TemporaryDirectory() as temporary:
            games_dir = Path(temporary)
            test_dir = games_dir / GAMES["chess"]["dir"] / "tests"
            test_dir.mkdir(parents=True)
            (test_dir / "test_real.js").write_text(
                "const assert = require('node:assert/strict');\n"
                "assert.equal(2 + 2, 4);\n"
                "console.log('=== Results: 1 passed, 0 failed ===');\n"
            )
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertTrue(run_tests(games_dir, ["chess"]))
                self.assertFalse(run_tests(games_dir))


if __name__ == "__main__":
    unittest.main()
