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

    /** Switch to next unlocked weapon. */
    switchWeapon(delta = 1) {
        const start = this.weaponIndex;
        let idx = this.weaponIndex;
        do {
            idx = ((idx + delta) % WEAPONS.length + WEAPONS.length) % WEAPONS.length;
        } while (!this.weapons[idx] && idx !== start);
        this.weaponIndex = idx;
        console.log(`[Player] Weapon: ${this.weapon.name}`);
    }

    /** Switch directly to a weapon by index (if unlocked). */
    selectWeapon(idx) {
        if (idx >= 0 && idx < WEAPONS.length && this.weapons[idx]) {
            this.weaponIndex = idx;
        }
    }

    /** Take damage with armor absorption (50% to armor). */
    takeDamage(amount) {
        if (!this.alive) return;
        const armorAbsorb = Math.min(this.armor, Math.floor(amount * 0.5));
        this.armor -= armorAbsorb;
        this.hp -= (amount - armorAbsorb);
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            console.log('[Player] Killed!');
        }
    }

    /** Apply a pickup item. Returns true if pickup was consumed. */
    applyPickup(pickup) {
        switch (pickup.type) {
            case 'health':
                if (this.hp >= this.maxHp) return false;
                this.hp = Math.min(this.maxHp, this.hp + 25);
                return true;
            case 'armor':
                if (this.armor >= 200) return false;
                this.armor = Math.min(200, this.armor + 50);
                return true;
            case 'ammo_bullets':
                this.ammo.bullets = Math.min(200, this.ammo.bullets + 20);
                return true;
            case 'ammo_shells':
                this.ammo.shells = Math.min(50, this.ammo.shells + 8);
                return true;
            case 'ammo_cells':
                this.ammo.cells = Math.min(300, this.ammo.cells + 40);
                return true;
            case 'shotgun':
                this.weapons[1] = true;
                this.ammo.shells = Math.min(50, this.ammo.shells + 8);
                return true;
            case 'plasma':
                this.weapons[2] = true;
                this.ammo.cells = Math.min(300, this.ammo.cells + 40);
                return true;
            default:
                return false;
        }
    }

    /** Kill the player. */
    kill() {
        this.hp = 0;
        this.alive = false;
    }

    /** Get position as Quadray object */
    get quadray() { return new Quadray(this.a, this.b, this.c, this.d); }

    /** Get Cartesian position */
    get cartesian() { return this.quadray.toCartesian(); }

    /** Quadray distance to another entity */
    distanceTo(other) {
        return Quadray.distance(
            new Quadray(this.a, this.b, 0, 0),
            new Quadray(other.a, other.b, 0, 0)
        );
    }

    /** Distance in CD hyperplane only */
    distanceCD(other) {
        // Compute distance exclusively on the C/D planes by isolating components
        const q1 = new Quadray(0, 0, this.c, this.d);
        const q2 = new Quadray(0, 0, other.c, other.d);
        return Quadray.distance(q1, q2);
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

    /** Take damage. Returns true if killed. */
    takeDamage(amount) {
        if (!this.alive) return false;
        this.hp -= amount;
        this.painTimer = 8;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            return true;
        }
        return false;
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
    static TYPES = ['health', 'armor', 'ammo_bullets', 'ammo_shells', 'ammo_cells', 'shotgun', 'plasma'];

    constructor(a, b, c, d, type) {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.type = type;
        this.alive = true;
        this.bobPhase = Math.random() * Math.PI * 2;
    }

    get quadray() { return new Quadray(this.a, this.b, this.c, this.d); }
}
