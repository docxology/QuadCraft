/**
 * checkers_board.js — 4D Checkers Board Logic
 *
 * Manages the 4D grid, pieces, and valid move generation using
 * Quadray tetrahedral coordinates on an IVM grid.
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, scale, distance, distanceTo,
 *              length, toCartesian, fromCartesian, clone, cellType,
 *              cellVolume, toIVM, equals, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * Board topology uses "Even Sum" positions (sum of coords is even).
 * Red pieces start at low sums (0, 2) and move toward high sums.
 * Black pieces start at high sums (6, 8) and move toward low sums.
 * Pieces move diagonally (changing two coordinates by 1) and jump to capture.
 *
 * @module CheckersBoard
 */

// Node.js compatibility — load shared modules if not already in scope.
// IMPORTANT: Do NOT use `var` here. `var` hoisting creates a script-scope
// binding that shadows the global, which breaks browsers where globals
// are set by prior <script> tags.
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    /* eslint-disable no-global-assign */
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

// Player Colors
const PlayerColor = {
    RED: 'red',
    BLACK: 'black'
};

// Piece Types
const PieceType = {
    MAN: 'man',
    KING: 'king'
};

class CheckersPiece {
    constructor(color, type, position) {
        this.color = color;
        this.type = type;
        this.position = position; // Quadray
    }

    clone() {
        return new CheckersPiece(this.color, this.type, this.position.clone());
    }
}

