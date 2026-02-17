/**
 * test_checkers.js
 * Unit tests for 4D Checkers logic.
 */

// Simple test runner
const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
};

// Import modules (mock verify in browser or node)
// In a real setup, we'd use a proper import or module system.
// For this standalone script, we assume classes are available globally or we simulate imports.

// Mock setup for Node.js execution if needed
if (typeof require !== 'undefined') {
    // This part would need proper module.exports in the source files, which we added.
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { CheckersBoard, PieceType, PlayerColor } = require('../js/checkers_board.js');

    // Assign to global for test functions
    global.Quadray = Quadray;
    global.CheckersBoard = CheckersBoard;
    global.PieceType = PieceType;
    global.PlayerColor = PlayerColor;
}

function runTests() {
    console.log("Running 4D Checkers Tests...");

    testInitialSetup();
    testValidMoves();
    testCapture();
    testPromotion();

    console.log("All tests completed!");
}

function testInitialSetup() {
    const board = new CheckersBoard(4);
    assert(board.pieces.size > 0, "Board should have pieces");

    const redPieces = Array.from(board.pieces.values()).filter(p => p.color === PlayerColor.RED);
    assert(redPieces.length > 0, "Should have Red pieces");

    // Check specific position
    const origin = new Quadray(0, 0, 0, 0);
    const p = board.getPieceAt(origin);
    assert(p && p.color === PlayerColor.RED, "Origin should have Red piece");
}

function testValidMoves() {
    const board = new CheckersBoard(4);
    board.pieces.clear(); // Clear for custom setup

    // Place a Red piece at (0,0,0,0)
    const p1 = new Quadray(0, 0, 0, 0);
    board.addPiece(PlayerColor.RED, p1);

    // It should have moves to (1,1,0,0), (1,0,1,0), (1,0,0,1), etc.
    const piece = board.getPieceAt(p1);
    const moves = board.getValidMoves(piece);

    assert(moves.length > 0, "Piece at origin should have moves");

    // Check specific move
    const target = new Quadray(1, 1, 0, 0);
    const hasMove = moves.some(m => m.to.equals(target));
    assert(hasMove, "Should serve move to (1,1,0,0)");
}

function testCapture() {
    const board = new CheckersBoard(4);
    board.pieces.clear();

    // Red at (0,0,0,0)
    const p1 = new Quadray(0, 0, 0, 0);
    board.addPiece(PlayerColor.RED, p1);

    // Black at (1,1,0,0)
    const p2 = new Quadray(1, 1, 0, 0);
    board.addPiece(PlayerColor.BLACK, p2);

    // Red should be able to jump to (2,2,0,0)
    const piece = board.getPieceAt(p1);
    const moves = board.getValidMoves(piece);

    const captureMove = moves.find(m => m.type === 'capture');
    assert(captureMove, "Should have a capture move");
    assert(captureMove.to.equals(new Quadray(2, 2, 0, 0)), "Capture target should be (2,2,0,0)");

    // Execute
    board.executeMove(captureMove);
    assert(!board.getPieceAt(p1), "Start should be empty");
    assert(board.getPieceAt(new Quadray(2, 2, 0, 0)), "Target should be occupied");
    assert(!board.getPieceAt(p2), "Captured piece should be gone");
}

function testPromotion() {
    const board = new CheckersBoard(4);
    board.pieces.clear();

    // Red piece at (2,2,2,0) [Sum 6] moving to (3,3,2,0) [Sum 8]
    // Should promote at Sum >= 8

    const p1 = new Quadray(2, 2, 2, 0);
    board.addPiece(PlayerColor.RED, p1);

    // Move to (3,3,2,0)
    const target = new Quadray(3, 3, 2, 0);

    // Manually force move
    const move = {
        type: 'move',
        from: p1,
        to: target
    };

    board.executeMove(move);

    const piece = board.getPieceAt(target);
    const n = piece.position.normalized();
    const sum = n.a + n.b + n.c + n.d;
    console.log("Promotion target sum:", sum);
    assert(piece.type === PieceType.KING, "Piece should promote to King at Sum >= 8");
}

// Run if main
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}
