/**
 * test_turn_manager.js — Tests for TurnManager module
 *
 * Tests: constructor, turn rotation, move recording, undo/redo,
 * history, metadata, reset.
 * Run: node games/tests/test_turn_manager.js
 */
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: TurnManager Module        ║');
console.log('╚═══════════════════════════════════╝\n');

const { TurnManager } = require(path.join(__dirname, '..', '..', '4d_generic', 'turn_manager.js'));

// 1. Constructor
console.log('▸ Constructor');
const tm = new TurnManager(['black', 'white']);
assert(tm.currentPlayer === 'black', 'starts with first player');
assert(tm.playerCount === 2, '2 players');
assert(tm.moveCount === 0, 'moveCount starts at 0');

// 2. Invalid constructor
console.log('▸ Invalid constructor');
let threw = false;
try { new TurnManager(['solo']); } catch (e) { threw = true; }
assert(threw, 'throws with < 2 players');

// 3. Turn rotation
console.log('▸ nextTurn()');
tm.nextTurn();
assert(tm.currentPlayer === 'white', 'next turn is white');
tm.nextTurn();
assert(tm.currentPlayer === 'black', 'wraps back to black');
assert(tm.moveCount === 2, 'moveCount incremented');

// 4. Opponent
console.log('▸ opponent');
const tm2 = new TurnManager(['x', 'o']);
assert(tm2.opponent === 'o', 'opponent of first player');
tm2.nextTurn();
assert(tm2.opponent === 'x', 'opponent of second player');

// 5. Record move
console.log('▸ recordMove()');
const tm3 = new TurnManager(['black', 'white']);
tm3.recordMove({ from: [0, 0, 0, 0], to: [1, 0, 0, 0] });
assert(tm3.moveHistory.length === 1, 'history has 1 entry');
assert(tm3.moveHistory[0].player === 'black', 'recorded for current player');
assert(tm3.moveHistory[0].move.to[0] === 1, 'move data stored');

// 6. Record and advance
console.log('▸ recordAndAdvance()');
tm3.recordAndAdvance({ capture: true });
assert(tm3.currentPlayer === 'white', 'advanced to next player');
assert(tm3.moveHistory.length === 2, 'history has 2 entries');

// 7. Undo
console.log('▸ undo()');
const tm4 = new TurnManager(['a', 'b']);
tm4.recordAndAdvance({ move: 1 });
tm4.recordAndAdvance({ move: 2 });
assert(tm4.currentPlayer === 'a', 'back at a after 2 moves');
const undone = tm4.undo();
assert(undone.move.move === 2, 'undo returns last move');
assert(tm4.currentPlayer === 'b', 'back to previous player');
assert(tm4.canUndo(), 'can undo again');

// 8. Redo
console.log('▸ redo()');
const redone = tm4.redo();
assert(redone.move.move === 2, 'redo returns undone move');
assert(tm4.currentPlayer === 'a', 'advanced again after redo');

// 9. Undo clears redo stack on new move
console.log('▸ undo + new move clears redo');
const tm5 = new TurnManager(['x', 'o']);
tm5.recordAndAdvance({ m: 1 });
tm5.recordAndAdvance({ m: 2 });
tm5.undo();
tm5.recordAndAdvance({ m: 3 }); // new branch
assert(!tm5.canRedo(), 'redo stack cleared after new move');

// 10. Undo at empty
console.log('▸ undo at empty');
const tm6 = new TurnManager(['a', 'b']);
assert(tm6.undo() === null, 'undo at empty returns null');
assert(!tm6.canUndo(), 'cannot undo at empty');

// 11. lastMoves
console.log('▸ lastMoves()');
const tm7 = new TurnManager(['a', 'b']);
for (let i = 0; i < 10; i++) tm7.recordAndAdvance({ i });
const last = tm7.lastMoves(3);
assert(last.length === 3, 'lastMoves returns requested count');
assert(last[2].move.i === 9, 'last entry is most recent');

// 12. movesBy
console.log('▸ movesBy()');
const byA = tm7.movesBy('a');
assert(byA.length === 5, '5 moves by player a');
assert(byA.every(e => e.player === 'a'), 'all filtered to player a');

// 13. Multi-player (3+)
console.log('▸ 3+ players');
const tm8 = new TurnManager(['red', 'blue', 'green']);
assert(tm8.currentPlayer === 'red', 'starts red');
tm8.nextTurn(); assert(tm8.currentPlayer === 'blue', 'then blue');
tm8.nextTurn(); assert(tm8.currentPlayer === 'green', 'then green');
tm8.nextTurn(); assert(tm8.currentPlayer === 'red', 'wraps to red');

// 14. Metadata
console.log('▸ getMetadata()');
const meta = tm7.getMetadata();
assert(meta.currentPlayer === 'a', 'metadata has currentPlayer');
assert(meta.moveCount === 10, 'metadata has moveCount');
assert(meta.historyLength === 10, 'metadata has historyLength');
assert(typeof meta.canUndo === 'boolean', 'metadata has canUndo');

// 15. Reset
console.log('▸ reset()');
tm7.reset();
assert(tm7.currentPlayer === 'a', 'reset returns to first player');
assert(tm7.moveCount === 0, 'moveCount reset');
assert(tm7.moveHistory.length === 0, 'history cleared');

// 16. MaxHistory
console.log('▸ maxHistory');
const tm9 = new TurnManager(['a', 'b'], { maxHistory: 5 });
for (let i = 0; i < 10; i++) tm9.recordAndAdvance({ i });
assert(tm9.moveHistory.length === 5, 'history trimmed to max');

console.log(`\n${'─'.repeat(36)}`);
console.log(`TurnManager: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