class CheckersBoard {
    /**
     * @param {number} size - Grid dimension (0 to size-1 per axis)
     */
    constructor(size = 4) {
        this.size = size;
        this.pieces = new Map(); // Key: position string, Value: CheckersPiece
        this.gameOver = false;
        this.moveCount = 0;
        this.moveHistory = [];

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        this.setupInitialPosition();

        console.log(`[CheckersBoard] ${size}x${size}x${size}x${size} IVM grid`);
        console.log(`[CheckersBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[CheckersBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.size - 1, this.size - 1, this.size - 1, this.size - 1),
            new Quadray(this.size - 1, 0, 0, 0),
            new Quadray(0, this.size - 1, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[CheckersBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[CheckersBoard] Round-trip integrity verified on corner positions');
    }

    setupInitialPosition() {
        this.pieces.clear();

        // BOARD TOPOLOGY:
        // We use "Even Sum" positions (sum of coords is even).
        // Max valid even sum in size 4 (0..3) is 8 (e.g., 3,3,2,0).
        // Min valid even sum is 0 (0,0,0,0).

        // RED: Starts at Low Sums (0 and 2).
        // BLACK: Starts at High Sums (8 and 6).

        // Red Pieces (7 pieces)
        // Sum 0: (0,0,0,0)
        this.addPiece(PlayerColor.RED, new Quadray(0, 0, 0, 0));
        // Sum 2: Pairs of (1,1,0,0) etc. (6 permutations)
        this.addPiece(PlayerColor.RED, new Quadray(1, 1, 0, 0));
        this.addPiece(PlayerColor.RED, new Quadray(1, 0, 1, 0));
        this.addPiece(PlayerColor.RED, new Quadray(1, 0, 0, 1));
        this.addPiece(PlayerColor.RED, new Quadray(0, 1, 1, 0));
        this.addPiece(PlayerColor.RED, new Quadray(0, 1, 0, 1));
        this.addPiece(PlayerColor.RED, new Quadray(0, 0, 1, 1));

        // Black Pieces (7 pieces)
        // Sum 8 positions (6 pieces)
        this.addPiece(PlayerColor.BLACK, new Quadray(3, 3, 2, 0));
        this.addPiece(PlayerColor.BLACK, new Quadray(3, 3, 0, 2));
        this.addPiece(PlayerColor.BLACK, new Quadray(3, 2, 3, 0));
        this.addPiece(PlayerColor.BLACK, new Quadray(3, 0, 3, 2));
        this.addPiece(PlayerColor.BLACK, new Quadray(0, 3, 3, 2));
        this.addPiece(PlayerColor.BLACK, new Quadray(2, 3, 3, 0));
        // Sum 6 position (1 piece)
        this.addPiece(PlayerColor.BLACK, new Quadray(3, 3, 0, 0));
    }

    addPiece(color, position, type = PieceType.MAN) {
        const piece = new CheckersPiece(color, type, position);
        this.pieces.set(position.toKey(), piece);
    }

    /**
     * Get cell/piece at a Quadray position.
     * @param {Quadray} position
     * @returns {CheckersPiece|null}
     */
    getCell(position) {
        return this.pieces.get(position.toKey()) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} position
     * @param {CheckersPiece} piece
     */
    setCell(position, piece) {
        this.pieces.set(position.toKey(), piece);
    }

    getPieceAt(position) {
        return this.pieces.get(position.toKey());
    }

    removePieceAt(position) {
        this.pieces.delete(position.toKey());
    }

    isValidPosition(pos) {
        const n = pos.normalized();
        return GridUtils.inBounds(n.a, n.b, n.c, n.d, this.size);
    }

    getValidMoves(piece) {
        const moves = [];
        const pos = piece.position;
        const isKing = piece.type === PieceType.KING;

        // Generate possible directions (Change 2 coords by 1)
        // Vectors with two 1s: (1,1,0,0) etc.
        const axes = [
            { da: 1, db: 1 }, { da: 1, dc: 1 }, { da: 1, dd: 1 },
            { da: 0, db: 1, dc: 1 }, { da: 0, db: 1, dd: 1 }, { da: 0, db: 0, dc: 1, dd: 1 }
        ];

        const vectors = [];
        for (let ax of axes) {
            vectors.push(new Quadray(ax.da || 0, ax.db || 0, ax.dc || 0, ax.dd || 0));
        }

        for (let vec of vectors) {
            // Forward moves for Red (Sum Increases): Add vector
            if (piece.color === PlayerColor.RED || isKing) {
                this.tryAddMove(moves, piece, vec, 1);
            }
            // Forward moves for Black (Sum Decreases): Subtract vector
            if (piece.color === PlayerColor.BLACK || isKing) {
                this.tryAddMove(moves, piece, vec, -1);
            }
        }

        return moves;
    }

    tryAddMove(moves, piece, vec, sign) {
        const dir = vec.scale(sign);
        const target = piece.position.add(dir);

        if (!this.isValidPosition(target)) return;

        const targetPiece = this.getPieceAt(target);

        // 1. Simple Move (empty target)
        if (!targetPiece) {
            moves.push({ type: 'move', from: piece.position, to: target });
        }
        // 2. Capture (jump over enemy)
        else if (targetPiece.color !== piece.color) {
            const jumpTarget = target.add(dir);
            if (this.isValidPosition(jumpTarget) && !this.getPieceAt(jumpTarget)) {
                moves.push({
                    type: 'capture',
                    from: piece.position,
                    to: jumpTarget,
                    captured: targetPiece
                });
            }
        }
    }

    executeMove(move) {
        const piece = this.getPieceAt(move.from);
        if (!piece) return;

        // Record move history
        this.moveHistory.push({
            player: piece.color,
            from: move.from.clone(),
            to: move.to.clone(),
            type: move.type,
            moveNum: this.moveCount + 1,
        });
        this.moveCount++;

        // Move piece
        this.pieces.delete(move.from.toKey());
        piece.position = move.to;
        this.pieces.set(move.to.toKey(), piece);

        // Remove captured
        if (move.type === 'capture') {
            this.pieces.delete(move.captured.position.toKey());
        }

        // Promotion Logic
        this.checkPromotion(piece);
    }

    checkPromotion(piece) {
        if (piece.type === PieceType.KING) return;

        const n = piece.position.normalized();
        const sum = n.a + n.b + n.c + n.d;

        // Promotion Thresholds:
        // Red promotes at High Sum (>= 8)
        // Black promotes at Low Sum (<= 0)

        if (piece.color === PlayerColor.RED) {
            if (sum >= 8) piece.type = PieceType.KING;
        } else {
            if (sum <= 0) piece.type = PieceType.KING;
        }
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors().
     * @param {Quadray} q
     * @returns {Array<{a:number, b:number, c:number, d:number}>}
     */
    getNeighbors(q) {
        return GridUtils.boundedNeighbors(q.a, q.b, q.c, q.d, this.size);
    }

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    manhattanDistance(q1, q2) {
        return GridUtils.manhattan(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Euclidean distance between two positions on the board.
     * Uses GridUtils.euclidean().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    euclideanDistance(q1, q2) {
        return GridUtils.euclidean(
            { a: q1.a, b: q1.b, c: q1.c, d: q1.d },
            { a: q2.a, b: q2.b, c: q2.c, d: q2.d }
        );
    }

    /**
     * Calculate Quadray distance (proper IVM distance) between two positions.
     * Uses Quadray.distance().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    quadrayDistance(q1, q2) {
        return Quadray.distance(q1, q2);
    }

    /**
     * Get the angle between two direction vectors from a position.
     * Uses angleBetweenQuadrays() from synergetics.
     * @param {Quadray} from
     * @param {Quadray} to1
     * @param {Quadray} to2
     * @returns {number} Angle in degrees
     */
    angleBetween(from, to1, to2) {
        if (typeof angleBetweenQuadrays !== 'function') return 0;
        const v1 = to1.subtract(from);
        const v2 = to2.subtract(from);
        return angleBetweenQuadrays(v1, v2);
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let redCount = 0, blackCount = 0;
        let kingCount = 0;
        for (const [, piece] of this.pieces) {
            if (piece.color === PlayerColor.RED) redCount++;
            else blackCount++;
            if (piece.type === PieceType.KING) kingCount++;
        }
        return {
            moveCount: this.moveCount,
            redCount,
            blackCount,
            kingCount,
            gameOver: this.gameOver,
            totalPieces: redCount + blackCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            gridSize: this.size,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.gameOver = false;
        this.moveCount = 0;
        this.moveHistory = [];
        this.setupInitialPosition();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckersBoard, CheckersPiece, PlayerColor, PieceType };
}
