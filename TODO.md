# TODO — QuadCraft backlog

> Single canonical backlog for this repo. When an item is done, mark `[x]` with date and
> evidence, or remove it. Verification commands: `python3 games/run_games.py --validate`,
> `python3 games/run_games.py --test` (both run in CI: `.github/workflows/games-tests.yml`;
> doc links run in CI: `.github/workflows/doc-links.yml`).

## Completed (Round 2, 2026-08-31)

- [x] 2026-08-31 Minor — games/doc/game_template.md naming convention restated against reality: full `{key}_board.js`/`{key}_renderer.js`/`{key}_game.js` is the scaffold+config standard (26/30 games); the four legacy exceptions (chess bare names, tower_defense `td_*`, 2048 `twenty48_*`, doom `doom_*`) are documented as legacy, not convention. New games must use the full convention.
- [x] 2026-08-31 Medium — games/doc/scaffold_guide.md `manifest.json` claim verified CORRECT by live scaffold run (`GameScaffold('ztesttmp').create()` emits manifest.json, run.sh, AGENTS.md, index.html, js/, tests/); no doc change needed, entry closed as verified-non-issue.
- [x] 2026-08-31 Medium — `.vscode/settings.json` now committed (exactly the JSON block docs/development/setup_guide.md prescribes; JSON-validated; not gitignored). Doc now matches disk.
- [x] 2026-08-31 Major — doc-accuracy CI: `.github/workflows/doc-links.yml` fails CI on any broken relative markdown link (script pattern from REVIEW_LOG_2026-08-31; verified: 0 broken repo-wide at time of writing).

## Remaining

### Major

- [ ] Native C++ engine (`src/core/`, `src/game/`, `src/render/`, `main.cpp`) has no build/test verification anywhere (CI only covers the games portfolio and doc links). Decide: (a) add a Linux job running `./build.sh` + CTest, or (b) mark the native engine "experimental/unmaintained" in README so agents do not trust it blindly. Acceptance: one of the two exists in-tree with a README pointer. (Deferred: needs owner decision on whether the native engine is still a maintained target; local macOS build unverified — check with `./build.sh`.)

### Known cosmetic debt (no action scheduled)

- Four legacy games use non-standard JS file names (chess, tower_defense, 2048, doom). Renaming them would touch ~30 files + import sites + test discovery for zero behavioral gain; validation already tolerates them. Renames belong to a dedicated mechanical pass if ever wanted, not ongoing backlog.
