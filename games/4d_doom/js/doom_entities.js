/**
 * doom_entities.js — Game Entity Classes (Synergetics-native)
 * 
 * All entities use Quadray tetrahedral coordinates (a,b,c,d).
 * Includes Quadray helper methods for distance and conversion.
 */
import { ENEMY_STATS, WEAPONS, IVM } from './doom_config.js';
import { Quadray } from './quadray.js';

export class Player {
    constructor(a, b, c, d) {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.angle = 0;        // Yaw in radians
        this.hp = 100;
        this.maxHp = 100;
        this.armor = 0;
        this.score = 0;
        this.alive = true;

        // Ammo pools
        this.ammo = { bullets: 50, shells: 0, cells: 0 };

        // Weapon state
        this.weaponIndex = 0;
        this.weapons = [true, false, false];
        this.cooldown = 0;
        this.muzzleFlash = 0;

        // View bob
        this.bobPhase = 0;
        this.bobAmount = 0;
        this.isMoving = false;
    }

    get weapon() { return WEAPONS[this.weaponIndex]; }

    /** Get position as Quadray object */
    get quadray() { return new Quadray(this.a, this.b, this.c, this.d); }

    /** Get Cartesian position */
    get cartesian() { return this.quadray.toCartesian(); }

    /** Quadray distance to another entity */
    distanceTo(other) {
        return Quadray.distance(
            new Quadray(this.a, this.b, this.c, this.d),
            new Quadray(other.a, other.b, other.c, other.d)
        );
    }

    /** Distance in AB plane only (for 2D raycaster slice) */
    distanceAB(other) {
        return Math.hypot(this.a - other.a, this.b - other.b);
    }

    /** Distance in CD hyperplane only */
    distanceCD(other) {
        return Math.hypot(this.c - other.c, this.d - other.d);
    }

    /** Get IVM cell parity at current position */
    get cellParity() {
        return (Math.floor(this.a) + Math.floor(this.b) + Math.floor(this.c) + Math.floor(this.d)) % 2 === 0 ? 'tetra' : 'octa';
    }
}

export class Enemy {
    constructor(a, b, c, d, type = 'imp') {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.type = type;
        const stats = ENEMY_STATS[type];
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.attackRange = stats.attackRange;
        this.color = stats.color;
        this.alive = true;
        this.state = 'idle';
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.painTimer = 0;
        this.angle = Math.random() * Math.PI * 2;
    }

    get quadray() { return new Quadray(this.a, this.b, this.c, this.d); }
    get cartesian() { return this.quadray.toCartesian(); }

    /** 4D Quadray distance to another entity */
    distanceTo(other) {
        return Quadray.distance(this.quadray, new Quadray(other.a, other.b, other.c, other.d));
    }

    /** Get IVM cell parity at current position */
    get cellParity() {
        return (Math.floor(this.a) + Math.floor(this.b) + Math.floor(this.c) + Math.floor(this.d)) % 2 === 0 ? 'tetra' : 'octa';
    }
}

export class Projectile {
    constructor(a, b, c, d, va, vb, damage, owner) {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.va = va; this.vb = vb;
        this.damage = damage;
        this.owner = owner;
        this.alive = true;
        this.life = 120;
    }
}

export class Particle {
    constructor(a, b, type, color) {
        this.a = a; this.b = b;
        this.va = (Math.random() - 0.5) * 0.1;
        this.vb = (Math.random() - 0.5) * 0.1;
        this.type = type;
        this.color = color || '#ff0000';
        this.life = 15 + Math.floor(Math.random() * 15);
        this.maxLife = this.life;
    }
}

export class Pickup {
    constructor(a, b, c, d, type) {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.type = type;
        this.alive = true;
        this.bobPhase = Math.random() * Math.PI * 2;
    }

    get quadray() { return new Quadray(this.a, this.b, this.c, this.d); }
}
