# Maintaining shared logic and runtime test boundaries

Read [testing guide](../doc/testing_guide.md) and the target suite's implementing source. Full `run_games.py --test` recursively discovers shared test_*.js/test_*.py, including shared/ and space/ subdirectories; it skips the aggregate test_all_shared.js runner. Per-game discovery uses direct tests/test_*.js. Do not reintroduce the obsolete nonrecursive-discovery claim.

Node suites must report executed checks and fail nonzero on failures; Python files run directly under unittest with the launcher's interpreter. Missing runtimes, nonzero exits and empty/all-skipped runs remain failures. Add checks for uncertain consumer-visible transitions/geometry/resources, not incidental wording or default existence.

Node browser doubles do not establish actual canvas/input behavior. The [Chromium gate](browser/README.md) independently exercises real runtime objects, selected legal fixtures and screenshots; keep pointer-lock denial truthful. Respect current task restrictions on running suites and report only exercised verification.
