# TODO — QuadCraft backlog

> Single canonical backlog for this repo. When an item is done, mark `[x]` with the date.
> Verification commands: `python3 games/run_games.py --validate`, `python3 games/run_games.py --test`.

## Minor

- [x] 2026-08-31 README.md:57 clone URL uses `yourusername` placeholder -> use `docxology/QuadCraft.git`.
- [x] 2026-08-31 README.md folder tree lists nonexistent `src/core/physics/` and `src/render/texture/` -> corrected to actual tree.
- [x] 2026-08-31 README.md image tag malformed (`<img src=<https://...>>`) -> proper markdown image syntax.
- [x] 2026-08-31 AGENTS.md references bare `gameState.js` -> give full path `src/js/experiments/browser/js/core/gameState.js`.
- [x] 2026-08-31 games/doc/contributing.md broken relative link `4d_my_game/` -> point at the real scaffold output convention.

## Medium

- [x] 2026-08-31 GAMES_INDEX.md completeness contradictions between portfolio table and "Enhancements" table (Asteroids 50% vs 100%, Breakout 60% vs 50%, Pong 50% vs 60%) -> enhancements table marked historical; portfolio table declared canonical.
- [x] 2026-08-31 GAMES_INDEX.md "Last Validated 2026-02-23" stale -> refreshed to 2026-08-31 with the verifying commands.
- [x] 2026-08-31 No orientation ladder in entry docs (status now / next actions / how to verify) -> added Status & Verification and Next Actions sections to README.md.
- [ ] Duplicated "4D Geometry & Nomenclature" note (verbatim copy) in `games/README.md` and `games/GAMES_INDEX.md` — pick one canonical home and link from the other. (Not fixed this pass: both files are entry points for different audiences and churn risk outweighed gain; decide home in next docs pass.)

## Major

- [ ] Audit ~200 generated per-directory AGENTS.md/README.md pairs (commit baf87de, 2026-08-30) for staleness against current code. Deferred: sampled reads + full link scan surfaced no concrete rot; needs a dedicated pass with per-claim verification.
- [ ] Add CI (even a single GitHub Actions job running `run_games.py --test --validate`) so the "all passing" claim is continuously verified. Deferred: CI configs are out of scope for this pass per mission constraints.
