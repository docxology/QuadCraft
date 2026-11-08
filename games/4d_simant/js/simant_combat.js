/**
 * SimAnt Combat System — Enhanced
 *
 * Features:
 * - Ants attack within raw Manhattan distance 1.5 (same/adjacent raw cell)
 * - Morale bonus: +3 damage when 3+ allies nearby
 * - Home bonus: +5 damage when attacking within distance 3 of your own nest
 * - Tunnel defense: -3 damage taken when the defender is inside their tunnel network
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
     * Count allies within raw graph distance, excluding an ant by identity.
     * @param {Array} ants — All alive ants
     * @param {Ant} pos — Center ant (also identity excluded)
     * @param {number} faction — Faction to count
     * @param {number} radius — Max raw Manhattan distance
     * @returns {number}
     */
    static countAlliesNear(ants, pos, faction, radius) {
        let count = 0;
        for (const a of ants) {
            if (!a.alive || a.faction !== faction || a === pos) continue;
            if (GridUtils.manhattan(pos, a) <= radius) count++;
        }
        return count;
    }

    static resolveCombat(board) {
        if (board.gameOver) return;
        const ants = board.ants.filter(a => a.alive);
        for (const ant of ants) {
            if (!ant.alive) continue; // May have died during this pass

            // Raw graph proximity: projected aliases are not gameplay neighbors.
            const enemies = ants.filter(e =>
                e.alive && e.faction !== ant.faction &&
                GridUtils.manhattan(ant, e) <= 1.5
            );

            if (enemies.length === 0) continue;

            // Calculate morale bonus: +3 if 3+ allies within distance 3
            const allyCount = CombatSystem.countAlliesNear(ants, ant, ant.faction, 3.0);
            const moraleBonus = allyCount >= 3 ? 3 : (allyCount === 0 ? -2 : 0);

            // Base damage by caste
            const baseDmg = ant.caste === CASTE_SOLDIER ? 10 : 2;

            for (const enemy of enemies) {
                if (!enemy.alive) continue;

                // Home territory bonus: attacker gets +5 if within distance 3 of own nest
                const nestCoords = board.nests[ant.faction];
                const distToNest = GridUtils.manhattan(ant, nestCoords);
                const homeBonus = distToNest < 3 ? 5 : 0;

                // Tunnel defense: defender takes -3 (reduced damage) if in own tunnel network
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
            const nearbyEnemies = ants.filter(a =>
                a.alive && a.faction !== f &&
                GridUtils.manhattan(a, queen) <= 1.5
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
