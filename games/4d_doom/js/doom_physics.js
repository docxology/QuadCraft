/**
 * doom_physics.js — Movement, Collision, Projectile Updates, Enemy AI
 * 
 * Collision and LOS traverse DoomMap's independent raw four-index cells.
 * Physical ranges continue to use the shared Cartesian Quadray metric.
 */
import { Particle } from './doom_entities.js';
import { IVM } from './doom_config.js';
import { Quadray } from './quadray.js';
import { Logger } from './doom_logger.js';

export class Physics {
    constructor(map) {
        this.map = map;
    }

    /** Move an entity with wall-sliding collision in AB plane */
    moveEntity(ent, da, db) {
        const r = 0.2; // Collision radius
        // Try A axis
        const na = ent.a + da;
        if (!this.map.isSolid(na + r * Math.sign(da), ent.b, ent.c, ent.d) &&
            !this.map.isSolid(na + r * Math.sign(da), ent.b + r, ent.c, ent.d) &&
            !this.map.isSolid(na + r * Math.sign(da), ent.b - r, ent.c, ent.d)) {
            ent.a = na;
        }
        // Try B axis
        const nb = ent.b + db;
        if (!this.map.isSolid(ent.a, nb + r * Math.sign(db), ent.c, ent.d) &&
            !this.map.isSolid(ent.a + r, nb + r * Math.sign(db), ent.c, ent.d) &&
            !this.map.isSolid(ent.a - r, nb + r * Math.sign(db), ent.c, ent.d)) {
            ent.b = nb;
        }
    }

    /** Move entity along C or D axis (4D hyperplane shift) */
    moveEntityCD(ent, dc, dd) {
        const nc = ent.c + dc;
        if (!this.map.isSolid(ent.a, ent.b, nc, ent.d)) ent.c = nc;
        const nd = ent.d + dd;
        if (!this.map.isSolid(ent.a, ent.b, ent.c, nd)) ent.d = nd;
    }

    /**
     * Check the eight signed raw-label neighbors around a position.
     * Returns the number of solid neighbors (0-8).
     */
    countSolidNeighbors(a, b, c, d) {
        let count = 0;
        for (const [da, db, dc, dd] of IVM.DIRECTIONS) {
            if (this.map.isSolid(a + da, b + db, c + dc, d + dd)) count++;
        }
        return count;
    }

    /**
     * Calculate Quadray distance between two entities.
     */
    quadrayDistance(e1, e2) {
        return Quadray.distance(
            new Quadray(e1.a, e1.b, e1.c, e1.d),
            new Quadray(e2.a, e2.b, e2.c, e2.d)
        );
    }

    /** Update all projectiles */
    updateProjectiles(projectiles, enemies, player, particles) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.a += p.va;
            p.b += p.vb;
            p.life--;

            // Wall collision
            if (this.map.isSolid(p.a, p.b, p.c, p.d) || p.life <= 0) {
                p.alive = false;
                particles.push(new Particle(p.a, p.b, 'puff', '#ffaa00'));
            }

            // Hit enemies (player projectiles)
            if (p.alive && p.owner === 'player') {
                for (const e of enemies) {
                    if (!e.alive) continue;
                    // Check collision with enemy
                    const dist = Quadray.distance(e, p);
                    if (dist < 0.8) {
                        e.hp -= p.damage;
                        e.state = 'pain';
                        e.painTimer = 10;
                        p.alive = false;
                        particles.push(new Particle(p.a, p.b, 'blood', '#cc0000'));
                        particles.push(new Particle(p.a, p.b, 'blood', '#990000'));
                        if (e.hp <= 0) { e.alive = false; player.score += 100; }
                        break;
                    }
                }
            }

            // Hit player (enemy projectiles)
            if (p.alive && p.owner === 'enemy') {
                // Check collision with player
                const dist = Quadray.distance(player, p);
                if (dist < 0.6) {
                    player.hp -= p.damage;
                    p.alive = false;
                    particles.push(new Particle(p.a, p.b, 'blood', '#cc0000'));
                    if (player.hp <= 0) { player.hp = 0; player.alive = false; }
                }
            }

