/**
 * doom_physics.js — Movement, Collision, Projectile Updates, Enemy AI
 * 
 * Uses IVM 8-connected adjacency for collision and AI.
 * Movement respects Quadray coordinate space.
 */
import { Particle } from './doom_entities.js';
import { IVM } from './doom_config.js';
import { Quadray } from './quadray.js';

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
                    const dist = Math.hypot(e.a - p.a, e.b - p.b);
                    if (dist < 0.5) {
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
                const dist = Math.hypot(player.a - p.a, player.b - p.b);
                if (dist < 0.4) {
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
     * Enemy AI — uses IVM adjacency for movement and Quadray distance for range.
     */
    updateEnemies(enemies, player, projectiles, particles) {
        for (const e of enemies) {
            if (!e.alive) continue;

            // Only act if in same C,D hyperplane (within 2 units)
            const cdDist = Math.hypot(e.c - player.c, e.d - player.d);
            if (cdDist > 2) continue;

            const dist = Math.hypot(e.a - player.a, e.b - player.b);
            const angleToPlayer = Math.atan2(player.b - e.b, player.a - e.a);

            if (e.painTimer > 0) { e.painTimer--; continue; }
            if (e.attackCooldown > 0) e.attackCooldown--;

            // State machine with IVM-aware movement
            if (dist < e.attackRange && dist > 1.5) {
                e.state = 'chase';
                e.angle = angleToPlayer;
                this.moveEntity(e, Math.cos(e.angle) * e.speed, Math.sin(e.angle) * e.speed);
            } else if (dist <= 1.5 && e.attackCooldown <= 0) {
                e.state = 'attack';
                player.hp -= e.damage;
                if (player.hp <= 0) { player.hp = 0; player.alive = false; }
                e.attackCooldown = 60;
                particles.push(new Particle(player.a, player.b, 'blood', '#cc0000'));
            } else if (dist < 12) {
                e.state = 'chase';
                e.angle = angleToPlayer;
                this.moveEntity(e, Math.cos(e.angle) * e.speed * 0.5, Math.sin(e.angle) * e.speed * 0.5);
            } else {
                e.state = 'idle';
                if (Math.random() < 0.01) e.angle = Math.random() * Math.PI * 2;
                this.moveEntity(e, Math.cos(e.angle) * e.speed * 0.3, Math.sin(e.angle) * e.speed * 0.3);
            }
        }
    }
}
