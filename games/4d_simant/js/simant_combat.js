/**
 * SimAnt Combat System — Enhanced
 *
 * Features:
 * - Soldiers attack enemy ants within Quadray distance 1.5
 * - Morale bonus: +3 damage when 3+ allies nearby
 * - Terrain advantage: +5 damage defending in own tunnel network
 * - Combat statistics tracking (kills, losses per faction)
 * - Danger pheromone emission at combat locations
 * - Death tick tracking for renderer animations
 *
 * Integrates with SimAntBoard via CombatSystem.resolveCombat(board).
 *
 * @module CombatSystem
 */

class CombatSystem {
    // Combat event log (last N events)
    static log = [];
    static maxLog = 8;

    // Per-faction combat stats
    static stats = {
        yellowKills: 0, redKills: 0,
        yellowDamageDealt: 0, redDamageDealt: 0,
    };

    static addLog(msg) {
        CombatSystem.log.push(msg);
        if (CombatSystem.log.length > CombatSystem.maxLog) {
            CombatSystem.log.shift();
        }
    }

    /**
     * Count allies of a faction within Quadray distance of a position.
     * @param {Array} ants — All alive ants
     * @param {Quadray} pos — Center position
     * @param {number} faction — Faction to count
     * @param {number} radius — Max Quadray distance
     * @returns {number}
     */
    static countAlliesNear(ants, pos, faction, radius) {
        let count = 0;
        for (const a of ants) {
            if (!a.alive || a.faction !== faction) continue;
            const d = Quadray.distance(pos, a.toQuadray());
            if (d <= radius && d > 0) count++; // Exclude self (d > 0)
        }
        return count;
    }

    static resolveCombat(board) {
        const ants = board.ants.filter(a => a.alive);
        for (const ant of ants) {
            if (!ant.alive) continue; // May have died during this pass

            // Find enemies within Quadray distance 1.5
            const antQ = ant.toQuadray();
            const enemies = ants.filter(e =>
                e.alive && e.faction !== ant.faction &&
                Quadray.distance(antQ, e.toQuadray()) <= 1.5
            );

            if (enemies.length === 0) continue;

            // Calculate morale bonus: +3 if 3+ allies within distance 3
            const allyCount = CombatSystem.countAlliesNear(ants, antQ, ant.faction, 3.0);
            const moraleBonus = allyCount >= 3 ? 3 : (allyCount === 0 ? -2 : 0);

            // Base damage by caste
            const baseDmg = ant.caste === CASTE_SOLDIER ? 10 : 2;

            for (const enemy of enemies) {
                if (!enemy.alive) continue;

                // Home territory bonus: +5 if within distance 3 of own nest
                const nestCoords = board.nests[ant.faction];
                const nestQ = new Quadray(nestCoords.a, nestCoords.b, nestCoords.c, nestCoords.d);
                const distToNest = Quadray.distance(antQ, nestQ);
                const homeBonus = distToNest < 3 ? 5 : 0;

                // Tunnel advantage: defender gets +3 if in own tunnel network
                const defenderKey = GridUtils.key(enemy.a, enemy.b, enemy.c, enemy.d);
                const tunnelBonus = board.tunnelSet && board.tunnelSet.has(defenderKey) ? -3 : 0; // Reduces attacker damage

                const totalDmg = Math.max(1, baseDmg + homeBonus + moraleBonus + tunnelBonus);
                enemy.hp -= totalDmg;

                // Track damage stats
                if (ant.faction === 0) CombatSystem.stats.yellowDamageDealt += totalDmg;
                else CombatSystem.stats.redDamageDealt += totalDmg;

                // Emit danger pheromone at combat location
                if (typeof board.emitDanger === 'function') {
                    board.emitDanger(ant.a, ant.b, ant.c, ant.d, ant.faction, 8.0);
                    board.emitDanger(enemy.a, enemy.b, enemy.c, enemy.d, enemy.faction, 8.0);
                }

                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    enemy.deathTick = board.tick;
                    ant.kills++;

                    const factionName = ant.faction === 0 ? 'Yellow' : 'Red';
                    const casteName = ant.caste === CASTE_SOLDIER ? 'soldier'
                        : ant.caste === CASTE_SCOUT ? 'scout' : 'worker';
                    const enemyFaction = enemy.faction === 0 ? 'Yellow' : 'Red';
                    const enemyCaste = enemy.caste === CASTE_QUEEN ? 'QUEEN'
                        : enemy.caste === CASTE_SOLDIER ? 'soldier'
                            : enemy.caste === CASTE_SCOUT ? 'scout' : 'worker';

                    CombatSystem.addLog(
                        `${factionName} ${casteName} killed ${enemyFaction} ${enemyCaste} at (${enemy.a},${enemy.b},${enemy.c},${enemy.d})`
                    );

                    // Update board stats
                    if (ant.faction === 0) {
                        board.stats.yellowKills++;
                        board.stats.redDeaths++;
                    } else {
                        board.stats.redKills++;
                        board.stats.yellowDeaths++;
                    }

                    // Drop carried food
                    if (enemy.carrying > 0) {
                        board.spawnFood(enemy.a, enemy.b, enemy.c, enemy.d);
                        enemy.carrying = 0;
                    }
                }
            }
        }

        // Queen combat: if enemy ant reaches queen (distance < 1.5), queen defends
        for (let f = 0; f < 2; f++) {
            const queen = board.queens[f];
            if (!queen || !queen.alive) continue;
            const queenQ = queen.toQuadray();
            const nearbyEnemies = ants.filter(a =>
                a.alive && a.faction !== f &&
                Quadray.distance(a.toQuadray(), queenQ) <= 1.5
            );
            for (const enemy of nearbyEnemies) {
                enemy.hp -= 50; // Queen deals 50 damage
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    enemy.deathTick = board.tick;
                    const queenFaction = f === 0 ? 'Yellow' : 'Red';
                    const enemyFaction = enemy.faction === 0 ? 'Yellow' : 'Red';
                    CombatSystem.addLog(
                        `${queenFaction} Queen crushed ${enemyFaction} ant near nest!`
                    );
                    if (f === 0) { board.stats.yellowKills++; board.stats.redDeaths++; }
                    else { board.stats.redKills++; board.stats.yellowDeaths++; }
                }
            }
        }

        // Clean up dead ants
        board.ants = board.ants.filter(a => a.alive);
    }

    /** Reset combat stats */
    static resetStats() {
        CombatSystem.log = [];
        CombatSystem.stats = {
            yellowKills: 0, redKills: 0,
            yellowDamageDealt: 0, redDamageDealt: 0,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CombatSystem };
}
