/**
 * SimAnt Combat System
 * Soldiers attack enemy ants within Quadray distance 1.
 * Integrates with SimAntBoard via CombatSystem.resolveCombat(board).
 */

class CombatSystem {
    // Combat event log (last N events)
    static log = [];
    static maxLog = 5;

    static addLog(msg) {
        CombatSystem.log.push(msg);
        if (CombatSystem.log.length > CombatSystem.maxLog) {
            CombatSystem.log.shift();
        }
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
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const dmg = ant.caste === CASTE_SOLDIER ? 10 : 2;
                // Home territory bonus: +5 if within distance 3 of own nest
                const nestCoords = board.nests[ant.faction];
                const nestQ = new Quadray(nestCoords.x, nestCoords.y, nestCoords.z, nestCoords.w);
                const distToNest = Quadray.distance(antQ, nestQ);
                const bonus = distToNest < 3 ? 5 : 0;
                enemy.hp -= (dmg + bonus);
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    const factionName = ant.faction === 0 ? 'Yellow' : 'Red';
                    const casteName = ant.caste === CASTE_SOLDIER ? 'soldier' : 'worker';
                    const enemyFaction = enemy.faction === 0 ? 'Yellow' : 'Red';
                    CombatSystem.addLog(
                        `${factionName} ${casteName} killed ${enemyFaction} ant at (${enemy.x},${enemy.y},${enemy.z},${enemy.w})`
                    );
                    // Drop carried food
                    if (enemy.carrying > 0) {
                        board.spawnFood(enemy.x, enemy.y, enemy.z, enemy.w);
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
                    const queenFaction = f === 0 ? 'Yellow' : 'Red';
                    const enemyFaction = enemy.faction === 0 ? 'Yellow' : 'Red';
                    CombatSystem.addLog(
                        `${queenFaction} Queen crushed ${enemyFaction} ant near nest!`
                    );
                }
            }
        }

        // Clean up dead ants
        board.ants = board.ants.filter(a => a.alive);
    }
}
