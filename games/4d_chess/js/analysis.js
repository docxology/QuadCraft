/**
 * Analysis.js - Geometric Analysis for 4D Quadray Chess
 * 
 * Provides position metrics, movement analysis, and data logging.
 */

/**
 * Calculate center control score.
 * Measures how many pieces are near the board center.
 * @param {Board} board - The game board
 * @param {string} color - Player color
 * @returns {number} Center control score (0-100)
 */
function calculateCenterControl(board, color) {
    const pieces = board.getPiecesByColor(color);
    const centerPoint = new Quadray(2, 2, 0, 0).normalized();
    let totalScore = 0;

    for (const piece of pieces) {
        const distance = Quadray.distance(piece.position, centerPoint);
        // Closer to center = higher score (max distance ~4, so invert)
        const score = Math.max(0, (4 - distance) / 4) * 100;
        totalScore += score;
    }

    // Normalize by number of pieces
    return pieces.length > 0 ? totalScore / pieces.length : 0;
}

/**
 * Calculate mobility score.
 * Total number of valid moves available.
 * @param {Board} board - The game board
 * @param {string} color - Player color
 * @returns {number} Total valid moves
 */
function calculateMobilityScore(board, color) {
    const pieces = board.getPiecesByColor(color);
    let totalMoves = 0;

    for (const piece of pieces) {
        totalMoves += piece.getValidMoves(board).length;
    }

    return totalMoves;
}

/**
 * Calculate piece spread.
 * Measures how spread out pieces are (territorial control).
 * @param {Board} board - The game board
 * @param {string} color - Player color
 * @returns {number} Spread score (higher = more spread)
 */
function calculatePieceSpread(board, color) {
    const pieces = board.getPiecesByColor(color);
    if (pieces.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
            totalDistance += Quadray.distance(pieces[i].position, pieces[j].position);
            comparisons++;
        }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0;
}

/**
 * Calculate material score.
 * Sum of piece values.
 * @param {Board} board - The game board
 * @param {string} color - Player color
 * @returns {number} Material value
 */
function calculateMaterialScore(board, color) {
    const pieceValues = {
        [PieceType.KING]: 0, // King is invaluable
        [PieceType.QUEEN]: 9,
        [PieceType.ROOK]: 5,
        [PieceType.BISHOP]: 3,
        [PieceType.KNIGHT]: 3,
        [PieceType.PAWN]: 1
    };

    const pieces = board.getPiecesByColor(color);
    let total = 0;

    for (const piece of pieces) {
        total += pieceValues[piece.type] || 0;
    }

    return total;
}

/**
 * Get comprehensive position metrics.
 * @param {Game} game - The game instance
 * @returns {object} All metrics for both players
 */
function getPositionMetrics(game) {
    const board = game.board;

    return {
        white: {
            centerControl: calculateCenterControl(board, PlayerColor.WHITE),
            mobility: calculateMobilityScore(board, PlayerColor.WHITE),
            spread: calculatePieceSpread(board, PlayerColor.WHITE),
            material: calculateMaterialScore(board, PlayerColor.WHITE),
            pieceCount: board.getPiecesByColor(PlayerColor.WHITE).length,
            isInCheck: board.isInCheck(PlayerColor.WHITE)
        },
        black: {
            centerControl: calculateCenterControl(board, PlayerColor.BLACK),
            mobility: calculateMobilityScore(board, PlayerColor.BLACK),
            spread: calculatePieceSpread(board, PlayerColor.BLACK),
            material: calculateMaterialScore(board, PlayerColor.BLACK),
            pieceCount: board.getPiecesByColor(PlayerColor.BLACK).length,
            isInCheck: board.isInCheck(PlayerColor.BLACK)
        },
        moveNumber: game.moveHistory.length,
        currentPlayer: game.currentPlayer,
        gameOver: game.gameOver
    };
}

/**
 * Create detailed move log for export.
 * @param {Game} game - The game instance
 * @returns {object} Move log with metrics
 */
function createMoveLog(game) {
    return {
        totalMoves: game.moveHistory.length,
        moves: game.moveHistory.map((move, index) => ({
            moveNumber: index + 1,
            from: move.from.toString(),
            to: move.to.toString(),
            distance: Quadray.distance(move.from, move.to).toFixed(3),
            captured: move.captured ? `${move.captured.color} ${move.captured.type}` : null
        })),
        summary: {
            whiteMoves: game.moveHistory.filter((_, i) => i % 2 === 0).length,
            blackMoves: game.moveHistory.filter((_, i) => i % 2 === 1).length,
            captures: game.moveHistory.filter(m => m.captured).length
        }
    };
}

/**
 * Log game metrics to console with formatting.
 * @param {Game} game - The game instance
 */
