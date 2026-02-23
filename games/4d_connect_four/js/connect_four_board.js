/**
 * connect_four_board.js — 4D Connect Four on IVM Grid
 *
 * Gravity drops along -A axis. Players alternate dropping pieces
 * into columns defined by (b,c,d) coordinates. Win condition:
 * 4 in a row along any IVM direction (axis-aligned or diagonal).
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
 * @module ConnectFourBoard
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
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
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
if (typeof TurnManager === 'undefined' && typeof require !== 'undefined') {
    const _tm = require('../../4d_generic/turn_manager.js');
    globalThis.TurnManager = _tm.TurnManager;
}

class ConnectFourBoard extends BaseBoard {

    /**
     * @param {number} height - Column height (A axis)
     * @param {number} width  - Board width (B axis)
     * @param {number} depthC - C axis extent
     * @param {number} depthD - D axis extent
     */
    constructor(height = 6, width = 5, depthC = 3, depthD = 3) {
        super(height, { name: 'ConnectFourBoard', verify: false });
        this.height = height;
        this.width = width;
        this.depthC = depthC;
        this.depthD = depthD;
        this.grid = new Map();          // Quadray.toKey() -> { player, quadray, cellType }
        this.turnManager = new TurnManager([1, 2], { maxHistory: Infinity }); // High tracking for minimax
        this.winner = 0;
        this.gameOver = false;
        this.winLine = [];              // Winning 4 Quadray positions
        this.moveCount = 0;
        this.totalSlots = width * depthC * depthD * height;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = Quadray.cellVolume();
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[ConnectFourBoard] ${height}h × ${width}w × ${depthC}c × ${depthD}d IVM grid`);
        console.log(`[ConnectFourBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[ConnectFourBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(this.height - 1, this.width - 1, this.depthC - 1, this.depthD - 1),
            new Quadray(this.height - 1, 0, 0, 0),
            new Quadray(0, this.width - 1, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[ConnectFourBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[ConnectFourBoard] ✅ Round-trip integrity verified on corner positions');
    }

    get currentPlayer() { return this.turnManager.currentPlayer; }
    get moveHistory() { return this.turnManager.moveHistory; }

    /**
     * Check if coordinates are within the board bounds.
     * @param {Quadray} q
     * @returns {boolean}
     */
    inBounds(q) {
        return q.a >= 0 && q.a < this.height &&
            q.b >= 0 && q.b < this.width &&
            q.c >= 0 && q.c < this.depthC &&
            q.d >= 0 && q.d < this.depthD;
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null} { player, quadray, cellType } or null
     */
    getCell(q) {
        const key = q.toKey();
        return this.grid.get(key) || null;
    }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} value
     */
    setCell(q, value) {
        this.grid.set(q.toKey(), value);
    }

    /**
     * Drop a piece into column (b, c, d).
     * Gravity pulls it along -A axis to the lowest unoccupied A position.
     * Uses Quadray.toIVM() for grid snapping and Quadray.add() for traversal.
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {{result: string, quadray: Quadray|null, cellType: string|null}}
     */
    dropPiece(b, c, d) {
        if (this.gameOver) return { result: 'gameover', quadray: null, cellType: null };

        // Validate column bounds
        if (b < 0 || b >= this.width || c < 0 || c >= this.depthC || d < 0 || d >= this.depthD) {
            return { result: 'invalid', quadray: null, cellType: null };
        }

        // Find lowest empty row — gravity along A axis
        let landingRow = -1;
        for (let a = 0; a < this.height; a++) {
            const pos = Quadray.toIVM(new Quadray(a, b, c, d));
            if (!this.grid.has(pos.toKey())) {
                landingRow = a;
                break;
            }
        }

        if (landingRow === -1) return { result: 'full', quadray: null, cellType: null };

        // Create the landing Quadray and snap to IVM
        const landingQuadray = Quadray.toIVM(new Quadray(landingRow, b, c, d));
        const parity = Quadray.cellType(landingQuadray.a, landingQuadray.b, landingQuadray.c, landingQuadray.d);

        // Place piece using Quadray.toKey() for storage
        const player = this.currentPlayer;
        const cellData = {
            player: player,
            quadray: landingQuadray,
            cellType: parity,
            moveNum: this.moveCount + 1,
        };
        this.grid.set(landingQuadray.toKey(), cellData);
        this.moveCount++;

        const moveRecord = {
            player: player,
            quadray: landingQuadray.clone(),
            cellType: parity,
            moveNum: this.moveCount,
        };

        // Check win using IVM directions
        if (this._checkWin(landingQuadray)) {
            this.gameOver = true;
            this.winner = player;
            console.log(`[ConnectFourBoard] 🏆 Player ${this.winner} wins at ${landingQuadray.toString()} (${parity})`);
            this.turnManager.recordAndAdvance(moveRecord);
            return { result: 'win', quadray: landingQuadray, cellType: parity };
        }

        // Check draw
        if (this.moveCount >= this.totalSlots) {
            this.gameOver = true;
            console.log('[ConnectFourBoard] 🤝 Draw!');
            this.turnManager.recordAndAdvance(moveRecord);
            return { result: 'draw', quadray: landingQuadray, cellType: parity };
        }

        // Switch player
        this.turnManager.recordAndAdvance(moveRecord);
        return { result: 'placed', quadray: landingQuadray, cellType: parity };
    }

    /**
     * Check if the last placed piece creates a 4-in-a-row.
     * Uses Quadray.add() to walk along WIN_DIRECTIONS and
     * Quadray.equals() / toKey() for position matching.
     * @param {Quadray} pos - The position to check from
     * @returns {boolean}
     */
    _checkWin(pos) {
        const player = this.grid.get(pos.toKey())?.player;
        if (!player) return false;

        for (const dir of ConnectFourBoard.WIN_DIRECTIONS) {
            const line = [pos.clone()];

            // Walk forward along direction using Quadray.add()
            let current = pos.clone();
            for (let i = 0; i < 3; i++) {
                current = new Quadray(
                    current.a + dir.a,
                    current.b + dir.b,
                    current.c + dir.c,
                    current.d + dir.d
                );
                const snapped = Quadray.toIVM(current);
                if (!this.inBounds(snapped)) break;
                const cell = this.grid.get(snapped.toKey());
                if (cell && cell.player === player) {
                    line.push(snapped);
                } else break;
            }

            // Walk backward along direction (negate with scale(-1))
            current = pos.clone();
            const negDir = dir.scale(-1);
            for (let i = 0; i < 3; i++) {
                current = new Quadray(
                    current.a + negDir.a,
                    current.b + negDir.b,
                    current.c + negDir.c,
                    current.d + negDir.d
                );
                const snapped = Quadray.toIVM(current);
                if (!this.inBounds(snapped)) break;
                const cell = this.grid.get(snapped.toKey());
                if (cell && cell.player === player) {
                    line.push(snapped);
                } else break;
            }

            if (line.length >= 4) {
                this.winLine = line.slice(0, 4);
                return true;
            }
        }
        return false;
    }

    /**
     * Get all placed cells for rendering.
     * Each cell includes its Quadray, cellType, Cartesian coordinates,
     * distance from origin, and whether it's part of the win line.
     * @returns {Array<Object>}
     */
    getCells() {
        const cells = [];
        for (const [key, cellData] of this.grid) {
            const q = cellData.quadray;
            const cartesian = q.toCartesian();
            const distFromOrigin = q.distanceTo(Quadray.ORIGIN);
            const isWinCell = this.winLine.some(w => w.toKey() === key);

            cells.push({
                a: q.a, b: q.b, c: q.c, d: q.d,
                player: cellData.player,
                cellType: cellData.cellType,
                quadray: q,
                cartesian,
                distFromOrigin,
                isWinCell,
                color: cellData.player === 1 ? '#ef4444' : '#fbbf24',
                moveNum: cellData.moveNum,
            });
        }
        return cells;
    }

    /**
     * Get valid drop columns for rendering and hit-testing.
     * Each column includes its Quadray, parity, cartesian position,
     * and fill status.
     * @returns {Array<Object>}
     */
    getColumns() {
        const cols = [];
        for (let b = 0; b < this.width; b++)
            for (let c = 0; c < this.depthC; c++)
                for (let d = 0; d < this.depthD; d++) {
                    let full = true;
                    for (let a = 0; a < this.height; a++) {
                        const pos = Quadray.toIVM(new Quadray(a, b, c, d));
                        if (!this.grid.has(pos.toKey())) { full = false; break; }
                    }
                    const colQuadray = new Quadray(0, b, c, d);
                    const parity = Quadray.cellType(0, b, c, d);
                    const cartesian = colQuadray.toCartesian();

                    cols.push({
                        b, c, d, full, parity,
                        quadray: colQuadray,
                        cartesian,
                        normalized: colQuadray.normalized(),
                    });
                }
        return cols;
    }

    /**
     * Get IVM neighbors of a position that are within board bounds.
     * Uses GridUtils.boundedNeighbors() adapted for our non-uniform board.
     * @param {Quadray} q
     * @returns {Array<Quadray>}
     */
    getNeighbors(q) {
        const raw = GridUtils.neighbors(q.a, q.b, q.c, q.d);
        return raw
            .map(n => Quadray.toIVM(new Quadray(n.a, n.b, n.c, n.d)))
            .filter(n => this.inBounds(n));
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
     * Uses Quadray.distance() / Quadray.distanceTo().
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
     * Get valid moves (columns that aren't full).
     * @returns {Array<{b: number, c: number, d: number}>}
     */
    getValidMoves() {
        const moves = [];
        for (let b = 0; b < this.width; b++)
            for (let c = 0; c < this.depthC; c++)
                for (let d = 0; d < this.depthD; d++) {
                    const topPos = Quadray.toIVM(new Quadray(this.height - 1, b, c, d));
                    if (!this.grid.has(topPos.toKey())) {
                        moves.push({ b, c, d });
                    }
                }
        return moves;
    }

    /**
     * Evaluate a position for AI — count threats, centrality, neighbor occupancy.
     * @param {number} player - Player to evaluate for
     * @returns {number} Score
     */
    evaluatePosition(player) {
        let score = 0;
        const opponent = player === 1 ? 2 : 1;
        const centerB = (this.width - 1) / 2;
        const centerC = (this.depthC - 1) / 2;
        const centerD = (this.depthD - 1) / 2;
        const center = new Quadray(0, centerB, centerC, centerD);

        for (const [key, cellData] of this.grid) {
            const q = cellData.quadray;
            // Centrality bonus — closer to center is better (using Quadray.distance)
            const distToCenter = q.distanceTo(center);
            const centralityBonus = Math.max(0, 5 - distToCenter);

            if (cellData.player === player) {
                score += 10 + centralityBonus;
                // Neighbor bonus using GridUtils neighbors
                const neighbors = this.getNeighbors(q);
                for (const n of neighbors) {
                    const nCell = this.grid.get(n.toKey());
                    if (nCell && nCell.player === player) score += 3;
                }
            } else if (cellData.player === opponent) {
                score -= 10 - centralityBonus;
            }
        }

        // Threat analysis — check partial lines along WIN_DIRECTIONS
        for (const dir of ConnectFourBoard.WIN_DIRECTIONS) {
            score += this._evaluateLine(dir, player) * 5;
            score -= this._evaluateLine(dir, opponent) * 5;
        }

        return score;
    }

    /**
     * Evaluate how many partial lines exist for a player along a direction.
     * @param {Quadray} dir
     * @param {number} player
     * @returns {number}
     */
    _evaluateLine(dir, player) {
        let threats = 0;
        for (const [key, cellData] of this.grid) {
            if (cellData.player !== player) continue;
            const pos = cellData.quadray;
            let count = 1;
            let current = pos.clone();
            for (let i = 0; i < 3; i++) {
                current = new Quadray(
                    current.a + dir.a, current.b + dir.b,
                    current.c + dir.c, current.d + dir.d
                );
                const snapped = Quadray.toIVM(current);
                if (!this.inBounds(snapped)) break;
                const cell = this.grid.get(snapped.toKey());
                if (cell && cell.player === player) count++;
                else if (cell) break; // opponent blocks
                // empty — continue counting potential
            }
            if (count >= 2) threats += count - 1;
        }
        return threats;
    }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        let tetraCount = 0, octaCount = 0;
        for (const [, cellData] of this.grid) {
            if (cellData.cellType === 'tetra') tetraCount++;
            else octaCount++;
        }
        return {
            moveCount: this.moveCount,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            gameOver: this.gameOver,
            tetraCount,
            octaCount,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
            totalSlots: this.totalSlots,
        };
    }

    /**
     * Undo the last move. Removes piece from grid, decrements moveCount,
     * clears win/gameOver state, and reverses the turn.
     * @returns {{ player: number, quadray: Quadray, cellType: string }|null}
     */
    undoLastMove() {
        const entry = this.turnManager.undo();
        if (!entry) return null;
        const move = entry.move;
        this.grid.delete(move.quadray.toKey());
        this.moveCount--;
        this.winner = 0;
        this.gameOver = false;
        this.winLine = [];
        console.log(`[ConnectFourBoard] Undo move #${move.moveNum} by P${entry.player} at ${move.quadray.toString()}`);
        return { player: entry.player, quadray: move.quadray, cellType: move.cellType };
    }

    /** Reset board to initial state. */
    reset() {
        this.grid = new Map();
        this.turnManager.reset();
        this.winner = 0;
        this.gameOver = false;
        this.winLine = [];
        this.moveCount = 0;
    }
}

/**
 * All 40 unique IVM win-scan directions.
 * Assigned post-class to ensure Quadray is available at runtime.
 * Built from ±1 offsets across 4 axes, keeping only the "positive half"
 * to avoid scanning the same line twice.
 */
ConnectFourBoard.WIN_DIRECTIONS = (() => {
    const dirs = [];
    for (let da = -1; da <= 1; da++)
        for (let db = -1; db <= 1; db++)
            for (let dc = -1; dc <= 1; dc++)
                for (let dd = -1; dd <= 1; dd++) {
                    if (da === 0 && db === 0 && dc === 0 && dd === 0) continue;
                    if (da > 0 || (da === 0 && db > 0) ||
                        (da === 0 && db === 0 && dc > 0) ||
                        (da === 0 && db === 0 && dc === 0 && dd > 0)) {
                        dirs.push(new Quadray(da, db, dc, dd));
                    }
                }
    return dirs;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectFourBoard };
}

