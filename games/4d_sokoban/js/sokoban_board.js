/**
 * sokoban_board.js — 4D Sokoban Board on IVM Grid
 *
 * Box-pushing puzzle on a 4D Quadray lattice with 12 IVM directions.
 * Player pushes boxes onto goal cells using the true "twelve-around-one"
 * kissing-sphere neighbor topology (permutations of 0,1,1,2).
 *
 * @module SokobanBoard
 */

// Node.js compatibility
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

/** Cell types */
const CELL = { EMPTY: 0, WALL: 1, BOX: 2, GOAL: 3, BOX_ON_GOAL: 4, PLAYER: 5 };

class SokobanBoard extends BaseBoard {
    constructor(size = 5) {
        super(size, { name: 'SokobanBoard', verify: true });
        this.player = null; // {a,b,c,d}
        this.moveCount = 0;
        this.pushCount = 0;
        this.won = false;
        this.boxes = [];
        this.goals = [];
        this.walls = new Set();
        this._generateLevel();
        console.log(`[SokobanBoard] Level with ${this.boxes.length} boxes, ${this.goals.length} goals, 12 IVM directions`);
    }

    /**
     * Generate a random Sokoban level.
     *
     * NOTE: this places the player, boxes, and goals via a shuffled
     * interior-cell list — it does not run a reachability/deadlock
     * check, so solvability is not guaranteed.
     */
    _generateLevel() {
        const s = this.size;
        const allCells = GridUtils.generateGrid(s);

        // Clear grid
        for (const c of allCells) this.setCell(c, CELL.EMPTY);

        // Create walls around edges
        this.walls.clear();
        for (const c of allCells) {
            const vals = [c.a, c.b, c.c, c.d];
            if (vals.some(v => v === 0 || v === s - 1)) {
                // It's a border cell — check if ALL are border
                const isBorder = vals.filter(v => v === 0 || v === s - 1).length >= 3;
                if (isBorder) {
                    this.walls.add(this.key(c.a, c.b, c.c, c.d));
                    this.setCell(c, CELL.WALL);
                }
            }
        }

        // Find interior cells (not walls)
        const interior = allCells.filter(c => !this.walls.has(this.key(c.a, c.b, c.c, c.d)));
        GridUtils.shuffle(interior);

        // Place player — must land on a cell with at least one in-bounds,
        // non-wall neighbor along the 12 IVM directions, otherwise the
        // player starts already stuck with zero legal moves (directions
        // are one-sided permutations of (0,1,1,2), so cells near the far
        // corner of the grid can have no valid step at all).
        const hasStep = (cell) => GridUtils.DIRECTIONS.some(([da, db, dc, dd]) => {
            const t = { a: cell.a + da, b: cell.b + db, c: cell.c + dc, d: cell.d + dd };
            return GridUtils.inBounds(t.a, t.b, t.c, t.d, s) && !this.walls.has(this.key(t.a, t.b, t.c, t.d));
        });
        const playerIdx = Math.max(0, interior.findIndex(hasStep));
        this.player = interior[playerIdx];
        interior.splice(playerIdx, 1);
        this.setCell(this.player, CELL.PLAYER);

        // Place boxes and goals (3 pairs for size 5)
        const numBoxes = Math.min(3, Math.floor(interior.length / 8));
        this.boxes = [];
        this.goals = [];

        for (let i = 0; i < numBoxes; i++) {
            const boxPos = interior[i * 2];
            const goalPos = interior[i * 2 + 1];
            this.boxes.push(boxPos);
            this.goals.push(goalPos);
            this.setCell(boxPos, CELL.BOX);
            this.setCell(goalPos, CELL.GOAL);
        }
    }

    /** Check if a position is passable (not wall, not box). */
    isPassable(pos) {
        const k = this.key(pos.a, pos.b, pos.c, pos.d);
        if (this.walls.has(k)) return false;
        if (!GridUtils.inBounds(pos.a, pos.b, pos.c, pos.d, this.size)) return false;
        const cell = this.getCell(pos);
        return cell !== CELL.WALL && cell !== CELL.BOX && cell !== CELL.BOX_ON_GOAL;
    }

    /** Check if position has a box. */
    hasBox(pos) {
        const cell = this.getCell(pos);
        return cell === CELL.BOX || cell === CELL.BOX_ON_GOAL;
    }

    /** Check if position is a goal. */
    isGoal(pos) {
        return this.goals.some(g => g.a === pos.a && g.b === pos.b && g.c === pos.c && g.d === pos.d);
    }

    /**
     * Attempt to move the player in a given IVM direction.
     * If a box is in the way, push it (if the cell behind is free).
     * Uses IVM DIRECTIONS (twelve-around-one).
     * @param {number} dirIndex — Index into DIRECTIONS (0–11).
     * @returns {boolean} Whether the move succeeded.
     */
    move(dirIndex) {
        if (this.won || dirIndex < 0 || dirIndex >= 12) return false;

        const dir = GridUtils.DIRECTIONS[dirIndex];
        const target = {
            a: this.player.a + dir[0],
            b: this.player.b + dir[1],
            c: this.player.c + dir[2],
            d: this.player.d + dir[3],
        };

        if (!GridUtils.inBounds(target.a, target.b, target.c, target.d, this.size)) return false;
        if (this.walls.has(this.key(target.a, target.b, target.c, target.d))) return false;

        // Box push
        if (this.hasBox(target)) {
            const behind = {
                a: target.a + dir[0],
                b: target.b + dir[1],
                c: target.c + dir[2],
                d: target.d + dir[3],
            };
            if (!GridUtils.inBounds(behind.a, behind.b, behind.c, behind.d, this.size)) return false;
            if (this.walls.has(this.key(behind.a, behind.b, behind.c, behind.d))) return false;
            if (this.hasBox(behind)) return false;

            // Move box
            const boxIdx = this.boxes.findIndex(b => b.a === target.a && b.b === target.b && b.c === target.c && b.d === target.d);
            this.boxes[boxIdx] = behind;
            this.setCell(target, this.isGoal(target) ? CELL.GOAL : CELL.EMPTY);
            this.setCell(behind, this.isGoal(behind) ? CELL.BOX_ON_GOAL : CELL.BOX);
            this.pushCount++;
        } else if (!this.isPassable(target)) {
            return false;
        }

        // Move player
        this.setCell(this.player, this.isGoal(this.player) ? CELL.GOAL : CELL.EMPTY);
        this.player = target;
        this.setCell(this.player, CELL.PLAYER);
        this.moveCount++;

        this._checkWin();
        return true;
    }

    /** Check if all boxes are on goals. */
    _checkWin() {
        for (const box of this.boxes) {
            if (!this.isGoal(box)) return;
        }
        this.won = true;
        this.gameOver = true;
        console.log(`[SokobanBoard] 🎉 Solved in ${this.moveCount} moves, ${this.pushCount} pushes!`);
    }

    /** Get metadata for HUD. */
    getMetadata() {
        return {
            ...this._baseMetadata(),
            moveCount: this.moveCount,
            pushCount: this.pushCount,
            boxesOnGoals: this.boxes.filter(b => this.isGoal(b)).length,
            totalBoxes: this.boxes.length,
            won: this.won,
        };
    }

    /** Reset to a new level. */
    reset() {
        this.moveCount = 0;
        this.pushCount = 0;
        this.won = false;
        this.gameOver = false;
        this._generateLevel();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SokobanBoard, CELL };
}
