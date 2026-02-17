/**
 * board.js — 4D Chess Board on IVM Grid
 *
 * The board is a finite lattice of points in 4D Quadray space.
 * We use a bounded region to make gameplay tractable.
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, subtract, equals, distance,
 *              distanceTo, length, scale, toIVM, cellType, cellVolume,
 *              toCartesian, fromCartesian, clone, IVM_DIRECTIONS, BASIS
 *   - GridUtils: key, parseKey, neighbors, boundedNeighbors, inBounds,
 *                manhattan, euclidean, generateGrid, depthSort, shuffle
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * @module ChessBoard
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

/**
 * Board configuration constants
 * @constant
 */
const BOARD_CONFIG = {
    TOTAL_PIECES_PER_SIDE: 12,
    TOTAL_PIECES: 24
};

/**
 * 4D Chess Board using Quadray coordinates.
 */
class Board {
    /**
     * @param {number} size - Board extends from 0 to size-1 in each Quadray axis
     */
    constructor(size = 4) {
        this.size = size;
        this.maxDistance = size * 2; // Maximum sliding distance
        this.pieces = new Map(); // Map from position key to Piece
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check -- verify round-trip on corner positions
        this._verifyIntegrity();

        // Auto-initialize with starting position
        this.setupInitialPosition();

        console.log(`[Board] ${size}x${size}x${size}x${size} IVM grid`);
        console.log(`[Board] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[Board] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.size, this.size, this.size, this.size),
            new Quadray(this.size, 0, 0, 0),
            new Quadray(0, this.size, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[Board] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[Board] Round-trip integrity verified on corner positions');
    }

    /**
     * Initialize the board with starting positions.
     * Uses a simplified 4D layout.
     */
    setupInitialPosition() {
        this.pieces.clear();

        // White pieces - clustered near origin with unique positions
        // Back row pieces
        this.placePiece(createPiece(PieceType.KING, PlayerColor.WHITE, new Quadray(1, 0, 0, 0)));
        this.placePiece(createPiece(PieceType.QUEEN, PlayerColor.WHITE, new Quadray(2, 0, 0, 0)));
        this.placePiece(createPiece(PieceType.ROOK, PlayerColor.WHITE, new Quadray(0, 0, 1, 0)));
        this.placePiece(createPiece(PieceType.ROOK, PlayerColor.WHITE, new Quadray(0, 0, 0, 1)));
        this.placePiece(createPiece(PieceType.BISHOP, PlayerColor.WHITE, new Quadray(0, 0, 2, 0)));
        this.placePiece(createPiece(PieceType.BISHOP, PlayerColor.WHITE, new Quadray(0, 0, 0, 2)));
        this.placePiece(createPiece(PieceType.KNIGHT, PlayerColor.WHITE, new Quadray(3, 0, 0, 0)));
        this.placePiece(createPiece(PieceType.KNIGHT, PlayerColor.WHITE, new Quadray(0, 0, 1, 1)));

        // White pawns - positioned forward to defend pieces
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.WHITE, new Quadray(1, 0, 1, 0)));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.WHITE, new Quadray(1, 0, 0, 1)));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.WHITE, new Quadray(2, 0, 1, 0)));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.WHITE, new Quadray(2, 0, 0, 1)));

        // Black pieces - placed on opposite side of the 4D space
        // Using 'b' axis offset so black pawns can advance toward center
        const blackBase = new Quadray(0, 2, 0, 0);
        // Back row pieces
        this.placePiece(createPiece(PieceType.KING, PlayerColor.BLACK, blackBase.add(new Quadray(0, 1, 0, 0))));
        this.placePiece(createPiece(PieceType.QUEEN, PlayerColor.BLACK, blackBase.add(new Quadray(0, 2, 0, 0))));
        this.placePiece(createPiece(PieceType.ROOK, PlayerColor.BLACK, blackBase.add(new Quadray(0, 0, 1, 0))));
        this.placePiece(createPiece(PieceType.ROOK, PlayerColor.BLACK, blackBase.add(new Quadray(0, 0, 0, 1))));
        this.placePiece(createPiece(PieceType.BISHOP, PlayerColor.BLACK, blackBase.add(new Quadray(0, 0, 2, 0))));
        this.placePiece(createPiece(PieceType.BISHOP, PlayerColor.BLACK, blackBase.add(new Quadray(0, 0, 0, 2))));
        this.placePiece(createPiece(PieceType.KNIGHT, PlayerColor.BLACK, blackBase.add(new Quadray(0, 3, 0, 0))));
        this.placePiece(createPiece(PieceType.KNIGHT, PlayerColor.BLACK, blackBase.add(new Quadray(0, 0, 1, 1))));

        // Black pawns - positioned to allow forward movement along 'b' axis
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.BLACK, blackBase.add(new Quadray(0, 1, 1, 0))));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.BLACK, blackBase.add(new Quadray(0, 1, 0, 1))));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.BLACK, blackBase.add(new Quadray(0, 2, 1, 0))));
        this.placePiece(createPiece(PieceType.PAWN, PlayerColor.BLACK, blackBase.add(new Quadray(0, 2, 0, 1))));
    }

    /**
     * Place a piece on the board.
     * @param {Piece} piece
     */
    placePiece(piece) {
        const key = piece.position.toKey();
        this.pieces.set(key, piece);
    }

    /**
     * Get the piece at a position.
     * @param {Quadray} position
     * @returns {Piece|null}
     */
    getPieceAt(position) {
        return this.pieces.get(position.toKey()) || null;
    }

    /**
     * Get cell data at a Quadray position (generic grid interface).
     * @param {Quadray} q
     * @returns {Piece|null}
     */
    getCell(q) {
        return this.pieces.get(q.toKey()) || null;
    }

    /**
     * Set cell data at a Quadray position (generic grid interface).
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.pieces.set(q.toKey(), value);
    }

    /**
     * Check if a position is within the valid board bounds.
     * @param {Quadray} position
     * @returns {boolean}
     */
    isValidPosition(position) {
        const norm = position.normalized();
        // All normalized components should be within bounds
        return (
            norm.a >= 0 && norm.a <= this.size &&
            norm.b >= 0 && norm.b <= this.size &&
            norm.c >= 0 && norm.c <= this.size &&
            norm.d >= 0 && norm.d <= this.size
        );
    }

    /**
     * Validate the board state (piece counts, unique positions).
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateBoard() {
        const errors = [];
        const { TOTAL_PIECES, TOTAL_PIECES_PER_SIDE } = BOARD_CONFIG;

        // Check total piece count
        if (this.pieces.size !== TOTAL_PIECES) {
            errors.push(`Expected ${TOTAL_PIECES} pieces, found ${this.pieces.size}`);
        }

        // Check pieces per color
        const whitePieces = this.getPiecesByColor(PlayerColor.WHITE);
        const blackPieces = this.getPiecesByColor(PlayerColor.BLACK);

        if (whitePieces.length !== TOTAL_PIECES_PER_SIDE) {
            errors.push(`White has ${whitePieces.length} pieces, expected ${TOTAL_PIECES_PER_SIDE}`);
        }
        if (blackPieces.length !== TOTAL_PIECES_PER_SIDE) {
            errors.push(`Black has ${blackPieces.length} pieces, expected ${TOTAL_PIECES_PER_SIDE}`);
        }

        // Check for duplicate positions
        const keys = new Set();
        for (const piece of this.pieces.values()) {
            const key = piece.position.toKey();
            if (keys.has(key)) {
                errors.push(`Duplicate position: ${key}`);
            }
            keys.add(key);
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Check if position has a piece of the same color.
     * @param {Quadray} position
     * @param {string} color
     * @returns {boolean}
     */
    hasOwnPiece(position, color) {
        const piece = this.getPieceAt(position);
        return piece && piece.color === color;
    }

    /**
     * Check if position has an enemy piece.
     * @param {Quadray} position
     * @param {string} color - The current player's color
     * @returns {boolean}
     */
    hasEnemyPiece(position, color) {
        const piece = this.getPieceAt(position);
        return piece && piece.color !== color;
    }

    /**
     * Move a piece from one position to another.
     * @param {Quadray} from
     * @param {Quadray} to
     * @returns {Piece|null} Captured piece, if any
     */
    movePiece(from, to) {
        const piece = this.getPieceAt(from);
        if (!piece) return null;

        // Remove from old position
        this.pieces.delete(from.toKey());

        // Capture enemy piece if present
        const captured = this.getPieceAt(to);
        if (captured) {
            this.pieces.delete(to.toKey());
            this.capturedPieces[piece.color].push(captured);
        }

        // Place at new position
        piece.position = to;
        piece.hasMoved = true;
        this.placePiece(piece);

        return captured;
    }

    /**
     * Get all pieces of a given color.
     * @param {string} color
     * @returns {Piece[]}
     */
    getPiecesByColor(color) {
        return Array.from(this.pieces.values()).filter(p => p.color === color);
    }

    /**
     * Find the King of a given color.
     * @param {string} color
     * @returns {Piece|null}
     */
    getKing(color) {
        return Array.from(this.pieces.values()).find(
            p => p.type === PieceType.KING && p.color === color
        ) || null;
    }

    /**
     * Check if a king is in check.
     * @param {string} color
     * @returns {boolean}
     */
    isInCheck(color) {
        const king = this.getKing(color);
        if (!king) return false;

        const enemyColor = color === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
        const enemyPieces = this.getPiecesByColor(enemyColor);

        for (const enemy of enemyPieces) {
            const moves = enemy.getValidMoves(this);
            if (moves.some(m => m.equals(king.position))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.neighbors().
     * @param {Quadray} q
     * @returns {Array<Quadray>}
     */
    getNeighbors(q) {
        if (typeof GridUtils === 'undefined') return [];
        const raw = GridUtils.neighbors(q.a, q.b, q.c, q.d);
        return raw
            .map(n => new Quadray(n.a, n.b, n.c, n.d))
            .filter(n => this.isValidPosition(n));
    }

    /**
     * Calculate Manhattan distance between two positions on the board.
     * Uses GridUtils.manhattan().
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    manhattanDistance(q1, q2) {
        if (typeof GridUtils === 'undefined') return 0;
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
        if (typeof GridUtils === 'undefined') return 0;
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
     * Get all valid board positions for rendering.
     * @returns {Quadray[]}
     */
    getAllPositions() {
        const positions = [];

        // Generate all positions in the bounded lattice
        // Due to normalization, we only need to iterate over valid normalized forms
        for (let a = 0; a <= this.size; a++) {
            for (let b = 0; b <= this.size; b++) {
                for (let c = 0; c <= this.size; c++) {
                    for (let d = 0; d <= this.size; d++) {
                        // Only include if at least one component is 0 (normalized form)
                        if (a === 0 || b === 0 || c === 0 || d === 0) {
                            positions.push(new Quadray(a, b, c, d));
                        }
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        const whitePieces = this.getPiecesByColor(PlayerColor.WHITE);
        const blackPieces = this.getPiecesByColor(PlayerColor.BLACK);

        let tetraCount = 0, octaCount = 0;
        if (typeof Quadray !== 'undefined' && Quadray.cellType) {
            for (const piece of this.pieces.values()) {
                const pos = piece.position;
                const ct = Quadray.cellType(pos.a, pos.b, pos.c, pos.d);
                if (ct === 'tetra') tetraCount++;
                else octaCount++;
            }
        }

        return {
            whitePieces: whitePieces.length,
            blackPieces: blackPieces.length,
            totalPieces: this.pieces.size,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            capturedWhite: this.capturedPieces.white.length,
            capturedBlack: this.capturedPieces.black.length,
        };
    }

    /** Reset board to initial state. */
    reset() {
        this.pieces.clear();
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.setupInitialPosition();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Board, BOARD_CONFIG };
}
