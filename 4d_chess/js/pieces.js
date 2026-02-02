/**
 * Pieces.js - Chess Piece Definitions for 4D Quadray Chess
 * 
 * Each piece has movement rules defined in terms of Quadray directions.
 * The Isotropic Vector Matrix (IVM) ensures uniform geometry.
 */

// Piece types
const PieceType = {
    KING: 'king',
    QUEEN: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
};

// Player colors
const PlayerColor = {
    WHITE: 'white',
    BLACK: 'black'
};

/**
 * Base class for all chess pieces.
 */
class Piece {
    /**
     * @param {string} type - Piece type from PieceType enum
     * @param {string} color - Player color from PlayerColor enum
     * @param {Quadray} position - Current position in 4D space
     */
    constructor(type, color, position) {
        this.type = type;
        this.color = color;
        this.position = position;
        this.hasMoved = false;
    }

    /**
     * Get all valid moves for this piece.
     * @param {Board} board - The game board
     * @returns {Quadray[]} Array of valid destination positions
     */
    getValidMoves(board) {
        throw new Error('Must be implemented by subclass');
    }

    /**
     * Get Unicode symbol for this piece.
     * @returns {string}
     */
    getSymbol() {
        const symbols = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };
        return symbols[this.color][this.type];
    }
}

/**
 * King - Moves 1 unit in any of the 4 Quadray directions.
 * This is the fundamental "unit step" in 4D space.
 */
class King extends Piece {
    constructor(color, position) {
        super(PieceType.KING, color, position);
    }

    /**
     * Get the 4 basis movement vectors for the King.
     * @returns {Quadray[]}
     */
    getMovementVectors() {
        return Quadray.BASIS;
    }

    getValidMoves(board) {
        const moves = [];

        // King can move 1 unit in any of the 4 basis directions
        for (const basis of Quadray.BASIS) {
            // Positive direction
            const posMove = this.position.add(basis);
            if (board.isValidPosition(posMove) && !board.hasOwnPiece(posMove, this.color)) {
                moves.push(posMove);
            }

            // We don't need negative directions because normalized Quadrays
            // handle this through the constraint that the minimum is always 0.
            // Moving "backwards" in one direction is equivalent to moving
            // forward in the other three directions.
        }

        return moves;
    }
}

/**
 * Rook - Moves any distance along a single Quadray axis.
 */
class Rook extends Piece {
    constructor(color, position) {
        super(PieceType.ROOK, color, position);
    }

    getValidMoves(board) {
        const moves = [];

        // Rook can move any number of units along a single basis direction
        for (const basis of Quadray.BASIS) {
            // Slide along this axis until blocked
            for (let distance = 1; distance <= board.maxDistance; distance++) {
                const targetPos = this.position.add(basis.scale(distance));

                if (!board.isValidPosition(targetPos)) break;

                if (board.hasOwnPiece(targetPos, this.color)) break;

                moves.push(targetPos);

                if (board.hasEnemyPiece(targetPos, this.color)) break; // Can capture but not move through
            }
        }

        return moves;
    }
}

/**
 * Bishop - Moves diagonally: two axes change simultaneously.
 * In 4D, there are 6 possible diagonal directions (combinations of 2 axes).
 */
class Bishop extends Piece {
    constructor(color, position) {
        super(PieceType.BISHOP, color, position);
    }

    getValidMoves(board) {
        const moves = [];

        // All pairs of basis vectors (diagonals)
        const diagonals = [
            [Quadray.A, Quadray.B],
            [Quadray.A, Quadray.C],
            [Quadray.A, Quadray.D],
            [Quadray.B, Quadray.C],
            [Quadray.B, Quadray.D],
            [Quadray.C, Quadray.D]
        ];

        for (const [v1, v2] of diagonals) {
            // Move along this diagonal (both axes increase together)
            const diagonal = v1.add(v2);

            for (let distance = 1; distance <= board.maxDistance; distance++) {
                const targetPos = this.position.add(diagonal.scale(distance));

                if (!board.isValidPosition(targetPos)) break;
                if (board.hasOwnPiece(targetPos, this.color)) break;

                moves.push(targetPos);

                if (board.hasEnemyPiece(targetPos, this.color)) break;
            }
        }

        return moves;
    }
}

/**
 * Queen - Combines Rook and Bishop movement.
 */
class Queen extends Piece {
    constructor(color, position) {
        super(PieceType.QUEEN, color, position);
    }

    getValidMoves(board) {
        // Queen has all Rook moves plus all Bishop moves
        const rook = new Rook(this.color, this.position);
        const bishop = new Bishop(this.color, this.position);

        return [...rook.getValidMoves(board), ...bishop.getValidMoves(board)];
    }
}

/**
 * Knight - L-shaped move: +2 in one axis, +1 in another.
 * In 4D, there are 12 possible knight moves.
 */
class Knight extends Piece {
    constructor(color, position) {
        super(PieceType.KNIGHT, color, position);
    }

    getValidMoves(board) {
        const moves = [];

        // Generate all L-shaped moves (2 in one direction, 1 in another)
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (i === j) continue;

                // +2 in axis i, +1 in axis j
                const offset = Quadray.BASIS[i].scale(2).add(Quadray.BASIS[j]);
                const targetPos = this.position.add(offset);

                if (board.isValidPosition(targetPos) && !board.hasOwnPiece(targetPos, this.color)) {
                    moves.push(targetPos);
                }
            }
        }

        return moves;
    }
}

/**
 * Pawn - Advances along a primary Quadray axis.
 * White pawns move in +a direction, Black pawns move in +b direction.
 */
class Pawn extends Piece {
    constructor(color, position) {
        super(PieceType.PAWN, color, position);
    }

    getValidMoves(board) {
        const moves = [];

        // Pawn direction depends on color
        const forward = this.color === PlayerColor.WHITE ? Quadray.A : Quadray.B;

        // Forward move (non-capture)
        const oneStep = this.position.add(forward);
        if (board.isValidPosition(oneStep) && !board.getPieceAt(oneStep)) {
            moves.push(oneStep);

            // Two-step initial move
            if (!this.hasMoved) {
                const twoStep = this.position.add(forward.scale(2));
                if (board.isValidPosition(twoStep) && !board.getPieceAt(twoStep)) {
                    moves.push(twoStep);
                }
            }
        }

        // Diagonal captures (forward + another axis)
        const captureDirs = Quadray.BASIS.filter(b => !b.equals(forward));
        for (const diagAxis of captureDirs) {
            const capturePos = this.position.add(forward).add(diagAxis);
            if (board.isValidPosition(capturePos) && board.hasEnemyPiece(capturePos, this.color)) {
                moves.push(capturePos);
            }
        }

        return moves;
    }
}

// Factory function to create pieces
function createPiece(type, color, position) {
    switch (type) {
        case PieceType.KING: return new King(color, position);
        case PieceType.QUEEN: return new Queen(color, position);
        case PieceType.ROOK: return new Rook(color, position);
        case PieceType.BISHOP: return new Bishop(color, position);
        case PieceType.KNIGHT: return new Knight(color, position);
        case PieceType.PAWN: return new Pawn(color, position);
        default: throw new Error(`Unknown piece type: ${type}`);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Piece, King, Queen, Rook, Bishop, Knight, Pawn, PieceType, PlayerColor, createPiece };
}
