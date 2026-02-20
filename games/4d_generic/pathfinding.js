/**
 * pathfinding.js — Quadray/IVM Grid Pathfinding
 *
 * Provides graph search algorithms operating on 4D Quadray grids:
 *   - BFS: Breadth-first search for shortest unweighted path
 *   - A*:  A-star with Manhattan heuristic for weighted navigation
 *   - Flood Fill: Area expansion from a seed (Minesweeper, Life)
 *   - Line of Sight: Ray casting along IVM directions
 *
 * Used by: Pac-Man (ghost AI), Tower Defense (creep paths),
 * Bomberman (enemy patrol), Minesweeper (flood reveal), Catan (longest road).
 *
 * Usage:
 *   const path = QuadrayPathfinder.shortestPath(
 *       { a: 0, b: 0, c: 0, d: 0 },   // start
 *       { a: 5, b: 3, c: 0, d: 0 },   // goal
 *       (pos) => board.getCell(pos) !== 'wall',  // walkability test
 *       board.size
 *   );
 *
 * @module QuadrayPathfinder
 */

// ─── Node.js compatibility ─────────────────────────────────────────────────
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('./grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}

class QuadrayPathfinder {

    /**
     * Breadth-First Search on the IVM grid.
     * Returns the shortest unweighted path from start to goal.
     *
     * @param {{a:number,b:number,c:number,d:number}} start
     * @param {{a:number,b:number,c:number,d:number}} goal
     * @param {function({a:number,b:number,c:number,d:number}):boolean} isWalkable
     *        — Returns true if the position can be traversed.
     * @param {number} size — Grid bounds (0 to size-1).
     * @returns {Array<{a:number,b:number,c:number,d:number}>|null}
     *          — Path from start to goal (inclusive), or null if unreachable.
     */
    static bfs(start, goal, isWalkable, size) {
        const startKey = GridUtils.key(start.a, start.b, start.c, start.d);
        const goalKey = GridUtils.key(goal.a, goal.b, goal.c, goal.d);
        if (startKey === goalKey) return [start];

        const visited = new Set([startKey]);
        const parent = new Map();
        const queue = [start];

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = GridUtils.boundedNeighbors(
                current.a, current.b, current.c, current.d, size
            );

            for (const n of neighbors) {
                const nKey = GridUtils.key(n.a, n.b, n.c, n.d);
                if (visited.has(nKey)) continue;
                if (!isWalkable(n)) continue;

                visited.add(nKey);
                parent.set(nKey, current);

                if (nKey === goalKey) {
                    return QuadrayPathfinder._reconstructPath(parent, start, goal);
                }
                queue.push(n);
            }
        }
        return null; // unreachable
    }

    /**
     * A* search on the IVM grid using Manhattan distance heuristic.
     * Returns the shortest weighted path from start to goal.
     *
     * @param {{a:number,b:number,c:number,d:number}} start
     * @param {{a:number,b:number,c:number,d:number}} goal
     * @param {function({a:number,b:number,c:number,d:number}):boolean} isWalkable
     * @param {number} size — Grid bounds.
     * @param {function({a:number,b:number,c:number,d:number}):number} [costFn]
     *        — Movement cost for entering a cell (default: 1).
     * @returns {Array<{a:number,b:number,c:number,d:number}>|null}
     */
    static shortestPath(start, goal, isWalkable, size, costFn) {
        const startKey = GridUtils.key(start.a, start.b, start.c, start.d);
        const goalKey = GridUtils.key(goal.a, goal.b, goal.c, goal.d);
        if (startKey === goalKey) return [start];

        const moveCost = costFn || (() => 1);

        // Open set as a simple sorted array (adequate for IVM grid sizes)
        const gScore = new Map([[startKey, 0]]);
        const fScore = new Map([[startKey, GridUtils.manhattan(start, goal)]]);
        const parent = new Map();
        const open = [start];
        const closed = new Set();

        while (open.length > 0) {
            // Pick node with lowest fScore
            open.sort((a, b) => {
                const ka = GridUtils.key(a.a, a.b, a.c, a.d);
                const kb = GridUtils.key(b.a, b.b, b.c, b.d);
                return (fScore.get(ka) ?? Infinity) - (fScore.get(kb) ?? Infinity);
            });
            const current = open.shift();
            const currentKey = GridUtils.key(current.a, current.b, current.c, current.d);

            if (currentKey === goalKey) {
                return QuadrayPathfinder._reconstructPath(parent, start, goal);
            }

            closed.add(currentKey);

            const neighbors = GridUtils.boundedNeighbors(
                current.a, current.b, current.c, current.d, size
            );

            for (const n of neighbors) {
                const nKey = GridUtils.key(n.a, n.b, n.c, n.d);
                if (closed.has(nKey)) continue;
                if (!isWalkable(n)) continue;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + moveCost(n);

                if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
                    parent.set(nKey, current);
                    gScore.set(nKey, tentativeG);
                    fScore.set(nKey, tentativeG + GridUtils.manhattan(n, goal));
                    if (!open.some(o =>
                        o.a === n.a && o.b === n.b && o.c === n.c && o.d === n.d
                    )) {
                        open.push(n);
                    }
                }
            }
        }
        return null; // unreachable
    }

    /**
     * Flood fill from a seed position.
     * Returns all reachable cells that satisfy the spread predicate.
     *
     * @param {{a:number,b:number,c:number,d:number}} seed
     * @param {function({a:number,b:number,c:number,d:number}):boolean} canSpread
     *        — Returns true if the flood should propagate to this cell.
     * @param {number} size — Grid bounds.
     * @param {number} [maxCells=Infinity] — Stop after this many cells.
     * @returns {Array<{a:number,b:number,c:number,d:number}>} — All filled cells.
     */
    static floodFill(seed, canSpread, size, maxCells = Infinity) {
        const seedKey = GridUtils.key(seed.a, seed.b, seed.c, seed.d);
        const visited = new Set([seedKey]);
        const result = [seed];
        const queue = [seed];

        while (queue.length > 0 && result.length < maxCells) {
            const current = queue.shift();
            const neighbors = GridUtils.boundedNeighbors(
                current.a, current.b, current.c, current.d, size
            );

            for (const n of neighbors) {
                const nKey = GridUtils.key(n.a, n.b, n.c, n.d);
                if (visited.has(nKey)) continue;
                visited.add(nKey);

                if (canSpread(n)) {
                    result.push(n);
                    queue.push(n);
                    if (result.length >= maxCells) break;
                }
            }
        }
        return result;
    }

    /**
     * Ray cast along a specific IVM direction from an origin.
     * Returns all positions along the ray until blocked or out of bounds.
     *
     * @param {{a:number,b:number,c:number,d:number}} origin
     * @param {{da:number,db:number,dc:number,dd:number}} direction — IVM direction vector.
     * @param {function({a:number,b:number,c:number,d:number}):boolean} isBlocking
     *        — Returns true if the ray should stop at this cell.
     * @param {number} size — Grid bounds.
     * @param {number} [maxRange=Infinity] — Maximum ray length.
     * @returns {Array<{a:number,b:number,c:number,d:number}>}
     *          — All positions along the ray (not including the blocking cell).
     */
    static lineOfSight(origin, direction, isBlocking, size, maxRange = Infinity) {
        const result = [];
        let pos = {
            a: origin.a + direction.da,
            b: origin.b + direction.db,
            c: origin.c + direction.dc,
            d: origin.d + direction.dd,
        };

        while (
            result.length < maxRange &&
            GridUtils.inBounds(pos.a, pos.b, pos.c, pos.d, size)
        ) {
            if (isBlocking(pos)) break;
            result.push({ ...pos });
            pos = {
                a: pos.a + direction.da,
                b: pos.b + direction.db,
                c: pos.c + direction.dc,
                d: pos.d + direction.dd,
            };
        }
        return result;
    }

    /**
     * Find all cells within a Manhattan distance of a center position.
     * Useful for tower ranges, explosion radii, vision cones.
     *
     * @param {{a:number,b:number,c:number,d:number}} center
     * @param {number} range — Maximum Manhattan distance.
     * @param {number} size — Grid bounds.
     * @returns {Array<{a:number,b:number,c:number,d:number}>}
     */
    static cellsInRange(center, range, size) {
        const result = [];
        for (let a = center.a - range; a <= center.a + range; a++) {
            for (let b = center.b - range; b <= center.b + range; b++) {
                for (let c = center.c - range; c <= center.c + range; c++) {
                    for (let d = center.d - range; d <= center.d + range; d++) {
                        if (!GridUtils.inBounds(a, b, c, d, size)) continue;
                        const dist = Math.abs(a - center.a) + Math.abs(b - center.b) +
                            Math.abs(c - center.c) + Math.abs(d - center.d);
                        if (dist <= range && dist > 0) {
                            result.push({ a, b, c, d });
                        }
                    }
                }
            }
        }
        return result;
    }

    // ─── Internal helpers ───────────────────────────────────────────────────

    /**
     * Reconstruct path from parent map.
     * @private
     */
    static _reconstructPath(parent, start, goal) {
        const path = [goal];
        let currentKey = GridUtils.key(goal.a, goal.b, goal.c, goal.d);
        const startKey = GridUtils.key(start.a, start.b, start.c, start.d);

        while (currentKey !== startKey) {
            const prev = parent.get(currentKey);
            if (!prev) break;
            path.unshift(prev);
            currentKey = GridUtils.key(prev.a, prev.b, prev.c, prev.d);
        }
        return path;
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuadrayPathfinder };
}
