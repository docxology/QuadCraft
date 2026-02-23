/**
 * Red Colony AI & Yellow Assist AI for 4D SimAnt
 *
 * RedColonyAI: Four-phase strategy with resource management:
 *   Phase 1 (Early): Produce workers, explore
 *   Phase 2 (Growth): Add scouts, expand territory
 *   Phase 3 (Mid): Mix workers and soldiers, tactical positioning
 *   Phase 4 (Late): Aggressive — send soldiers toward enemy
 *
 * YellowAssistAI: Optional auto-forage assistant for the player.
 *
 * @module SimAntAI
 */

// Constants (duplicated from simant_board.js for standalone loading)
if (typeof FACTION_RED === 'undefined') {
    var FACTION_RED = 1;
    var FACTION_YELLOW = 0;
    var CASTE_WORKER = 1;
    var CASTE_SOLDIER = 2;
    var CASTE_SCOUT = 3;
}
if (typeof MAX_ANTS_PER_FACTION === 'undefined') {
    var MAX_ANTS_PER_FACTION = 60;
}

class RedColonyAI {
    constructor(board) {
        this.board = board;
        this.faction = FACTION_RED;
        this.phase = 1;
        this.scoutDeployed = false;
    }

    update() {
        const board = this.board;
        const food = board.foodStored[this.faction];
        const myAnts = board.ants.filter(a => a.faction === this.faction && a.alive);
        const antCount = myAnts.length;
        const queen = board.queens[this.faction];

        // Cannot do anything without a queen
        if (!queen || !queen.alive) return;

        // Determine phase based on ant count and game state
        const enemyAnts = board.ants.filter(a => a.faction !== this.faction && a.alive).length;
        if (antCount < 10) this.phase = 1;
        else if (antCount < 20) this.phase = 2;
        else if (antCount < 35) this.phase = 3;
        else this.phase = 4;

        const workers = myAnts.filter(a => a.caste === CASTE_WORKER);
        const soldiers = myAnts.filter(a => a.caste === CASTE_SOLDIER);
        const scouts = myAnts.filter(a => a.caste === CASTE_SCOUT);
        const atCap = board.atPopCap(this.faction);

        // Phase 1 (early): produce workers, explore
        if (this.phase === 1) {
            if (food >= 10 && !atCap) {
                board.foodStored[this.faction] -= 10;
                board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_WORKER);
            }
        }
        // Phase 2 (growth): add scouts, continue workers
        else if (this.phase === 2) {
            // Deploy 1-2 scouts for exploration
            if (scouts.length < 2 && food >= 10 && !atCap) {
                board.foodStored[this.faction] -= 10;
                const scout = board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_SCOUT);
                if (scout) scout.state = 'scouting';
            } else if (food >= 10 && !atCap) {
                board.foodStored[this.faction] -= 10;
                board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_WORKER);
            }
        }
        // Phase 3 (mid): mix workers and soldiers, maintain ratio
        else if (this.phase === 3) {
            const workerRatio = workers.length / Math.max(1, antCount);
            // Maintain ~60% workers, ~30% soldiers, ~10% scouts
            if (soldiers.length < workers.length * 0.5 && food >= 50 && !atCap) {
                board.foodStored[this.faction] -= 50;
                board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_SOLDIER);
            } else if (food >= 10 && workerRatio < 0.6 && !atCap) {
                board.foodStored[this.faction] -= 10;
                board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_WORKER);
            }

            // Position soldiers defensively around nest (IVM perimeter)
            const nestCoords = board.nests[this.faction];
            if (nestCoords) {
                for (const s of soldiers) {
                    if (!s.target) {
                        const nestDist = GridUtils.manhattan(
                            { a: s.a, b: s.b, c: s.c, d: s.d },
                            nestCoords
                        );
                        // If far from nest, patrol nearby
                        if (nestDist > 5) {
                            s.target = { a: nestCoords.a, b: nestCoords.b, c: nestCoords.c, d: nestCoords.d };
                            s.state = 'attacking'; // Use attack movement toward nest
                        }
                    }
                }
            }
        }
        // Phase 4 (late): aggressive — produce soldiers and attack
        else {
            if (food >= 50 && Math.random() < 0.5 && !atCap) {
                board.foodStored[this.faction] -= 50;
                board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_SOLDIER);
            }
            // Direct soldiers toward enemy nest
            const enemyNest = board.nests[0]; // Yellow nest
            if (enemyNest) {
                for (const s of soldiers) {
                    s.target = { a: enemyNest.a, b: enemyNest.b, c: enemyNest.c, d: enemyNest.d };
                    s.state = 'attacking';
                }
            }
        }
    }
}

/**
 * YellowAssistAI — Auto-forage assistant for the player's colony.
 * When enabled, workers automatically return food and new workers are spawned.
 */
class YellowAssistAI {
    constructor(board) {
        this.board = board;
        this.faction = FACTION_YELLOW;
    }

    update() {
        const board = this.board;
        const food = board.foodStored[this.faction];
        const queen = board.queens[this.faction];
        if (!queen || !queen.alive) return;

        const myAnts = board.ants.filter(a => a.faction === this.faction && a.alive);
        const antCount = myAnts.length;
        const workers = myAnts.filter(a => a.caste === CASTE_WORKER);
        const atCap = board.atPopCap(this.faction);

        // Auto-spawn workers if we can afford it and need more
        if (workers.length < 20 && food >= 10 && !atCap) {
            board.foodStored[this.faction] -= 10;
            board.spawnAnt(queen.a, queen.b, queen.c, queen.d, this.faction, CASTE_WORKER);
        }

        // Set idle workers to foraging
        for (const w of workers) {
            if (w.state === 'idle') {
                w.state = 'foraging';
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RedColonyAI, YellowAssistAI };
}
