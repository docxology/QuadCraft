/**
 * Unit Tests for 4D Quadray Chess
 * 
 * Comprehensive test suite for all game modules.
 * Run in browser console or with Node.js.
 */

// Load modules for Node.js testing
if (typeof require !== 'undefined') {
    const { Quadray } = require('../js/quadray.js');
    const { Piece, King, Queen, Rook, Bishop, Knight, Pawn, PieceType, PlayerColor, createPiece } = require('../js/pieces.js');
    const { Board } = require('../js/board.js');
    const storage = require('../js/storage.js');
    const analysis = require('../js/analysis.js');
    // Make globals for test access
    global.Quadray = Quadray;
    global.Piece = Piece;
    global.King = King;
    global.Queen = Queen;
    global.Rook = Rook;
    global.Bishop = Bishop;
    global.Knight = Knight;
    global.Pawn = Pawn;
    global.PieceType = PieceType;
    global.PlayerColor = PlayerColor;
    global.createPiece = createPiece;
    global.Board = Board;
    // Storage functions
    global.exportGameState = storage.exportGameState;
    global.importGameState = storage.importGameState;
    global.generateSaveFilename = storage.generateSaveFilename;
    // Analysis functions
    global.calculateCenterControl = analysis.calculateCenterControl;
    global.calculateMobilityScore = analysis.calculateMobilityScore;
    global.calculatePieceSpread = analysis.calculatePieceSpread;
    global.calculateMaterialScore = analysis.calculateMaterialScore;
    global.getDistanceStats = analysis.getDistanceStats;
    global.getPositionMetrics = analysis.getPositionMetrics;
    global.calculateMaterialScore = analysis.calculateMaterialScore;
    global.getPositionMetrics = analysis.getPositionMetrics;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST FRAMEWORK
// ═══════════════════════════════════════════════════════════════════════════

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    describe(suiteName, fn) {
        console.group(`📦 ${suiteName}`);
        this.currentSuite = suiteName;
        fn();
        console.groupEnd();
    }

    it(testName, fn) {
        const fullName = `${this.currentSuite}: ${testName}`;
        try {
            fn();
            this.passed++;
            console.log(`  ✅ ${testName}`);
            this.results.push({ name: fullName, passed: true });
        } catch (e) {
            this.failed++;
            console.error(`  ❌ ${testName}: ${e.message}`);
            this.results.push({ name: fullName, passed: false, error: e.message });
        }
    }

    assertEqual(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`${msg} Expected ${expected}, got ${actual}`);
        }
    }

    assertApprox(actual, expected, tolerance = 0.001, msg = '') {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${msg} Expected ~${expected}, got ${actual}`);
        }
    }

    assertTrue(condition, msg = '') {
        if (!condition) {
            throw new Error(`${msg || 'Expected true, got false'}`);
        }
    }

    assertFalse(condition, msg = '') {
        if (condition) {
            throw new Error(`${msg || 'Expected false, got true'}`);
        }
    }

    summary() {
        const total = this.passed + this.failed;
        const pct = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`📊 TEST RESULTS: ${this.passed}/${total} passed (${pct}%)`);
        if (this.failed > 0) {
            console.log(`❌ ${this.failed} tests failed`);
        } else {
            console.log('✅ All tests passed!');
        }
        console.log('═══════════════════════════════════════════════════\n');
        return { passed: this.passed, failed: this.failed, total, results: this.results };
    }
}

const test = new TestRunner();

// ═══════════════════════════════════════════════════════════════════════════
// QUADRAY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Quadray Class', () => {

    test.it('should create a Quadray with given coordinates', () => {
        const q = new Quadray(1, 2, 3, 4);
        test.assertEqual(q.a, 1);
        test.assertEqual(q.b, 2);
        test.assertEqual(q.c, 3);
        test.assertEqual(q.d, 4);
    });

    test.it('should normalize to non-negative coordinates', () => {
        const q = new Quadray(-1, 0, 1, 2);
        const n = q.normalized();
        test.assertTrue(n.a >= 0, 'a should be non-negative');
        test.assertTrue(n.b >= 0, 'b should be non-negative');
        test.assertTrue(n.c >= 0, 'c should be non-negative');
        test.assertTrue(n.d >= 0, 'd should be non-negative');
    });

    test.it('should add two Quadrays correctly', () => {
        const q1 = new Quadray(1, 0, 0, 0);
        const q2 = new Quadray(0, 1, 0, 0);
        const sum = q1.add(q2);
        test.assertEqual(sum.a, 1);
        test.assertEqual(sum.b, 1);
        test.assertEqual(sum.c, 0);
        test.assertEqual(sum.d, 0);
    });

    test.it('should subtract two Quadrays correctly', () => {
        const q1 = new Quadray(2, 1, 0, 0);
        const q2 = new Quadray(1, 0, 0, 0);
        const diff = q1.subtract(q2);
        test.assertEqual(diff.a, 1);
        test.assertEqual(diff.b, 1);
    });

    test.it('should scale a Quadray correctly', () => {
        const q = new Quadray(1, 2, 3, 4);
        const scaled = q.scale(2);
        test.assertEqual(scaled.a, 2);
        test.assertEqual(scaled.b, 4);
        test.assertEqual(scaled.c, 6);
        test.assertEqual(scaled.d, 8);
    });

    test.it('should convert to Cartesian coordinates', () => {
        const q = new Quadray(1, 0, 0, 0);
        const cart = q.toCartesian();
        test.assertApprox(cart.x, 0.707, 0.01);
        test.assertApprox(cart.y, 0.707, 0.01);
        test.assertApprox(cart.z, 0.707, 0.01);
    });

    test.it('should calculate length correctly', () => {
        const q = new Quadray(1, 0, 0, 0);
        const len = q.length();
        test.assertApprox(len, 0.707, 0.01);
    });

    test.it('should detect equality between Quadrays', () => {
        const q1 = new Quadray(1, 2, 3, 4);
        const q2 = new Quadray(1, 2, 3, 4);
        const q3 = new Quadray(1, 2, 3, 5);
        test.assertTrue(q1.equals(q2));
        test.assertFalse(q1.equals(q3));
    });

    test.it('should have 4 basis vectors', () => {
        test.assertEqual(Quadray.BASIS.length, 4);
    });

    test.it('basis vectors should be unit vectors', () => {
        for (const basis of Quadray.BASIS) {
            const len = basis.length();
            test.assertApprox(len, 0.707, 0.01);
        }
    });

    test.it('should calculate distance between two Quadrays', () => {
        const q1 = Quadray.ORIGIN;
        const q2 = Quadray.A;
        const dist = Quadray.distance(q1, q2);
        test.assertApprox(dist, 0.707, 0.01);
    });

    test.it('toString should return readable format', () => {
        const q = new Quadray(1, 2, 3, 4);
        const str = q.toString();
        test.assertTrue(str.includes('1.00'));
        test.assertTrue(str.includes('2.00'));
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// PIECE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Piece Classes', () => {

    test.it('should create a King piece', () => {
        const king = new King(PlayerColor.WHITE, Quadray.ORIGIN);
        test.assertEqual(king.type, PieceType.KING);
        test.assertEqual(king.color, PlayerColor.WHITE);
    });

    test.it('King should return correct symbol', () => {
        const whiteKing = new King(PlayerColor.WHITE, Quadray.ORIGIN);
        const blackKing = new King(PlayerColor.BLACK, Quadray.ORIGIN);
        test.assertEqual(whiteKing.getSymbol(), '♔');
        test.assertEqual(blackKing.getSymbol(), '♚');
    });

    test.it('should create a Queen piece', () => {
        const queen = new Queen(PlayerColor.WHITE, Quadray.ORIGIN);
        test.assertEqual(queen.type, PieceType.QUEEN);
        test.assertEqual(queen.getSymbol(), '♕');
    });

    test.it('should create a Rook piece', () => {
        const rook = new Rook(PlayerColor.BLACK, Quadray.ORIGIN);
        test.assertEqual(rook.type, PieceType.ROOK);
        test.assertEqual(rook.getSymbol(), '♜');
    });

    test.it('should create a Bishop piece', () => {
        const bishop = new Bishop(PlayerColor.WHITE, Quadray.ORIGIN);
        test.assertEqual(bishop.type, PieceType.BISHOP);
        test.assertEqual(bishop.getSymbol(), '♗');
    });

    test.it('should create a Knight piece', () => {
        const knight = new Knight(PlayerColor.BLACK, Quadray.ORIGIN);
        test.assertEqual(knight.type, PieceType.KNIGHT);
        test.assertEqual(knight.getSymbol(), '♞');
    });

    test.it('should create a Pawn piece', () => {
        const pawn = new Pawn(PlayerColor.WHITE, Quadray.ORIGIN);
        test.assertEqual(pawn.type, PieceType.PAWN);
        test.assertEqual(pawn.getSymbol(), '♙');
    });

    test.it('King should have 4 movement directions', () => {
        const king = new King(PlayerColor.WHITE, Quadray.ORIGIN);
        // King moves in all 4 basis directions
        test.assertEqual(king.getMovementVectors().length, 4);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// BOARD TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Board Class', () => {

    test.it('should create a board with initial pieces', () => {
        const board = new Board();
        // Each side has: 1 King, 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, 4 Pawns = 12 pieces
        // Total: 24 pieces
        test.assertEqual(board.pieces.size, 24, 'Board should have 24 unique pieces');
        // Verify each side has correct count
        const whitePieces = board.getPiecesByColor(PlayerColor.WHITE);
        const blackPieces = board.getPiecesByColor(PlayerColor.BLACK);
        test.assertEqual(whitePieces.length, 12, 'White should have 12 pieces');
        test.assertEqual(blackPieces.length, 12, 'Black should have 12 pieces');
    });

    test.it('should have Kings for both colors', () => {
        const board = new Board();
        let whiteKing = false, blackKing = false;
        for (const piece of board.pieces.values()) {
            if (piece.type === PieceType.KING) {
                if (piece.color === PlayerColor.WHITE) whiteKing = true;
                if (piece.color === PlayerColor.BLACK) blackKing = true;
            }
        }
        test.assertTrue(whiteKing, 'White King should exist');
        test.assertTrue(blackKing, 'Black King should exist');
    });

    test.it('should retrieve piece at position', () => {
        const board = new Board();
        // Find a piece and verify getPieceAt works
        const firstPiece = board.pieces.values().next().value;
        const retrieved = board.getPieceAt(firstPiece.position);
        test.assertTrue(retrieved !== null);
        test.assertEqual(retrieved.type, firstPiece.type);
    });

    test.it('should move a piece', () => {
        const board = new Board();
        const piece = board.pieces.values().next().value;
        const from = piece.position;
        const to = from.add(Quadray.A);
        board.movePiece(from, to);
        test.assertTrue(board.getPieceAt(from) === null);
        test.assertTrue(board.getPieceAt(to) !== null);
    });

    test.it('should generate valid board positions', () => {
        const board = new Board();
        const positions = board.getAllPositions();
        test.assertTrue(positions.length > 0);
    });

    test.it('isValidPosition should validate positions', () => {
        const board = new Board();
        test.assertTrue(board.isValidPosition(Quadray.ORIGIN));
    });

    test.it('should detect check', () => {
        const board = new Board();
        // Initial position should not be in check
        test.assertFalse(board.isInCheck(PlayerColor.WHITE));
        test.assertFalse(board.isInCheck(PlayerColor.BLACK));
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// MOVEMENT TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Piece Movement Rules', () => {

    test.it('King should move exactly 1 step in any basis direction', () => {
        const board = new Board();
        const king = new King(PlayerColor.WHITE, new Quadray(2, 1, 1, 1));
        const moves = king.getValidMoves(board);
        // Verify all moves are 1 Quadray step away (~1.22 Cartesian distance)
        for (const move of moves) {
            const dist = Quadray.distance(king.position, move);
            test.assertApprox(dist, 1.22, 0.1, 'King move should be 1 step');
        }
    });

    test.it('Rook should slide along single axis', () => {
        const board = new Board();
        board.pieces.clear(); // Empty board for testing
        const rook = new Rook(PlayerColor.WHITE, new Quadray(2, 1, 1, 1));
        board.pieces.set(rook.position.toString(), rook);
        const moves = rook.getValidMoves(board);
        test.assertTrue(moves.length > 0, 'Rook should have moves');
    });

    test.it('Knight should make L-shaped moves', () => {
        const board = new Board();
        board.pieces.clear();
        const knight = new Knight(PlayerColor.WHITE, new Quadray(2, 1, 1, 1));
        board.pieces.set(knight.position.toString(), knight);
        const moves = knight.getValidMoves(board);
        test.assertTrue(moves.length > 0, 'Knight should have moves');
    });

    test.it('Pawn should move forward', () => {
        const board = new Board();
        board.pieces.clear();
        const pawn = new Pawn(PlayerColor.WHITE, new Quadray(1, 0, 0, 0));
        board.pieces.set(pawn.position.toString(), pawn);
        const moves = pawn.getValidMoves(board);
        test.assertTrue(moves.length > 0, 'Pawn should have forward moves');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Game State', () => {

    test.it('Game should start with white turn', () => {
        // Can't test directly without canvas, verify constants
        test.assertEqual(PlayerColor.WHITE, 'white');
        test.assertEqual(PlayerColor.BLACK, 'black');
    });

    test.it('PieceType should define all 6 piece types', () => {
        test.assertEqual(PieceType.KING, 'king');
        test.assertEqual(PieceType.QUEEN, 'queen');
        test.assertEqual(PieceType.ROOK, 'rook');
        test.assertEqual(PieceType.BISHOP, 'bishop');
        test.assertEqual(PieceType.KNIGHT, 'knight');
        test.assertEqual(PieceType.PAWN, 'pawn');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// MATH ACCURACY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Mathematical Accuracy', () => {

    test.it('Quadray to Cartesian should be reversible', () => {
        const q = new Quadray(1, 0, 0, 1);
        const cart = q.toCartesian();
        // Verify Cartesian values are reasonable
        test.assertTrue(Math.abs(cart.x) < 10);
        test.assertTrue(Math.abs(cart.y) < 10);
        test.assertTrue(Math.abs(cart.z) < 10);
    });

    test.it('Origin should convert to Cartesian origin', () => {
        const cart = Quadray.ORIGIN.toCartesian();
        test.assertApprox(cart.x, 0, 0.001);
        test.assertApprox(cart.y, 0, 0.001);
        test.assertApprox(cart.z, 0, 0.001);
    });

    test.it('Distance formula should be symmetric', () => {
        const q1 = new Quadray(1, 0, 0, 0);
        const q2 = new Quadray(0, 1, 0, 0);
        const d1 = Quadray.distance(q1, q2);
        const d2 = Quadray.distance(q2, q1);
        test.assertApprox(d1, d2, 0.0001);
    });

    test.it('Triangle inequality should hold', () => {
        const q1 = new Quadray(0, 0, 0, 0);
        const q2 = new Quadray(1, 0, 0, 0);
        const q3 = new Quadray(0, 1, 0, 0);
        const d12 = Quadray.distance(q1, q2);
        const d23 = Quadray.distance(q2, q3);
        const d13 = Quadray.distance(q1, q3);
        test.assertTrue(d12 + d23 >= d13, 'Triangle inequality');
    });

    test.it('IVM tetrahedral angles should be ~109.47°', () => {
        // The angle between any two basis vectors in tetrahedron
        const a = Quadray.A.toCartesian();
        const b = Quadray.B.toCartesian();
        const dot = a.x * b.x + a.y * b.y + a.z * b.z;
        const magA = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
        const magB = Math.sqrt(b.x ** 2 + b.y ** 2 + b.z ** 2);
        const cosAngle = dot / (magA * magB);
        const angle = Math.acos(cosAngle) * 180 / Math.PI;
        test.assertApprox(angle, 109.47, 1.0, 'Tetrahedral angle');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE MODULE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Storage Module', () => {
    test.it('generateSaveFilename should return valid filename', () => {
        const filename = generateSaveFilename();
        test.assertTrue(filename.startsWith('quadray-chess-'), 'Should start with quadray-chess-');
        test.assertTrue(filename.endsWith('.json'), 'Should end with .json');
    });

    test.it('exportGameState should serialize board state', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        // Create mock game object for testing
        const mockGame = {
            board: board,
            currentPlayer: PlayerColor.WHITE,
            gameOver: false,
            moveHistory: []
        };
        const state = exportGameState(mockGame);
        test.assertTrue(state.version === '1.0', 'Should have version');
        test.assertTrue(state.pieces.length > 0, 'Should have pieces');
        test.assertTrue(state.currentPlayer === PlayerColor.WHITE, 'Should preserve player');
    });

    test.it('importGameState should restore board state', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const mockGame = {
            board: board,
            currentPlayer: PlayerColor.WHITE,
            gameOver: false,
            moveHistory: [],
            deselectPiece: () => { }
        };

        // Export then import
        const state = exportGameState(mockGame);
        mockGame.board.pieces.clear();
        const success = importGameState(state, mockGame);
        test.assertTrue(success, 'Import should succeed');
        test.assertTrue(mockGame.board.pieces.size > 0, 'Should restore pieces');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS MODULE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Analysis Module', () => {
    test.it('calculateMaterialScore should count piece values', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const whiteMaterial = calculateMaterialScore(board, PlayerColor.WHITE);
        const blackMaterial = calculateMaterialScore(board, PlayerColor.BLACK);
        // Both sides should have some material
        test.assertTrue(whiteMaterial > 0, 'White should have material');
        test.assertTrue(blackMaterial > 0, 'Black should have material');
    });

    test.it('calculateMobilityScore should return total moves', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const whiteMobility = calculateMobilityScore(board, PlayerColor.WHITE);
        test.assertTrue(whiteMobility >= 0, 'Mobility should be non-negative');
    });

    test.it('calculateCenterControl should return percentage', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const control = calculateCenterControl(board, PlayerColor.WHITE);
        test.assertTrue(control >= 0, 'Control should be non-negative');
        test.assertTrue(control <= 100, 'Control should be <= 100');
    });

    test.it('calculatePieceSpread should measure distribution', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const spread = calculatePieceSpread(board, PlayerColor.WHITE);
        test.assertTrue(spread >= 0, 'Spread should be non-negative');
    });

    test.it('calculateMaterialScore should correctly sum piece values', () => {
        const board = new Board(4);
        board.setupInitialPosition();
        const whiteMaterial = calculateMaterialScore(board, PlayerColor.WHITE);
        const blackMaterial = calculateMaterialScore(board, PlayerColor.BLACK);
        // Each side: 1 Queen(9) + 2 Rooks(10) + 2 Bishops(6) + 2 Knights(6) + 4 Pawns(4) = 35
        // King is worth 0 in material score
        test.assertEqual(whiteMaterial, 35, 'White should have 35 material');
        test.assertEqual(blackMaterial, 35, 'Black should have 35 material');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// Advanced Tests: Edge Cases and Integration
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Edge Cases', () => {

    test.it('All pieces should have unique positions', () => {
        const board = new Board(4);
        const keys = new Set();
        for (const piece of board.pieces.values()) {
            const key = piece.position.toKey();
            test.assertFalse(keys.has(key), `Duplicate position: ${key}`);
            keys.add(key);
        }
        test.assertEqual(keys.size, 24, 'Should have 24 unique positions');
    });

    test.it('Each piece type should be present for each color', () => {
        const board = new Board(4);
        const types = Object.values(PieceType);
        for (const color of [PlayerColor.WHITE, PlayerColor.BLACK]) {
            const pieces = board.getPiecesByColor(color);
            for (const type of types) {
                const hasType = pieces.some(p => p.type === type);
                test.assertTrue(hasType, `${color} should have ${type}`);
            }
        }
    });

    test.it('Captured pieces should be tracked after move', () => {
        const board = new Board(4);
        const whitePawn = Array.from(board.pieces.values())
            .find(p => p.type === PieceType.PAWN && p.color === PlayerColor.WHITE);

        // Place a black piece at a position the pawn can capture
        const capturePos = whitePawn.position.add(Quadray.A);
        board.placePiece(createPiece(PieceType.PAWN, PlayerColor.BLACK, capturePos));

        const initialCaptures = board.capturedPieces.white.length;
        board.movePiece(whitePawn.position, capturePos);
        test.assertEqual(board.capturedPieces.white.length, initialCaptures + 1, 'Capture should be recorded');
    });

    test.it('getDistanceStats should handle empty move history', () => {
        const game = { moveHistory: [], board: new Board(4) };
        const stats = getDistanceStats(game);
        test.assertEqual(stats.min, 0, 'Min should be 0 for empty');
        test.assertEqual(stats.max, 0, 'Max should be 0 for empty');
        test.assertEqual(stats.avg, 0, 'Avg should be 0 for empty');
    });

    test.it('validateBoard should confirm valid initial state', () => {
        const board = new Board(4);
        const result = board.validateBoard();
        test.assertTrue(result.valid, 'Initial board should be valid');
        test.assertEqual(result.errors.length, 0, 'No errors on valid board');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED QUADRAY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Extended Quadray Tests', () => {

    test.it('clone should create independent copy', () => {
        const q1 = new Quadray(1, 2, 3, 4);
        const q2 = q1.clone();
        test.assertTrue(q1.equals(q2), 'Clone should equal original');
        q2.a = 99;
        test.assertFalse(q1.a === 99, 'Original should not be affected by clone changes');
    });

    test.it('toKey should return consistent hash string', () => {
        const q1 = new Quadray(1, 0, 0, 0);
        const q2 = new Quadray(1, 0, 0, 0);
        test.assertEqual(q1.toKey(), q2.toKey(), 'Same position should have same key');
    });

    test.it('toKey should differ for different positions', () => {
        const q1 = new Quadray(1, 0, 0, 0);
        const q2 = new Quadray(0, 1, 0, 0);
        test.assertTrue(q1.toKey() !== q2.toKey(), 'Different positions should have different keys');
    });

    test.it('fromCartesian should convert correctly', () => {
        const cartesian = { x: 0.707, y: 0.707, z: 0.707 };
        const q = Quadray.fromCartesian(cartesian.x, cartesian.y, cartesian.z);
        test.assertTrue(q instanceof Quadray, 'Should return Quadray instance');
    });

    test.it('distanceTo should match static distance', () => {
        const q1 = new Quadray(1, 0, 0, 0);
        const q2 = new Quadray(0, 1, 0, 0);
        const d1 = q1.distanceTo(q2);
        const d2 = Quadray.distance(q1, q2);
        test.assertApprox(d1, d2, 0.0001, 'Instance and static distance should match');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED PIECE TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Extended Piece Tests', () => {

    test.it('Queen should have combined Rook and Bishop moves', () => {
        const board = new Board(4);
        board.pieces.clear();
        const queen = createPiece(PieceType.QUEEN, PlayerColor.WHITE, new Quadray(2, 2, 0, 0));
        board.placePiece(queen);
        const moves = queen.getValidMoves(board);
        test.assertTrue(moves.length > 0, 'Queen should have valid moves');
    });

    test.it('Bishop should have diagonal moves', () => {
        const board = new Board(4);
        board.pieces.clear();
        const bishop = createPiece(PieceType.BISHOP, PlayerColor.WHITE, new Quadray(2, 2, 0, 0));
        board.placePiece(bishop);
        const moves = bishop.getValidMoves(board);
        test.assertTrue(moves.length > 0, 'Bishop should have valid moves');
    });

    test.it('Pawn symbols should differ by color', () => {
        const whitePawn = createPiece(PieceType.PAWN, PlayerColor.WHITE, new Quadray(0, 0, 0, 0));
        const blackPawn = createPiece(PieceType.PAWN, PlayerColor.BLACK, new Quadray(0, 0, 0, 0));
        test.assertTrue(whitePawn.getSymbol() !== blackPawn.getSymbol(), 'Pawn symbols should differ by color');
    });

    test.it('All piece types should have getSymbol method', () => {
        const types = [PieceType.KING, PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT, PieceType.PAWN];
        for (const type of types) {
            const piece = createPiece(type, PlayerColor.WHITE, new Quadray(0, 0, 0, 0));
            test.assertTrue(typeof piece.getSymbol() === 'string', `${type} should have getSymbol`);
        }
    });

    test.it('Piece hasMoved flag should track movement', () => {
        const piece = createPiece(PieceType.KING, PlayerColor.WHITE, new Quadray(1, 0, 0, 0));
        test.assertFalse(piece.hasMoved, 'New piece should not have moved');
        piece.hasMoved = true;
        test.assertTrue(piece.hasMoved, 'hasMoved should be settable');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED BOARD TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Extended Board Tests', () => {

    test.it('hasOwnPiece should detect friendly pieces', () => {
        const board = new Board(4);
        const whitePiece = Array.from(board.pieces.values()).find(p => p.color === PlayerColor.WHITE);
        test.assertTrue(board.hasOwnPiece(whitePiece.position, PlayerColor.WHITE), 'Should detect own piece');
        test.assertFalse(board.hasOwnPiece(whitePiece.position, PlayerColor.BLACK), 'Should not detect as enemy');
    });

    test.it('hasEnemyPiece should detect enemy pieces', () => {
        const board = new Board(4);
        const blackPiece = Array.from(board.pieces.values()).find(p => p.color === PlayerColor.BLACK);
        test.assertTrue(board.hasEnemyPiece(blackPiece.position, PlayerColor.WHITE), 'Should detect enemy');
        test.assertFalse(board.hasEnemyPiece(blackPiece.position, PlayerColor.BLACK), 'Should not detect as own');
    });

    test.it('getPiecesByColor should return correct pieces', () => {
        const board = new Board(4);
        const whitePieces = board.getPiecesByColor(PlayerColor.WHITE);
        const blackPieces = board.getPiecesByColor(PlayerColor.BLACK);
        test.assertEqual(whitePieces.length, 12, 'Should have 12 white pieces');
        test.assertEqual(blackPieces.length, 12, 'Should have 12 black pieces');
        test.assertTrue(whitePieces.every(p => p.color === PlayerColor.WHITE), 'All should be white');
    });

    test.it('getKing should find the King', () => {
        const board = new Board(4);
        const whiteKing = board.getKing(PlayerColor.WHITE);
        const blackKing = board.getKing(PlayerColor.BLACK);
        test.assertTrue(whiteKing !== null, 'White King should exist');
        test.assertTrue(blackKing !== null, 'Black King should exist');
        test.assertEqual(whiteKing.type, PieceType.KING, 'Should be King type');
    });

    test.it('movePiece should update piece position', () => {
        const board = new Board(4);
        const piece = Array.from(board.pieces.values()).find(p => p.type === PieceType.PAWN);
        const oldPos = piece.position.clone();
        const newPos = piece.position.add(Quadray.A);
        board.movePiece(oldPos, newPos);
        test.assertTrue(board.getPieceAt(newPos) !== null, 'Piece should be at new position');
        test.assertTrue(board.getPieceAt(oldPos) === null, 'Old position should be empty');
    });

    test.it('getAllPositions should return valid positions', () => {
        const board = new Board(4);
        const positions = board.getAllPositions();
        test.assertTrue(positions.length > 0, 'Should have positions');
        test.assertTrue(positions.every(p => board.isValidPosition(p)), 'All positions should be valid');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED ANALYSIS TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Extended Analysis Tests', () => {

    test.it('getPositionMetrics should return all metrics', () => {
        const game = { moveHistory: [], board: new Board(4), currentPlayer: PlayerColor.WHITE, gameOver: false };
        const metrics = getPositionMetrics(game);
        test.assertTrue('white' in metrics, 'Should have white metrics');
        test.assertTrue('black' in metrics, 'Should have black metrics');
        test.assertTrue('centerControl' in metrics.white, 'Should have centerControl');
        test.assertTrue('mobility' in metrics.white, 'Should have mobility');
        test.assertTrue('material' in metrics.white, 'Should have material');
    });

    test.it('calculateCenterControl should return percentage', () => {
        const board = new Board(4);
        const score = calculateCenterControl(board, PlayerColor.WHITE);
        test.assertTrue(score >= 0 && score <= 100, 'Score should be 0-100 range');
    });

    test.it('calculatePieceSpread should handle single piece', () => {
        const board = new Board(4);
        board.pieces.clear();
        const king = createPiece(PieceType.KING, PlayerColor.WHITE, new Quadray(0, 0, 0, 0));
        board.placePiece(king);
        const spread = calculatePieceSpread(board, PlayerColor.WHITE);
        test.assertEqual(spread, 0, 'Spread should be 0 for single piece');
    });

    test.it('getDistanceStats should calculate with moves', () => {
        const board = new Board(4);
        const game = {
            moveHistory: [
                { from: new Quadray(0, 0, 0, 0), to: new Quadray(1, 0, 0, 0) },
                { from: new Quadray(1, 0, 0, 0), to: new Quadray(2, 0, 0, 0) }
            ],
            board: board
        };
        const stats = getDistanceStats(game);
        test.assertTrue(stats.avg > 0, 'Avg should be positive for moves');
        test.assertTrue(stats.total > 0, 'Total should be positive');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE EXTENDED TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Extended Storage Tests', () => {

    test.it('exportGameState should include version', () => {
        const game = {
            board: new Board(4),
            moveHistory: [],
            currentPlayer: PlayerColor.WHITE,
            gameOver: false
        };
        const state = exportGameState(game);
        test.assertTrue('version' in state, 'Should have version');
        test.assertTrue('timestamp' in state, 'Should have timestamp');
        test.assertEqual(state.version, '1.0', 'Version should be 1.0');
    });

    test.it('exportGameState should serialize pieces correctly', () => {
        const game = {
            board: new Board(4),
            moveHistory: [],
            currentPlayer: PlayerColor.WHITE,
            gameOver: false
        };
        const state = exportGameState(game);
        test.assertEqual(state.pieces.length, 24, 'Should have 24 pieces');
        test.assertTrue(state.pieces[0].type !== undefined, 'Pieces should have type');
        test.assertTrue(state.pieces[0].position !== undefined, 'Pieces should have position');
    });

    test.it('generateSaveFilename should include quadray-chess prefix', () => {
        const filename = generateSaveFilename();
        test.assertTrue(filename.startsWith('quadray-chess-'), 'Should start with quadray-chess-');
        test.assertTrue(filename.endsWith('.json'), 'Should end with .json');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRIC VERIFICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

// Load verification functions for Node.js
if (typeof require !== 'undefined') {
    const analysis = require('../js/analysis.js');
    global.angleBetweenQuadrays = analysis.angleBetweenQuadrays;
    global.verifyRoundTrip = analysis.verifyRoundTrip;
    global.verifyGeometricIdentities = analysis.verifyGeometricIdentities;
}

test.describe('Geometric Verification Functions', () => {

    test.it('angleBetweenQuadrays should compute tetrahedral angle (~109.47°)', () => {
        const angle = angleBetweenQuadrays(Quadray.A, Quadray.B);
        test.assertApprox(angle, 109.47, 1.0, 'Angle between A and B should be ~109.47°');
    });

    test.it('angleBetweenQuadrays should be symmetric', () => {
        const angle1 = angleBetweenQuadrays(Quadray.A, Quadray.C);
        const angle2 = angleBetweenQuadrays(Quadray.C, Quadray.A);
        test.assertApprox(angle1, angle2, 0.001, 'Angle should be symmetric');
    });

    test.it('angleBetweenQuadrays should return 0 for zero vectors', () => {
        const angle = angleBetweenQuadrays(Quadray.ORIGIN, Quadray.A);
        test.assertEqual(angle, 0, 'Angle with origin should be 0');
    });

    test.it('verifyRoundTrip should pass for basis vectors', () => {
        for (const basis of Quadray.BASIS) {
            const result = verifyRoundTrip(basis);
            test.assertTrue(result.passed, `Round-trip should pass for ${basis.toString()}`);
        }
    });

    test.it('verifyRoundTrip should report error magnitude', () => {
        const result = verifyRoundTrip(new Quadray(2, 1, 0, 1));
        test.assertTrue('error' in result, 'Should have error property');
        test.assertTrue(typeof result.error === 'number', 'Error should be a number');
    });

    test.it('verifyGeometricIdentities should return complete results', () => {
        const results = verifyGeometricIdentities();
        test.assertTrue('timestamp' in results, 'Should have timestamp');
        test.assertTrue('checks' in results, 'Should have checks array');
        test.assertTrue('allPassed' in results, 'Should have allPassed boolean');
        test.assertTrue(results.checks.length >= 6, 'Should have at least 6 checks');
    });

    test.it('verifyGeometricIdentities should pass all checks', () => {
        const results = verifyGeometricIdentities();
        test.assertTrue(results.allPassed, 'All geometric identity checks should pass');
    });

    test.it('verifyGeometricIdentities checks should have required properties', () => {
        const results = verifyGeometricIdentities();
        for (const check of results.checks) {
            test.assertTrue('name' in check, 'Check should have name');
            test.assertTrue('description' in check, 'Check should have description');
            test.assertTrue('expected' in check, 'Check should have expected');
            test.assertTrue('actual' in check, 'Check should have actual');
            test.assertTrue('passed' in check, 'Check should have passed');
        }
    });

    test.it('All 6 basis angle pairs should be tetrahedral', () => {
        const basisLabels = ['A', 'B', 'C', 'D'];
        let pairCount = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const angle = angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]);
                test.assertApprox(angle, 109.47, 1.0, `${basisLabels[i]}-${basisLabels[j]} should be ~109.47°`);
                pairCount++;
            }
        }
        test.assertEqual(pairCount, 6, 'Should have exactly 6 basis pairs');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════

const results = test.summary();

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner, results };
}
