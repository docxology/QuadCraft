/**
 * Storage.js - Save/Load System for 4D Quadray Chess
 * 
 * Provides serialization and file I/O for game state persistence.
 */

/**
 * Serialize game state to JSON-compatible object.
 * @param {Game} game - The game instance
 * @returns {object} Serialized game state
 */
function exportGameState(game) {
    const pieces = [];

    for (const piece of game.board.pieces.values()) {
        const pos = piece.position.normalized();
        pieces.push({
            type: piece.type,
            color: piece.color,
            position: { a: pos.a, b: pos.b, c: pos.c, d: pos.d },
            hasMoved: piece.hasMoved
        });
    }

    const moveHistory = game.moveHistory.map(move => ({
        from: {
            a: move.from.a,
            b: move.from.b,
            c: move.from.c,
            d: move.from.d
        },
        to: {
            a: move.to.a,
            b: move.to.b,
            c: move.to.c,
            d: move.to.d
        },
        captured: move.captured ? {
            type: move.captured.type,
            color: move.captured.color
        } : null
    }));

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        currentPlayer: game.currentPlayer,
        gameOver: game.gameOver,
        boardSize: game.board.size,
        pieces: pieces,
        moveHistory: moveHistory,
        capturedPieces: {
            white: game.board.capturedPieces.white.map(p => ({ type: p.type, color: p.color })),
            black: game.board.capturedPieces.black.map(p => ({ type: p.type, color: p.color }))
        }
    };
}

/**
 * Restore game state from JSON data.
 * @param {object} data - Serialized game state
 * @param {Game} game - The game instance to restore into
 * @returns {boolean} Success status
 */
function importGameState(data, game) {
    try {
        // Validate version
        if (!data.version || !data.pieces) {
            throw new Error('Invalid save file format');
        }

        // Clear current board
        game.board.pieces.clear();
        game.board.capturedPieces = { white: [], black: [] };

        // Restore pieces
        for (const pieceData of data.pieces) {
            const position = new Quadray(
                pieceData.position.a,
                pieceData.position.b,
                pieceData.position.c,
                pieceData.position.d
            );
            const piece = createPiece(pieceData.type, pieceData.color, position);
            piece.hasMoved = pieceData.hasMoved;
            game.board.placePiece(piece);
        }

        // Restore game state
        game.currentPlayer = data.currentPlayer;
        game.gameOver = data.gameOver || false;

        // Restore move history
        game.moveHistory = data.moveHistory.map(move => ({
            from: new Quadray(move.from.a, move.from.b, move.from.c, move.from.d),
            to: new Quadray(move.to.a, move.to.b, move.to.c, move.to.d),
            captured: move.captured ? { type: move.captured.type, color: move.captured.color } : null
        }));

        // Deselect any piece
        game.deselectPiece();

        console.log(`Game loaded: ${data.pieces.length} pieces, ${data.moveHistory.length} moves`);
        return true;

    } catch (error) {
        console.error('Failed to import game state:', error);
        return false;
    }
}

/**
 * Trigger download of JSON data as file.
 * @param {object} data - Data to download
 * @param {string} filename - Name for downloaded file
 */
function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Downloaded: ${filename}`);
}

/**
 * Handle file upload and parse JSON.
 * @param {File} file - Uploaded file
 * @param {function} callback - Called with parsed data
 */
function handleFileUpload(file, callback) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            callback(data, null);
        } catch (error) {
            callback(null, error);
        }
    };

    reader.onerror = () => {
        callback(null, new Error('Failed to read file'));
    };

    reader.readAsText(file);
}

/**
 * Generate a timestamped filename for save files.
 * @returns {string} Filename
 */
function generateSaveFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `quadray-chess-${timestamp}.json`;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        exportGameState,
        importGameState,
        downloadJSON,
        handleFileUpload,
        generateSaveFilename
    };
}