            if (!p.alive) projectiles.splice(i, 1);
        }
    }

    /** Update all particles */
    updateParticles(particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.a += p.va;
            p.b += p.vb;
            p.life--;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    /**
     * First obstruction on the closed raw-label segment, ordered from start.
     * Returns {t, cell, position}, with fractional segment parameter t, or null.
     * Gauge-equivalent physical points can occupy different map cells.
     * At simultaneous crossings, check the boundary's floor cell as well as
     * either side; never visit arbitrary axis-order neighbors.
     */
    firstObstruction(e1, e2) {
        const start = [e1.a, e1.b, e1.c, e1.d];
        const delta = [e2.a - e1.a, e2.b - e1.b, e2.c - e1.c, e2.d - e1.d];
        const cell = start.map(Math.floor);
        const next = new Array(4);
        const obstruction = t => ({
            t,
            cell: [...cell],
            position: {
                a: start[0] + delta[0] * t,
                b: start[1] + delta[1] * t,
                c: start[2] + delta[2] * t,
                d: start[3] + delta[3] * t
            }
        });
        let enteredAt = 0;

        while (true) {
            if (this.map.isSolid(...cell)) return obstruction(enteredAt);
            for (let axis = 0; axis < 4; axis++) {
                next[axis] = delta[axis] === 0 ? Infinity :
                    (cell[axis] + (delta[axis] > 0 ? 1 : 0) - start[axis]) / delta[axis];
            }
            const t = Math.min(...next);
            if (t > 1) return null;

            // floor(integer boundary) belongs to the positive-side cell.
            for (let axis = 0; axis < 4; axis++) {
                if (next[axis] === t && delta[axis] > 0) cell[axis]++;
            }
            if (this.map.isSolid(...cell)) return obstruction(t);
            if (t === 1) return null;
            for (let axis = 0; axis < 4; axis++) {
                if (next[axis] === t && delta[axis] < 0) cell[axis]--;
            }
            enteredAt = t;
        }
    }

    hasLineOfSight(e1, e2) {
        return this.firstObstruction(e1, e2) === null;
    }

    /**
     * Live AB hitscan: raw ray length/cell occupancy, physical enemy radius.
     * rawDistance is measured along (cos(angle), sin(angle), 0, 0), not XYZ.
     * Walls win ties, including the closed end boundary and the starting cell.
     */
    traceShot(origin, angle, enemies, maxRawDistance = 20) {
        const da = Math.cos(angle), db = Math.sin(angle);
        const end = {
            a: origin.a + da * maxRawDistance,
            b: origin.b + db * maxRawDistance,
            c: origin.c, d: origin.d
        };
        const wall = this.firstObstruction(origin, end);
        let rawDistance = wall ? wall.t * maxRawDistance : maxRawDistance;
        let enemy = null;
        const direction = new Quadray(da, db, 0, 0).toCartesian();
        const speedSquared = direction.x ** 2 + direction.y ** 2 + direction.z ** 2;
        for (const candidate of enemies) {
            if (!candidate.alive) continue;
            const offset = new Quadray(candidate.a - origin.a, candidate.b - origin.b,
                candidate.c - origin.c, candidate.d - origin.d).toCartesian();
            const along = offset.x * direction.x + offset.y * direction.y + offset.z * direction.z;
            const radiusResidual = offset.x ** 2 + offset.y ** 2 + offset.z ** 2 - 0.8 ** 2;
            const discriminant = along ** 2 - speedSquared * radiusResidual;
            // A tangent does not enter the existing strict physical hit radius.
            if (discriminant <= 0) continue;
            const root = Math.sqrt(discriminant);
            const exit = (along + root) / speedSquared;
            const entry = Math.max(0, (along - root) / speedSquared);
            if (exit <= 0 || entry > maxRawDistance) continue;
            if (entry < rawDistance || (!wall && !enemy && entry === rawDistance)) {
                rawDistance = entry;
                enemy = candidate;
            }
        }
        if (!enemy && !wall) return null;
        return {
            enemy,
            rawDistance,
            cell: enemy ? null : wall.cell,
            position: {
                a: origin.a + da * rawDistance,
                b: origin.b + db * rawDistance,
                c: origin.c, d: origin.d
            }
        };
    }

    /** 
     * Enemy AI — intelligent state machine with LOS, flanking, and wandering.
     */
    updateEnemies(enemies, player, projectiles, particles) {
        for (const e of enemies) {
            if (!e.alive) continue;

            const cdDist = Math.hypot(e.c - player.c, e.d - player.d);
            if (cdDist > 2) continue;

            const dist = Quadray.distance(e, player);
            const angleToPlayer = Math.atan2(player.b - e.b, player.a - e.a);
            const hasLOS = this.hasLineOfSight(e, player);

            if (e.painTimer > 0) { e.painTimer--; continue; }
            if (e.attackCooldown > 0) e.attackCooldown--;

            const oldState = e.state;

            if (hasLOS) {
                e.lastSeenPlayer = { a: player.a, b: player.b, c: player.c, d: player.d };
                if (dist <= 1.5 && e.attackCooldown <= 0) {
                    e.state = 'attack';
                    player.hp -= e.damage;
                    if (player.hp <= 0) { player.hp = 0; player.alive = false; }
                    e.attackCooldown = 60;
                    particles.push(new Particle(player.a, player.b, 'blood', '#cc0000'));
                    Logger.ai(`Enemy attacked player (-${e.damage} HP)`);
                } else if (dist < e.attackRange) {
                    e.state = 'chase';
                    e.angle = angleToPlayer;
                    this.moveEntity(e, Math.cos(e.angle) * e.speed, Math.sin(e.angle) * e.speed);
                } else {
                    e.state = 'idle';
                }
            } else {
                if (e.lastSeenPlayer) {
                    const distToLastSeen = Quadray.distance(e, e.lastSeenPlayer);
                    if (distToLastSeen > 1.0) {
                        e.state = 'flank';
                        e.angle = Math.atan2(e.lastSeenPlayer.b - e.b, e.lastSeenPlayer.a - e.a);
                        this.moveEntity(e, Math.cos(e.angle) * e.speed, Math.sin(e.angle) * e.speed);
                    } else {
                        e.state = 'wander';
                        e.lastSeenPlayer = null;
                        this.wander(e);
                    }
                } else {
                    e.state = 'wander';
                    this.wander(e);
                }
            }
            if (e.state !== oldState && e.state !== 'wander') Logger.ai(`Enemy state changed: ${oldState} -> ${e.state}`);
        }
    }

    wander(e) {
        if (Math.random() < 0.05) e.angle += (Math.random() - 0.5) * Math.PI;
        this.moveEntity(e, Math.cos(e.angle) * e.speed * 0.3, Math.sin(e.angle) * e.speed * 0.3);
    }
}
