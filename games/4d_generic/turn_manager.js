/**
 * turn_manager.js — Turn Management for Board Games
 *
 * Provides turn alternation, move history, and undo for turn-based games:
 *   - Player rotation (2+ players)
 *   - Move recording with timestamps
 *   - Undo/redo stack
 *   - Turn-count tracking
 *
 * Used by: Chess, Checkers, Reversi, Connect Four, Backgammon, Catan.
 *
 * Usage:
 *   const turns = new TurnManager(['black', 'white']);
 *   turns.recordMove({ from: [0,0,0,0], to: [1,0,0,0] });
 *   turns.nextTurn();
 *   console.log(turns.currentPlayer); // 'white'
 *   turns.undo(); // [{ player, move, timestamp }]
 *
 * @module TurnManager
 */

class TurnManager {
    /**
     * @param {string[]} players — Player identifiers in turn order.
     * @param {Object}   [opts]
     * @param {number}   [opts.maxHistory=1000] — Maximum moves to retain.
     */
    constructor(players = ['black', 'white'], opts = {}) {
        if (!players || players.length < 2) {
            throw new Error('TurnManager requires at least 2 players');
        }
        this.players = [...players];
        this.currentIndex = 0;
        this.moveHistory = [];
        this.redoStack = [];
        this.moveCount = 0;
        this.maxHistory = opts.maxHistory ?? 1000;
    }

    /**
     * Get the current player's identifier.
     * @returns {string}
     */
    get currentPlayer() {
        return this.players[this.currentIndex];
    }

    /**
     * Get the number of players.
     * @returns {number}
     */
    get playerCount() {
        return this.players.length;
    }

    /**
     * Advance to the next player's turn.
     */
    nextTurn() {
        this.currentIndex = (this.currentIndex + 1) % this.players.length;
        this.moveCount++;
    }

    /**
     * Record a move for the current player.
     * Clears the redo stack (new branch of history).
     * @param {*} move — Arbitrary move data (game-specific).
     */
    recordMove(move) {
        const entry = {
            player: this.currentPlayer,
            move,
            turnNumber: this.moveCount,
            timestamp: Date.now(),
        };
        this.moveHistory.push(entry);
        this.redoStack = [];
        // Trim history if exceeding max
        if (this.moveHistory.length > this.maxHistory) {
            this.moveHistory.shift();
        }
    }

    /**
     * Record a move and advance the turn in one call.
     * @param {*} move — Arbitrary move data.
     */
    recordAndAdvance(move) {
        this.recordMove(move);
        this.nextTurn();
    }

    /**
     * Undo the last move. Returns the undone entry or null.
     * @returns {Object|null} — The undone move entry.
     */
    undo() {
        if (this.moveHistory.length === 0) return null;
        const entry = this.moveHistory.pop();
        this.redoStack.push(entry);
        // Step back to the previous player
        this.currentIndex =
            (this.currentIndex - 1 + this.players.length) % this.players.length;
        this.moveCount = Math.max(0, this.moveCount - 1);
        return entry;
    }

    /**
     * Redo the last undone move. Returns the redone entry or null.
     * @returns {Object|null} — The redone move entry.
     */
    redo() {
        if (this.redoStack.length === 0) return null;
        const entry = this.redoStack.pop();
        this.moveHistory.push(entry);
        this.nextTurn();
        return entry;
    }

    /**
     * Check if undo is available.
     * @returns {boolean}
     */
    canUndo() {
        return this.moveHistory.length > 0;
    }

    /**
     * Check if redo is available.
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Get the last N moves from history.
     * @param {number} n — Number of moves to retrieve.
     * @returns {Object[]}
     */
    lastMoves(n = 5) {
        return this.moveHistory.slice(-n);
    }

    /**
     * Get all moves by a specific player.
     * @param {string} player
     * @returns {Object[]}
     */
    movesBy(player) {
        return this.moveHistory.filter(e => e.player === player);
    }

    /**
     * Get the opponent of the current player (for 2-player games).
     * @returns {string}
     */
    get opponent() {
        return this.players[(this.currentIndex + 1) % this.players.length];
    }

    /**
     * Get turn metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        return {
            currentPlayer: this.currentPlayer,
            moveCount: this.moveCount,
            historyLength: this.moveHistory.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        };
    }

    /**
     * Reset turn state to initial.
     */
    reset() {
        this.currentIndex = 0;
        this.moveHistory = [];
        this.redoStack = [];
        this.moveCount = 0;
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TurnManager };
}