function logGameMetrics(game) {
    const metrics = getPositionMetrics(game);

    console.group('📊 GAME ANALYSIS');
    console.log(`Move: ${metrics.moveNumber} | Turn: ${metrics.currentPlayer.toUpperCase()}`);

    console.group('⚪ WHITE');
    console.log(`Pieces: ${metrics.white.pieceCount} | Material: ${metrics.white.material}`);
    console.log(`Mobility: ${metrics.white.mobility} | Center: ${metrics.white.centerControl.toFixed(1)}%`);
    console.log(`Spread: ${metrics.white.spread.toFixed(2)} | Check: ${metrics.white.isInCheck}`);
    console.groupEnd();

    console.group('⚫ BLACK');
    console.log(`Pieces: ${metrics.black.pieceCount} | Material: ${metrics.black.material}`);
    console.log(`Mobility: ${metrics.black.mobility} | Center: ${metrics.black.centerControl.toFixed(1)}%`);
    console.log(`Spread: ${metrics.black.spread.toFixed(2)} | Check: ${metrics.black.isInCheck}`);
    console.groupEnd();

    console.groupEnd();

    return metrics;
}

/**
 * Calculate distance statistics for all moves made.
 * @param {Game} game - The game instance
 * @returns {object} Distance statistics
 */
