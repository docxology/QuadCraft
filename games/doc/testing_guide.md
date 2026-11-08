# Logic, structure and real-browser verification

No saved total is current test evidence. Record the checkout, command, interpreter, exit status and relevant diagnostics for each actual run. The commands below assume the QuadCraft repository root unless stated otherwise.

## Running logic suites

```sh
python3.13 games/run_games.py --test
python3.13 games/run_games.py --test --game chess doom
node games/tests/shared/test_projection.js
node games/4d_chess/tests/test_chess.js
python3.13 games/run_games.py --validate
```

The first command is the full logic harness; filtered runs are not a substitute for it. Node must be on PATH. Python child files run with the launcher's `sys.executable`, not an independently chosen `python3`.

## Discovery and failure semantics

Source: [`src/qa/testing.py`](../src/qa/testing.py).

- For an unfiltered run, or an explicit key set equal to all registry keys, recursively discover `test_*.js` and `test_*.py` under `games/tests/` and `4d_generic/tests/`.
- This **does include** nested `tests/shared/`, `tests/space/` and infrastructure subdirectories. The old claim that shared tests are dead/unrun is false.
- Skip only aggregate `test_all_shared.js` during shared discovery to avoid duplicate execution.
- For each selected game run direct `tests/test_*.js` files. Per-game Python files and nested game test folders are not discovered by this branch.
- Node and Python processes have 30-second per-file limits. A missing Node runtime, process error/timeout, nonzero exit, missing game suite or no executed checks is a failure.
- Node parses the last `N passed, M failed` summary, otherwise counts marked pass/fail lines. Python parses unittest run/failure/error/skipped counts; all-skipped files do not count as executed checks.

Use a final `=== Results: N passed, M failed ===` line and a nonzero exit on failed Node checks. Python files must execute unittest checks when invoked directly. Do not print success before a later crash and assume the summary suppresses it. The harness returns a boolean and the CLI translates failure to a nonzero exit.

## Structural validation is not gameplay validation

[`qa/validation.py`](../src/qa/validation.py) checks registered directory/index/js/tests/AGENTS presence, direct test filenames, shared import text and prohibited local quadray copies (Doom skips the latter checks), some board file content and specific scaffold markers. `check_shared_dir` checks the configured core+optional list, not every file on disk. It does not execute JS, parse all exports, enforce renderer/controller presence in every case, or establish legal rules, complete rendering or correct interaction. A large inert board can pass the size heuristic.

## Real Chromium runtime gate

The separate package at [`tests/browser/`](../tests/browser/README.md) is not invoked by Python/Node `test_*` discovery. It launches a stdlib HTTP child rooted at games/, creates isolated Chromium contexts for every catalog game, controls only randomness/time, and exercises real canvas/DOM/input/state transitions. Playwright virtual clocks still use milliseconds; app fixed-update callbacks use their declared seconds/tick contract.

Scenarios span board moves/captures/purchases, live arcade motion, simulations, pause/reset, camera/projection and specific terminal/undo/FOV regressions. They produce screenshots and JSON/console/server diagnostics; failures retain traces. They are selected consumer scenarios, not exhaustive game-rule coverage or formal mathematical proof. Doom records actual pointer-lock success or truthful denial; capture-only firing behavior remains explicitly unexercised on denied platforms, never simulated as passing.

See the browser README for dependency installation, `PYTHON=python3.13 npm test`, external diagnostics paths and trace inspection. Node tests with browser doubles do not replace this gate; successful HTTP does not establish visible playable rendering.

## Writing meaningful checks

Follow existing game suites and assert uncertain consumer-visible behavior: legal/blocked moves, alias occupancy, graph traversal, collision units, reset/terminal/history transitions, fixed-time integration and input ownership. Use a game's actual injected RNG if it exposes one; a shared RNG helper does not imply universal deterministic reset. Browser fixtures may configure real board positions but must not mock renderer/input/runtime behavior. Preserve failures rather than weakening assertions, pinning incidental wording or suppressing resource errors.

[Canonical contracts](../../docs/games.md) · [Shared API signatures](shared_modules_reference.md) · [Python interfaces](python_infrastructure.md) · [Contribution workflow](contributing.md)
