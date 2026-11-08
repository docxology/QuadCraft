# Quadray Chess documentation maintenance — source-backed rules and interfaces

Use the [documentation index](README.md) and [game instructions](../AGENTS.md). Keep these filenames and relative links stable; update inbound heading links when changing a title or section.

## Source of truth

- [chess_pieces.js](../js/chess_pieces.js) defines directed pseudo-legal moves; [chess_board.js](../js/chess_board.js) defines canonical keys and inclusive bounds.
- [chess_game.js](../js/chess_game.js) owns TurnManager turns, selection, random autoplay and terminal-state messages. Shared loop pause is not a universal command/autoplay freeze.
- [chess_storage.js](../js/chess_storage.js) and history-analysis helpers still assume flat records; the controller exposes wrapped records and getter-only state. Do not convert the exposed UI into an unsupported persistence guarantee.
- [index.html](../index.html) owns the actual dependency order and selected-piece view wiring. There is no local `js/quadray.js`.

Keep mathematical conventions in [quadray-math.md](quadray-math.md) and exact move patterns in [piece-movement.md](piece-movement.md); link them instead of copying conflicting formulas or counts. Distinguish check detection from self-check filtering, and design proposals from current features. Strategy metrics are heuristics, not measured playing strength or educational outcomes.

Examples must use actual files/signatures. Link to [test scope](../tests/README.md) rather than retaining timeless green badges or coverage counts. Do not claim browser or real-controller storage coverage from helper-object tests.