function getDistanceStats(game) {
    const distances = game.moveHistory.map(m => Quadray.distance(m.from, m.to));

    if (distances.length === 0) {
        return { min: 0, max: 0, avg: 0, total: 0 };
    }

    return {
        min: Math.min(...distances),
        max: Math.max(...distances),
        avg: distances.reduce((a, b) => a + b, 0) / distances.length,
        total: distances.reduce((a, b) => a + b, 0)
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOMETRIC VERIFICATION FUNCTIONS
// Triple-check the Quadray/IVM math foundations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the angle between two Quadray vectors (in degrees).
 * @param {Quadray} q1 - First quadray
 * @param {Quadray} q2 - Second quadray
 * @returns {number} Angle in degrees
 */
function angleBetweenQuadrays(q1, q2) {
    const c1 = q1.toCartesian();
    const c2 = q2.toCartesian();
    const dot = c1.x * c2.x + c1.y * c2.y + c1.z * c2.z;
    const mag1 = Math.sqrt(c1.x ** 2 + c1.y ** 2 + c1.z ** 2);
    const mag2 = Math.sqrt(c2.x ** 2 + c2.y ** 2 + c2.z ** 2);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Verify that Quadray round-trip conversion (Quadray -> Cartesian -> Quadray) is accurate.
 * @param {Quadray} q - The quadray to test
 * @param {number} tolerance - Acceptable error
 * @returns {{passed: boolean, error: number, original: Quadray, recovered: Quadray}}
 */
function verifyRoundTrip(q, tolerance = 0.01) {
    const cart = q.toCartesian();
    const recovered = Quadray.fromCartesian(cart.x, cart.y, cart.z);
    const error = Quadray.distance(q.normalized(), recovered.normalized());
    return {
        passed: error < tolerance,
        error: error,
        original: q,
        recovered: recovered
    };
}

/**
 * Comprehensive geometric identity verification.
 * Checks all critical mathematical properties of the Quadray/IVM system.
 * @returns {object} Verification results with pass/fail for each check
 */
function verifyGeometricIdentities() {
    const TOLERANCE = 0.01;
    const EXPECTED_TETRAHEDRAL_ANGLE = 109.4712; // arccos(-1/3) in degrees
    const EXPECTED_BASIS_LENGTH = 1 / Math.sqrt(2); // ~0.7071

    const results = {
        timestamp: new Date().toISOString(),
        checks: [],
        allPassed: true
    };

    // 1. Verify all basis vectors have equal length
    const basisLengths = Quadray.BASIS.map(b => b.length());
    const basisLengthCheck = {
        name: 'Basis Vector Lengths',
        description: 'All 4 basis vectors should have equal length (~0.707)',
        expected: EXPECTED_BASIS_LENGTH.toFixed(4),
        actual: basisLengths.map(l => l.toFixed(4)),
        passed: basisLengths.every(l => Math.abs(l - EXPECTED_BASIS_LENGTH) < TOLERANCE)
    };
    results.checks.push(basisLengthCheck);
    if (!basisLengthCheck.passed) results.allPassed = false;

    // 2. Verify tetrahedral angles between all basis pairs
    const anglePairs = [];
    const basisLabels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            const angle = angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]);
            anglePairs.push({
                pair: `${basisLabels[i]}-${basisLabels[j]}`,
                angle: angle.toFixed(2)
            });
        }
    }
    const tetrahedralAngleCheck = {
        name: 'Tetrahedral Symmetry',
        description: `All basis vector pairs should form ${EXPECTED_TETRAHEDRAL_ANGLE.toFixed(2)}° angles`,
        expected: EXPECTED_TETRAHEDRAL_ANGLE.toFixed(2),
        actual: anglePairs,
        passed: anglePairs.every(p => Math.abs(parseFloat(p.angle) - EXPECTED_TETRAHEDRAL_ANGLE) < 1.0)
    };
    results.checks.push(tetrahedralAngleCheck);
    if (!tetrahedralAngleCheck.passed) results.allPassed = false;

    // 3. Verify origin converts to Cartesian origin
    const originCart = Quadray.ORIGIN.toCartesian();
    const originCheck = {
        name: 'Origin Identity',
        description: 'Quadray origin (0,0,0,0) should map to Cartesian origin (0,0,0)',
        expected: '{x: 0, y: 0, z: 0}',
        actual: `{x: ${originCart.x.toFixed(4)}, y: ${originCart.y.toFixed(4)}, z: ${originCart.z.toFixed(4)}}`,
        passed: Math.abs(originCart.x) < TOLERANCE && Math.abs(originCart.y) < TOLERANCE && Math.abs(originCart.z) < TOLERANCE
    };
    results.checks.push(originCheck);
    if (!originCheck.passed) results.allPassed = false;

    // 4. Verify round-trip conversion for multiple test points
    const testPoints = [
        new Quadray(1, 0, 0, 0),
        new Quadray(0, 1, 0, 0),
        new Quadray(0, 0, 1, 0),
        new Quadray(0, 0, 0, 1),
        new Quadray(2, 1, 0, 1),
        new Quadray(3, 2, 1, 0)
    ];
    const roundTripResults = testPoints.map(q => verifyRoundTrip(q));
    const roundTripCheck = {
        name: 'Round-Trip Conversion',
        description: 'Quadray → Cartesian → Quadray should recover original position',
        expected: 'error < 0.01 for all test points',
        actual: roundTripResults.map((r, i) => `Point ${i + 1}: error=${r.error.toFixed(4)}`),
        passed: roundTripResults.every(r => r.passed)
    };
    results.checks.push(roundTripCheck);
    if (!roundTripCheck.passed) results.allPassed = false;

    // 5. Verify distance formula symmetry
    const q1 = new Quadray(1, 0, 0, 0);
    const q2 = new Quadray(0, 1, 0, 0);
    const d1 = Quadray.distance(q1, q2);
    const d2 = Quadray.distance(q2, q1);
    const symmetryCheck = {
        name: 'Distance Symmetry',
        description: 'distance(A, B) should equal distance(B, A)',
        expected: 'd1 === d2',
        actual: `d1=${d1.toFixed(6)}, d2=${d2.toFixed(6)}`,
        passed: Math.abs(d1 - d2) < 0.0001
    };
    results.checks.push(symmetryCheck);
    if (!symmetryCheck.passed) results.allPassed = false;

    // 6. Verify triangle inequality
    const q3 = new Quadray(0, 0, 1, 0);
    const d12 = Quadray.distance(q1, q2);
    const d23 = Quadray.distance(q2, q3);
    const d13 = Quadray.distance(q1, q3);
    const triangleCheck = {
        name: 'Triangle Inequality',
        description: 'd(A,B) + d(B,C) >= d(A,C) for all points',
        expected: `${d12.toFixed(4)} + ${d23.toFixed(4)} >= ${d13.toFixed(4)}`,
        actual: `${(d12 + d23).toFixed(4)} >= ${d13.toFixed(4)}`,
        passed: d12 + d23 >= d13 - TOLERANCE
    };
    results.checks.push(triangleCheck);
    if (!triangleCheck.passed) results.allPassed = false;

    // Log results to console
    console.group('🔬 GEOMETRIC VERIFICATION');
    console.log(`Timestamp: ${results.timestamp}`);
    for (const check of results.checks) {
        const icon = check.passed ? '✅' : '❌';
        console.group(`${icon} ${check.name}`);
        console.log(`Description: ${check.description}`);
        console.log(`Expected: ${check.expected}`);
        console.log(`Actual:`, check.actual);
        console.groupEnd();
    }
    console.log(`\n${results.allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
    console.groupEnd();

    return results;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateCenterControl,
        calculateMobilityScore,
        calculatePieceSpread,
        calculateMaterialScore,
        getPositionMetrics,
        createMoveLog,
        logGameMetrics,
        getDistanceStats,
        angleBetweenQuadrays,
        verifyRoundTrip,
        verifyGeometricIdentities
    };
}

