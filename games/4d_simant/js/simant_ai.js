/**
 * Red Colony AI for 4D SimAnt
 * Three-phase strategy: early workers, mid-game mix, late-game aggression.
 */

// Constants (duplicated from simant_board.js for standalone loading)
if (typeof FACTION_RED === 'undefined') {
    var FACTION_RED = 1;
    var CASTE_WORKER = 1;
    var CASTE_SOLDIER = 2;
}

class RedColonyAI {
    constructor(board) {
        this.board = board;
        this.faction = FACTION_RED; // 1
    }

    update() {
        const board = this.board;
        const food = board.foodStored[this.faction];
        const myAnts = board.ants.filter(a => a.faction === this.faction && a.alive);
        const antCount = myAnts.length;
        const queen = board.queens[this.faction];

        // Cannot do anything without a queen
        if (!queen || !queen.alive) return;

        // Phase 1 (early): produce workers, explore
        if (antCount < 15) {
            if (food >= 10) {
                board.foodStored[this.faction] -= 10;
                board.spawnAnt(queen.x, queen.y, queen.z, queen.w, this.faction, CASTE_WORKER);
            }
        }
        // Phase 2 (mid): mix of workers and soldiers
        else if (antCount < 30) {
            if (food >= 50 && Math.random() < 0.3) {
                board.foodStored[this.faction] -= 50;
                board.spawnAnt(queen.x, queen.y, queen.z, queen.w, this.faction, CASTE_SOLDIER);
            } else if (food >= 10) {
                board.foodStored[this.faction] -= 10;
                board.spawnAnt(queen.x, queen.y, queen.z, queen.w, this.faction, CASTE_WORKER);
            }
        }
        // Phase 3 (late): aggressive -- send soldiers toward enemy
        else {
            if (food >= 50 && Math.random() < 0.5) {
                board.foodStored[this.faction] -= 50;
                board.spawnAnt(queen.x, queen.y, queen.z, queen.w, this.faction, CASTE_SOLDIER);
            }
            // Direct soldiers toward enemy nest
            const soldiers = myAnts.filter(a => a.caste === CASTE_SOLDIER);
            const enemyNest = board.nests[0]; // Yellow nest
            for (const s of soldiers) {
                // Bias movement toward enemy by setting target
                s.target = { x: enemyNest.x, y: enemyNest.y, z: enemyNest.z, w: enemyNest.w };
                s.state = 'attacking';
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RedColonyAI };
}
