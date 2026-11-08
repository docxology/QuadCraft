# 4D Connect Four test maintenance

Read [suite scope and commands](README.md) and [game instructions](../AGENTS.md). The test files are JavaScript behavior checks, not proof that every shared module or browser path is covered.

## Behavior to preserve

Never normalize slot keys or use gauge-aware equality for winning lines. Undo restores the preceding human decision when AI is enabled; preserve single-timeout ownership and fixed-P2 search evaluation.

## Evidence limits

Raw gravity/alias separation, wins, full/invalid columns, metadata, evaluation, undo and shared math in `test_connect_four.js`; `test_connect_four_game.js` checks undo-to-human-decision, AI lifecycle guards and actual tactical search positions.

`test.html` contains inline smoke checks but omits shared BaseBoard/TurnManager dependencies; it does not run the two Node suites as-is. Use `index.html` for current interaction verification.

Prefer genuine consumer-visible state transitions and geometry checks over file-existence, source-text, wording or fixed-count assertions. Test actual game interfaces when changing them; helper objects do not establish controller integration. Keep suite output/exit status compatible with the [launcher test runner](../../src/qa/testing.py), and report only executed results. Browser interaction is a separate verification gate.
