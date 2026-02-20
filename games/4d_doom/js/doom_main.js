/**
 * doom_main.js — Game Controller (Synergetics-integrated)
 * 
 * Wires up Map, Entities, Physics, Renderer, SynergeticsHUD, FX Engine,
 * and Geometry verification. Handles input and game loop.
 */
import { DoomMap } from './doom_map.js';
import { Player, Enemy, Projectile, Particle, Pickup } from './doom_entities.js';
import { Physics } from './doom_physics.js';
import { DoomRenderer } from './doom_render_fps.js';
import { SynergeticsHUD } from './doom_hud_synergetics.js';
import { SynergeticsFX } from './doom_fx.js';
import { markDirty } from './doom_synergetics.js';
import { verifySynergeticsConstants, verifyAllEuler } from './doom_geometry.js';
import { Logger } from './doom_logger.js';
import { WEAPONS, ENEMY_STATS, MAP, RENDER } from './doom_config.js';

export class DoomGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.map = new DoomMap();

        // Spawn player in first room
        const spawn = this.map.rooms[0];
        this.player = new Player(spawn.a, spawn.b, spawn.c, spawn.d);

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.pickups = [];
        this.spawnEnemies();
        this.spawnPickups();

        this.physics = new Physics(this.map);
        this.renderer = new DoomRenderer(canvas);

        // Synergetics subsystems
        this.synergeticsHUD = new SynergeticsHUD();
        this.synergeticsFX = new SynergeticsFX();

        // Run all verification on startup
        this.geometryVerification = this._runGeometryVerification();

        // Input state
        this.keys = {};
        this.damageFlash = 0;
        this.setupInput();

        // Game loop
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.running = true;

        this.loop();
        Logger.engine('Synergetics Engine v3 initialized — Rip and Tear in IVM space!');
    }

    _runGeometryVerification() {
        // Synergetics HUD identities (8 checks)
        const hudVerify = this.synergeticsHUD.verify();

        // Geometry module constants (20+ checks)
        const geoVerify = verifySynergeticsConstants();

        // Euler formula on all polyhedra
        const eulerChecks = verifyAllEuler();
        const eulerPassed = eulerChecks.filter(c => c.valid).length;

        const totalPassed = (hudVerify?.checks?.filter(c => c.passed)?.length || 0) +
            geoVerify.passed + eulerPassed;
        const totalChecks = (hudVerify?.checks?.length || 0) +
            geoVerify.total + eulerChecks.length;

        Logger.geometry(`Total verification: ${totalPassed}/${totalChecks} checks passed`);
        Logger.geometry(`  HUD: ${hudVerify?.checks?.filter(c => c.passed)?.length || 0}/${hudVerify?.checks?.length || 0}`);
        Logger.geometry(`  Geometry: ${geoVerify.passed}/${geoVerify.total}`);
        Logger.geometry(`  Euler: ${eulerPassed}/${eulerChecks.length}`);

        return {
            totalPassed,
            totalChecks,
            hud: hudVerify,
            geometry: geoVerify,
            euler: eulerChecks,
            allPassed: totalPassed === totalChecks
        };
    }

    spawnEnemies() {
        const types = ['imp', 'imp', 'imp', 'demon', 'baron'];
        for (let i = 1; i < this.map.rooms.length; i++) {
            const room = this.map.rooms[i];
            const count = 1 + Math.floor(Math.random() * MAP.ENEMIES_PER_ROOM);
            for (let j = 0; j < count; j++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const e = new Enemy(
                    room.a + (Math.random() - 0.5) * 2,
                    room.b + (Math.random() - 0.5) * 2,
                    room.c, room.d, type
                );
                this.enemies.push(e);
            }
        }
        Logger.map(`Spawned ${this.enemies.length} enemies across ${this.map.rooms.length} IVM rooms`);
    }

    spawnPickups() {
        for (let i = 2; i < this.map.rooms.length; i++) {
            if (Math.random() > 0.5) continue;
            const room = this.map.rooms[i];
            const types = ['health', 'shells', 'cells', 'armor'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.pickups.push(new Pickup(room.a, room.b, room.c, room.d, type));
        }
    }

    setupInput() {
        document.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Digit1' && this.player.weapons[0]) this.player.weaponIndex = 0;
            if (e.code === 'Digit2' && this.player.weapons[1]) this.player.weaponIndex = 1;
            if (e.code === 'Digit3' && this.player.weapons[2]) this.player.weaponIndex = 2;
            if (e.code === 'KeyR' && !this.player.alive) this.respawn();
            if (e.code === 'KeyG') {
                RENDER.IVM_GRID_MODE = (RENDER.IVM_GRID_MODE + 1) % 3;
                Logger.render(`Grid Mode: ${RENDER.IVM_GRID_MODE}`);
            }
            e.preventDefault();
        });
        document.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                this.canvas.requestPointerLock();
            } else {
                this.shoot();
            }
        });

        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement === this.canvas) {
                this.player.angle += e.movementX * 0.003;
            }
        });

        document.addEventListener('mousedown', e => {
            if (document.pointerLockElement === this.canvas) {
                this.shoot();
            }
        });
    }

    shoot() {
        const p = this.player;
        if (!p.alive || p.cooldown > 0) return;

        const weapon = p.weapon;
        if (p.ammo[weapon.ammoKey] <= 0) return;

        p.ammo[weapon.ammoKey]--;
        p.cooldown = weapon.cooldown;
        p.muzzleFlash = 4;

        for (let i = 0; i < weapon.pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const angle = p.angle + spread;

            const step = 0.2;
            for (let dist = 0.5; dist < 20; dist += step) {
                const ha = p.a + Math.cos(angle) * dist;
                const hb = p.b + Math.sin(angle) * dist;

                if (this.map.isSolid(ha, hb, p.c, p.d)) {
                    this.particles.push(new Particle(ha, hb, 'puff', '#aaa'));
                    break;
                }

                let hitEnemy = false;
                for (const e of this.enemies) {
                    if (!e.alive) continue;
                    const hitPos = { a: ha, b: hb, c: p.c, d: p.d };
                    const dist = Quadray.distance(e, hitPos);
                    if (dist < 0.8) {
                        e.hp -= weapon.damage;
                        e.state = 'pain';
                        e.painTimer = 8;
                        this.particles.push(new Particle(ha, hb, 'blood', '#cc0000'));
                        this.particles.push(new Particle(ha, hb, 'blood', '#880000'));
                        if (e.hp <= 0) {
                            e.alive = false;
                            p.score += ENEMY_STATS[e.type].hp;
                            for (let k = 0; k < 5; k++) {
                                this.particles.push(new Particle(e.a, e.b, 'blood', '#aa0000'));
                            }
                        }
                        hitEnemy = true;
                        break;
                    }
                }
                if (hitEnemy) break;
            }
        }
    }

    respawn() {
        const spawn = this.map.rooms[0];
        this.player = new Player(spawn.a, spawn.b, spawn.c, spawn.d);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.pickups = [];
        this.spawnEnemies();
        this.spawnPickups();
        markDirty();
    }

    update(dt) {
        if (!this.player.alive) return;

        const p = this.player;
        const speed = 0.06;
        const turnSpeed = 0.04;

        let da = 0, db = 0;
        const cos = Math.cos(p.angle), sin = Math.sin(p.angle);

        if (this.keys['KeyW']) { da += cos * speed; db += sin * speed; }
        if (this.keys['KeyS']) { da -= cos * speed; db -= sin * speed; }
        if (this.keys['KeyA']) { da += sin * speed; db -= cos * speed; }
        if (this.keys['KeyD']) { da -= sin * speed; db += cos * speed; }

        if (this.keys['ArrowLeft'] || this.keys['KeyQ']) p.angle -= turnSpeed;
        if (this.keys['ArrowRight'] || this.keys['KeyE']) p.angle += turnSpeed;

        let dc = 0, dd = 0;
        if (this.keys['KeyZ']) dd -= speed * 0.5;
        if (this.keys['KeyX']) dd += speed * 0.5;
        if (this.keys['Space']) dc += speed * 0.5;
        if (this.keys['ShiftLeft']) dc -= speed * 0.5;

        this.physics.moveEntity(p, da, db);
        if (dc !== 0 || dd !== 0) this.physics.moveEntityCD(p, dc, dd);

        // View bob
        p.isMoving = (da !== 0 || db !== 0);
        if (p.isMoving) {
            p.bobPhase += 0.15;
            p.bobAmount = Math.sin(p.bobPhase) * 8;
        } else {
            p.bobAmount *= 0.9;
        }

        if (p.cooldown > 0) p.cooldown--;
        if (p.muzzleFlash > 0) p.muzzleFlash--;
        if (p.hitMarkerTimer > 0) p.hitMarkerTimer--;
        if (this.damageFlash > 0) this.damageFlash -= 0.05;

        if (this.keys['MouseLeft'] && p.weapon.auto) this.shoot();

        this.physics.updateProjectiles(this.projectiles, this.enemies, p, this.particles);
        this.physics.updateParticles(this.particles);
        this.physics.updateEnemies(this.enemies, p, this.projectiles, this.particles);

        // Pickup collection
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            if (!pk.alive) continue;
            if (Quadray.distance(pk, p) < 0.8) {
                pk.alive = false;
                if (pk.type === 'health') p.hp = Math.min(p.maxHp, p.hp + 25);
                if (pk.type === 'shells') { p.ammo.shells += 8; p.weapons[1] = true; }
                if (pk.type === 'cells') { p.ammo.cells += 20; p.weapons[2] = true; }
                if (pk.type === 'armor') p.armor = Math.min(100, p.armor + 50);
                this.pickups.splice(i, 1);
            }
        }

        // Update Synergetics subsystems (throttled)
        this.synergeticsHUD.update(this.map, this.frameCount);
        this.synergeticsFX.update(dt, this.player, this.map);
    }

    loop() {
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;

        this.update(dt);

        // Base render (raycaster + sprites + HUD + minimap)
        this.renderer.render(this);

        // Synergetics overlays (layered on top)
        const ctx = this.renderer.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // FX layer: starfield, floor tessellation, hyperplane glow, hierarchy rings, jitterbug
        this.synergeticsFX.renderAll(ctx, this, W, H);

        // HUD layer: analysis panel, compass, Quadray position
        this.synergeticsHUD.renderFloorGrid(ctx, this.player, W, H);
        this.synergeticsHUD.renderCompass(ctx, this.player, W, H);
        this.synergeticsHUD.renderPanel(ctx, W, H);
        this.synergeticsHUD.renderQuadrayPosition(ctx, this.player, W, H);

        // Verification badge (top right, below minimap)
        if (this.geometryVerification) {
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            const v = this.geometryVerification;
            ctx.fillStyle = v.allPassed ? '#0f0' : '#f80';
            ctx.fillText(`✓ ${v.totalPassed}/${v.totalChecks} GEO`, W - RENDER.MINIMAP_RADIUS - 15, RENDER.MINIMAP_RADIUS * 2 + 40);
        }

        this.frameCount++;
        requestAnimationFrame(() => this.loop());
    }
}

