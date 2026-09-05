# TODO — QuadCraft backlog

> Single canonical backlog for this repo. When an item is done, mark `[x]` with date and
> evidence, or remove it. Verification commands: `python3 games/run_games.py --validate`,
> `python3 games/run_games.py --test` (both run in CI: `.github/workflows/games-tests.yml`;
> doc links run in CI: `.github/workflows/doc-links.yml`).

## Completed (Round 3, 2026-09-05)

- [x] 2026-09-05 Major — native C++ engine build/test verification added (option (a) chosen: engine stays a maintained target). CMake fixed to link via imported targets (`OpenGL::GL`, `GLEW::GLEW`) — the old `${GLEW_LIBRARIES}` variable resolved to `GLEW_LIBRARY-NOTFOUND` under Homebrew's glew-config and broke the link step — and the dead `file(COPY assets)` step removed (no `assets/` dir exists; shaders are embedded strings). Zero-warning build (`-Wall -Wextra -pedantic`, macOS arm64 clang). CTest suites `tests/quadray_test.cpp` (quadray↔Cartesian roundtrip, normalization, tetrahedral basis angles, distance, S3) and `tests/world_chunk_test.cpp` (Cartesian chunk-key regression). `./build.sh --no-run --test` verified locally; `.github/workflows/native-build.yml` runs it on ubuntu-latest. README status section updated.
- [x] 2026-09-05 Major — chunk-key coordinate space unified on the Cartesian chunk grid (chunk `(cx,cy,cz)` = world cube `[cx*16,(cx+1)*16)³`): `World::generateChunksAround`/`getOrCreateChunk` now key on Cartesian chunk coords (the old quadray-a/b/c keying disagreed with `World::getBlock/setBlock`, which were already Cartesian), dead `TetraChunk(const Quadray&)` ctor / `position` member / `unloadChunk(Quadray)` / `getChunk(Quadray)` removed, `TetraChunk::getCenter` fixed to the Cartesian cube center, and `ChunkMesher` offsets vertices into world space (previously every chunk mesh rendered stacked at the origin under the identity model matrix). Documented in `World.h`/`TetraChunk.h` class comments and `docs/development/chunk_system.md`; regression-tested by `tests/world_chunk_test.cpp`.
- [x] 2026-09-05 Minor — cosmetic debt cleared: the four legacy games renamed to the standard convention (chess `board/renderer/game/analysis/pieces/storage/fpvRenderer.js` → `chess_*` incl. `chess_fpv_renderer.js`, `test_all.js` → `test_chess.js`; tower_defense `td_*` → `tower_defense_*`, `test_td.js` → `test_tower_defense.js`; 2048 `twenty48_*` → `2048_*`; doom `doom_map.js`/`doom_render_fps.js`/`doom_main.js` → `doom_board.js`/`doom_renderer.js`/`doom_game.js`). All import sites, tests, and per-game docs updated; `qa/validation.py` legacy globs and doom file-name exceptions removed; `catalog.py` `td_board` special case removed; `game_template.md`/`games/AGENTS.md`/`controls_and_navigation.md` updated. Per-game test counts unchanged (chess 91, tower_defense 217, 2048 28, doom 116); full suite re-verified green.

## Completed (Round 2, 2026-08-31)

- [x] 2026-08-31 Minor — games/doc/game_template.md naming convention restated against reality: full `{key}_board.js`/`{key}_renderer.js`/`{key}_game.js` is the scaffold+config standard (26/30 games); the four legacy exceptions (chess bare names, tower_defense `td_*`, 2048 `twenty48_*`, doom `doom_*`) are documented as legacy, not convention. New games must use the full convention.
- [x] 2026-08-31 Medium — games/doc/scaffold_guide.md `manifest.json` claim verified CORRECT by live scaffold run (`GameScaffold('ztesttmp').create()` emits manifest.json, run.sh, AGENTS.md, index.html, js/, tests/); no doc change needed, entry closed as verified-non-issue.
- [x] 2026-08-31 Medium — `.vscode/settings.json` now committed (exactly the JSON block docs/development/setup_guide.md prescribes; JSON-validated; not gitignored). Doc now matches disk.
- [x] 2026-08-31 Major — doc-accuracy CI: `.github/workflows/doc-links.yml` fails CI on any broken relative markdown link (script pattern from REVIEW_LOG_2026-08-31; verified: 0 broken repo-wide at time of writing).

