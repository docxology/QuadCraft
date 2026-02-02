/**
 * Board.js - 4D Chess Board for Quadray Chess
 * 
 * The board is a finite lattice of points in 4D Quadray space.
 * We use a bounded region to make gameplay tractable.
 * @version 1.0.0
 */

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

        // Auto-initialize with starting position
        this.setupInitialPosition();
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
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Board };
}
