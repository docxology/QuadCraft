/**
 * doom_physics.js — Movement, Collision, Projectile Updates, Enemy AI
 * 
 * Uses IVM 8-connected adjacency for collision and AI.
 * Movement respects Quadray coordinate space.
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
     * Check IVM neighborhood around a position.
     * Returns the number of solid IVM neighbors (0-8).
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
     * True 4D DDA Raycast for Line of Sight.
     * Returns true if clear path exists.
     */
    hasLineOfSight(e1, e2) {
        const diffA = e2.a - e1.a;
        const diffB = e2.b - e1.b;
        const diffC = e2.c - e1.c;
        const diffD = e2.d - e1.d;

        const dist = Quadray.distance(e1, e2);
        if (dist === 0) return true;

        const steps = Math.ceil(dist * 2); // More steps for higher precision
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkA = e1.a + t * diffA;
            const checkB = e1.b + t * diffB;
            const checkC = e1.c + t * diffC;
            const checkD = e1.d + t * diffD;
            if (this.map.isSolid(checkA, checkB, checkC, checkD)) {
                return false;
            }
        }
        return true;
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
