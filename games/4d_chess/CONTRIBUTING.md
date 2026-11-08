# Contributing to Quadray Chess — rule changes, real consumers and documentation

Read [game maintenance instructions](AGENTS.md), [architecture](docs/architecture.md) and the [repository contribution/development guidance](../../AGENTS.md) first. The browser game, shared library and native runtime have different ownership and verification routes.

## Development Setup

A modern browser serves the game; Node.js runs logic tests and Python 3.13 runs the repository launcher/QA. From the QuadCraft checkout root:

```bash
python3.13 games/run_games.py --game chess
node games/4d_chess/tests/test_chess.js
```

Keep the parent `games/` directory as the HTTP root so `../4d_generic/` assets resolve. There is no package/bundler build step for this page; external fonts are presentation resources, not a universal zero-dependency guarantee.

## Source boundaries

- Change piece destinations in [chess_pieces.js](js/chess_pieces.js), maintaining explicit directed semantics and source-backed [movement documentation](docs/piece-movement.md).
- Change canonical occupancy/bounds in [chess_board.js](js/chess_board.js), auditing `position.toKey()` callers rather than normalizing unrelated raw-label games.
- Change selection/turns/timers in [chess_game.js](js/chess_game.js); shared BaseGame calls the input hook during construction, before later subclass fields exist.
- Keep Canvas/picking in the overview/FPV renderers, and page controls/script order in `index.html`.
- Storage/history changes must use real TurnManager-wrapped records and getter-only controller state. The current legacy helper mismatch is described in [API/notation](docs/notation.md); tests with writable flat helper objects do not prove a browser round-trip.

## Testing

Follow [test scope](tests/README.md) and the [repository testing guide](../../docs/development/testing_guide.md). Use genuine behavior regressions for uncertain movement, capture, geometry, timer ownership or resource/state transitions; avoid source-text, wording, fixed-count or existence-only tests. Maintain output and failure exits recognized by the launcher.

Before a behavioral change is accepted, run the affected Node/shared suites, portfolio validation and actual browser checks for loading, selection, movement, camera/zoom, pause/reset, console errors and any affected persistence/timer path. The historical HTML test runner is stale; do not present it as passing equivalent coverage. Record only executed commands/results.

## Documentation

Use [the docs index](docs/README.md) and scoped instructions. Preserve filenames, repair relative/heading links and update source-backed examples. Separate pseudo-legal generated moves from full chess legality, position heuristics from validated strategy, exposed legacy UI from reliable behavior, and physical rank-three geometry from raw label counts. Do not maintain saved green badges or measured-quality claims without current evidence.
