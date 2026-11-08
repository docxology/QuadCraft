# Maintaining the browser-game portfolio

Read [repository instructions](../AGENTS.md), [portfolio contracts](../docs/games.md), [inventory](GAMES_INDEX.md) and the target game's scoped instructions before changing behavior. There are thirty registered games, shared browser helpers and separate Python tooling; a local folder does not inherit every helper's capabilities.

## Ownership boundaries

- `4d_<key>/index.html` loads that game's actual scripts; Doom uses an ES-module controller and its shared-Quadray bridge.
- `4d_generic/` holds optional reusable browser implementations, not native/server APIs.
- `src/core/registry.py` drives CLI selection, launch ports and QA. Analytics and board tools instead scan directories.
- `src/` is Python tooling and numerical helpers, not browser game logic. Read its [instructions](src/AGENTS.md).

## Contracts to preserve

Use [the canonical contracts](../docs/games.md), not copied formulas. Physical quadrays have rank three modulo a common offset; raw slots may intentionally distinguish aliases. Do not normalize occupancy keys globally. Shared `GameLoop` tick intervals are milliseconds while update callbacks receive fixed seconds; discrete logical ticks may ignore dt. Inspect each controller before changing integration or random streams.

## Commands and evidence

Commands in this section run from the QuadCraft repository root:

```sh
python3.13 games/run_games.py --game chess
python3.13 games/run_games.py --validate
python3.13 games/run_games.py --test --game chess
python3.13 games/run_games.py --test
```

Serve `games/` so sibling shared imports resolve. Structural validation is textual and cannot prove gameplay or canvas correctness. [Testing guidance](doc/testing_guide.md) separates Node/Python logic checks from the [Chromium gate](tests/browser/README.md). Record executed evidence rather than saved totals or completeness percentages. Follow task-specific restrictions on running checks.

For additions follow [contributing](doc/contributing.md): implement real rules, register a unique offset, maintain navigation and browser coverage. Do not regenerate documentation or test pages blindly; [maintenance scripts](doc/scripts_reference.md) include legacy templates.
