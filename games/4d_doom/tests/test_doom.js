/**
 * test_doom.js — Comprehensive 4D Doom Synergetics Test Suite
 * 
 * 13 test sections with 90+ tests covering:
 *   1. Configuration (IVM constants)
 *   2. Quadray operations (IVM utilities, round-trip)
 *   3. Map generation (sparse storage, slicing, room shapes)
 *   4. Entity Quadray helpers
 *   5. Physics (IVM neighbors, Quadray distance)
 *   6. Synergetics analysis (tetravolumes, coordination, polyhedra)
 *   7. Geometric identity verification (8 checks)
 *   8. Geometry module (Concentric Hierarchy, Jitterbug, frequency)
 *   9. Polyhedra census (Euler verification)
 *  10. Volume conversions and constants
 */
import { CELL, IVM, MAP, WEAPONS, ENEMY_STATS, RENDER, COLORS } from '../js/doom_config.js';
import { Quadray, ROOT2, S3 } from '../js/quadray.js';
import { DoomMap } from '../js/doom_board.js';
import { Player, Enemy, Projectile, Particle, Pickup } from '../js/doom_entities.js';
import { Physics } from '../js/doom_physics.js';
import { DoomGame } from '../js/doom_game.js';
import { SynergeticsHUD } from '../js/doom_hud_synergetics.js';
import { SynergeticsFX } from '../js/doom_fx.js';
import {
    extractCells, calculateTetravolume, analyzeIVMGrid, calculateCoordinationNumbers,
    detectSynergeticsPolyhedra, calculateCenterOfMass, angleBetweenQuadrays,
    computeAllAnalysis, markDirty
} from '../js/doom_synergetics.js';
import {
    CONCENTRIC_HIERARCHY, HIERARCHY_ORDER, jitterbugTransform, jitterbugAngle,
    analyzeFrequency, POLYHEDRA_CENSUS, verifyEuler, verifyAllEuler,
    analyzeClosestPacking, greatCircle, xyzToTetravolumes, tetravolumesToXYZ,
    tetrahedronVolume, verifySynergeticsConstants
} from '../js/doom_geometry.js';

let passed = 0, failed = 0, total = 0;
const results = [];

function assert(condition, msg) {
    total++;
    if (condition) {
        passed++;
        results.push({ pass: true, msg });
    } else {
        failed++;
        results.push({ pass: false, msg });
        console.error('FAIL:', msg);
    }
}

function approx(a, b, eps = 0.05) { return Math.abs(a - b) < eps; }

// Exercise the real controller kernel without constructing a Canvas renderer,
// installing DOM input listeners, or starting requestAnimationFrame.
function gameplayKernel(map, player = new Player(4.5, 4.5, 2.5, 2.5)) {
    const game = Object.create(DoomGame.prototype);
    Object.assign(game, {
        map, player, physics: new Physics(map), enemies: [], projectiles: [],
        particles: [], pickups: [], keys: {}, damageFlash: 0,
        lastTime: 0, accumulatorSeconds: 0, simulationTickCount: 0, frameCount: 0,
        synergeticsHUD: new SynergeticsHUD(), synergeticsFX: new SynergeticsFX()
    });
    return game;
}

function gameplayRegressions() {
    const map = new DoomMap();
    map.cells.clear();
    for (let a = 0; a < map.size; a++)
        for (let b = 0; b < map.size; b++)
            map.setCell(a, b, 2, 2, CELL.FLOOR);
    const shotGame = (a, b, angle, enemies) => {
        const game = gameplayKernel(map, new Player(a, b, 2.5, 2.5));
        game.player.angle = angle;
        game.enemies = enemies;
        game.shoot();
        return game;
    };
    let target = new Enemy(6, 5.95, 2.5, 2.5);
    map.setCell(5, 4, 2, 2, CELL.WALL);
    let game = shotGame(4.5, 4.45, Math.PI / 4, [target]);
    assert(target.hp === 60 && game.particles.length === 1 &&
        game.particles[0].type === 'puff', 'Live pistol stops at a briefly crossed thin wall');
    assert(approx(game.particles[0].a, 5, 1e-12) && game.particles[0].b < 5,
        'Wall impact is at the first raw-cell boundary, not a sampled point');
    assert(game.player.ammo.bullets === 49 && game.player.cooldown === 12,
        'Blocked shot still consumes ammo and starts the calibrated cooldown');
    game.shoot();
    assert(game.player.ammo.bullets === 49, 'Cooldown prevents immediate repeat fire');

    target = new Enemy(6, 4.5, 2.5, 2.5);
    game = shotGame(4.9, 4.5, 0, [target]);
    assert(target.hp === 60 && approx(game.particles[0].a, 5, 1e-12),
        'Wall nearer than the former 0.5 raw start offset blocks the live pistol');
    game = shotGame(5.1, 4.5, 0, [target]);
    assert(target.hp === 60 && approx(game.particles[0].a, 5.1, 1e-12),
        'A shot starting in solid raw occupancy is blocked at distance zero');
    map.setCell(5, 4, 2, 2, CELL.DOOR);
    game = shotGame(4.9, 4.5, 0, [target]);
    assert(target.hp === 45 && target.state === 'pain' && target.painTimer === 8,
        'Passable door retains live damage and pain semantics');
    map.setCell(5, 4, 2, 2, CELL.FLOOR);

    const far = new Enemy(8, 4.5, 2.5, 2.5);
    const near = new Enemy(6, 4.5, 2.5, 2.5);
    near.hp = 15;
    game = shotGame(4.5, 4.5, 0, [far, near]);
    assert(far.hp === 60 && !near.alive && game.player.score === ENEMY_STATS.imp.hp,
        'Earliest physical sphere hit wins over enemy array order and awards kill score');
    game.player.cooldown = 0;
    game.shoot();
    assert(far.hp === 45, 'Subsequent live shot ignores the dead nearer enemy');
    const alias = new Enemy(11, 9.5, 7.5, 7.5);
    game = shotGame(4.5, 4.5, 0, [alias]);
    assert(alias.hp === 45, 'Enemy hit radius uses physical position, not raw CD proximity');
    const offPlane = new Enemy(6, 4.5, 8.5, 2.5);
    game = shotGame(4.5, 4.5, 0, [offPlane]);
    assert(offPlane.hp === 60, 'AB alignment alone cannot hit a physically distant enemy');

    target = new Enemy(25, 4.5, 2.5, 2.5);
    game = shotGame(4, 4.5, 0, [target]);
    assert(target.hp === 60 && game.particles.length === 1 &&
        approx(game.particles[0].a, 24, 1e-12),
        'Live shot includes the solid outer boundary exactly at its 20-raw-unit endpoint');
    const endpoint = game.physics.firstObstruction(game.player, { a: 24, b: 4.5, c: 2.5, d: 2.5 });
    assert(endpoint.t === 1 && endpoint.cell[0] === 24,
        'Ordered DDA returns the closed endpoint obstruction and raw cell');

    // No random AI wandering is involved: both actual enemies have clear LOS.
    function timedGame() {
        const timed = gameplayKernel(map);
        timed.player.hp = 80;
        timed.player.cooldown = 12;
        timed.keys.KeyW = true;
        timed.enemies = [new Enemy(9, 4.5, 2.5, 2.5), new Enemy(4.8, 4.5, 2.5, 2.5)];
        timed.pickups = [new Pickup(5, 4.5, 2.5, 2.5, 'health')];
        return timed;
    }
    function worldState(timed) {
        return JSON.stringify({
            ticks: timed.simulationTickCount,
            player: [timed.player.a, timed.player.b, timed.player.hp, timed.player.cooldown,
                timed.player.bobPhase, timed.player.bobAmount],
            enemies: timed.enemies.map(e => [e.a, e.b, e.hp, e.state, e.attackCooldown, e.painTimer]),
            pickups: timed.pickups.length,
            fx: [timed.synergeticsFX.time, timed.synergeticsFX.jitterbugPhase]
        });
    }
    const partitions = [
        Array(60).fill(1000 / 60), Array(120).fill(1000 / 120),
        Array(4).fill(250), [100, 200, 50, 150, 250, 250]
    ];
    const worlds = partitions.map(partition => {
        const timed = timedGame();
        for (const elapsedMs of partition) timed.advanceFrame(elapsedMs);
        return timed;
    });
    assert(worlds.every(timed => worldState(timed) === worldState(worlds[0])),
        '60Hz, 120Hz, 250ms catch-up and irregular frames produce identical world/AI/cooldown/FX state');
    assert(approx(worlds[0].player.a, 8.1, 1e-12) &&
        worlds[0].simulationTickCount === 60 && worlds[0].pickups.length === 0,
        'One simulation second retains 3.6 raw movement and actual pickup collection');
    assert(worlds[0].enemies[0].a < 9 && worlds[0].enemies[1].attackCooldown > 0 &&
        worlds[0].player.hp < 100, 'Partition comparison exercises real enemy chase and melee damage');
    const automatic = partitions.map(partition => {
        const timed = gameplayKernel(map);
        timed.player.weaponIndex = 2;
        timed.player.ammo.cells = 50;
        timed.handlePrimaryFire(true, 0);
        let now = 0;
        for (const elapsedMs of partition) timed.settleTime(now += elapsedMs);
        timed.handlePrimaryFire(false, now);
        return [timed.player.ammo.cells, timed.player.cooldown];
    });
    assert(automatic.every(([ammo, cooldown]) => ammo === 37 && cooldown === 5),
        'A live press plus held automatic fire produces thirteen shots over one second under every partition');
    game = gameplayKernel(map);
    game.keys.KeyW = true;
    assert(game.advanceFrame(8) === 0 && game.advanceFrame(8) === 0 &&
        game.advanceFrame(1) === 1 && game.accumulatorSeconds > 0,
        'Sub-tick display frames retain their elapsed remainder');
    game = gameplayKernel(map);
    game.keys.KeyW = true;
    assert(game.advanceFrame(1000) === 15 && approx(game.player.a, 5.4, 1e-12),
        'A long display stall clamps elapsed time to 250ms, exactly fifteen ticks');
    game = gameplayKernel(map);
    game.player.cooldown = 12;
    game.advanceFrame(199);
    assert(game.player.cooldown === 1, 'Pistol cooldown remains active before 200 simulation ms');
    game.advanceFrame(1);
    assert(game.player.cooldown === 0, 'Pistol cooldown expires at exactly twelve 60Hz ticks');
    game.player.alive = false;
    const deadPosition = game.player.a;
    game.keys.KeyW = true;
    game.advanceFrame(250);
    game.shoot();
    assert(game.player.a === deadPosition && game.player.ammo.bullets === 50,
        'Dead-player simulation and shooting retain their existing no-op semantics');

    game = gameplayKernel(map);
    game.handlePrimaryFire(true, 240);
    assert(game.player.ammo.bullets === 49 && game.player.cooldown === 12 &&
        game.player.muzzleFlash === 4,
        'A late live press settles the previous 240ms before creating the shot');
    game.settleTime(250);
    game.handlePrimaryFire(false, 250);
    assert(game.player.ammo.bullets === 49 && game.player.cooldown === 11 &&
        game.player.muzzleFlash === 3 && game.simulationTickCount === 15,
        'The frame after a late shot ages it one tick, and release does not shoot again');

    game = gameplayKernel(map);
    game.handlePrimaryFire(true, 0);
    game.handlePrimaryFire(true, 250);
    assert(game.player.ammo.bullets === 49 && game.player.cooldown === 0,
        'A repeated down while already held cannot fire a second semiautomatic shot');
    game.handlePrimaryFire(false, 250);
    game.handlePrimaryFire(true, 250);
    assert(game.player.ammo.bullets === 48 && game.player.cooldown === 12,
        'A released and newly pressed pistol fires once after its cooldown');

    game = gameplayKernel(map);
    game.player.weaponIndex = 2;
    game.player.ammo.cells = 50;
    game.handlePrimaryFire(true, 240);
    game.settleTime(250);
    assert(game.player.ammo.cells === 49 && game.player.cooldown === 4,
        'A late automatic press does not manufacture pre-press catch-up shots');
    game.handlePrimaryFire(false, 340);
    assert(game.player.ammo.cells === 48 && !game.keys.MouseLeft,
        'Release settles the actual held interval, including its due automatic shot');
    game.settleTime(500);
    assert(game.player.ammo.cells === 48 && game.player.cooldown === 0,
        'Automatic fire stops after release through later cooldown boundaries');
    game.handlePrimaryFire(true, 500);
    game.handleKey('KeyW', true, 500);
    game.clearInput(590);
    const blurredPosition = game.player.a;
    const blurredAmmo = game.player.ammo.cells;
    game.settleTime(750);
    assert(blurredAmmo === 46 && game.player.ammo.cells === blurredAmmo &&
        approx(blurredPosition, 4.8, 1e-12) && game.player.a === blurredPosition,
        'The blur/capture-loss command settles held movement/fire and stops both afterward');

    game = gameplayKernel(map);
    game.handleKey('KeyW', true, 240);
    game.settleTime(250);
    assert(approx(game.player.a, 4.56, 1e-12),
        'A late movement press cannot move through the preceding inactive interval');
    game.handleKey('KeyW', false, 490);
    game.settleTime(500);
    assert(approx(game.player.a, 5.4, 1e-12),
        'A movement release preserves its held interval without moving afterward');

    // One explicit real room keeps replacement enemies/pickups absent; movement
    // still runs through DoomMap occupancy and Physics, not a timestamp copy.
    map.rooms = [{ a: 4, b: 4, c: 2, d: 2 }];
    game = gameplayKernel(map);
    game.advanceFrame(8);
    game.player.alive = false;
    game.keys.KeyW = true;
    const deadPlayer = game.player;
    game.handleKey('KeyR', true, 240);
    assert(game.player !== deadPlayer && game.player.alive &&
        game.simulationTickCount === 0 && game.accumulatorSeconds === 0,
        'Respawn replaces the dead player and discards the prior world tick remainder');
    game.settleTime(250);
    assert(game.simulationTickCount === 0 && game.player.a === 4.5,
        'A frame ten milliseconds after late respawn cannot advance the replacement world');
    game.settleTime(257);
    assert(game.simulationTickCount === 1 && approx(game.player.a, 4.56, 1e-12),
        'Only post-respawn lifetime drives the replacement player through actual map physics');
}

function renderResults() {
    if (typeof document === 'undefined') return; // Skip in Node.js

    const el = document.getElementById('results');
    const header = document.createElement('h2');
    header.style.color = failed === 0 ? '#0f0' : '#f80';
    header.textContent = `4D Doom Synergetics Tests: ${passed}/${total}`;
    el.appendChild(header);

    const status = document.createElement('p');
    status.style.color = failed === 0 ? '#0f0' : '#f00';
    status.style.fontWeight = 'bold';
    status.textContent = failed === 0 ? 'ALL TESTS PASSED ✓' : `${failed} TESTS FAILED ✗`;
    el.appendChild(status);

    // Standard output for test runner
    console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed === 0) console.log('✅ ALL TESTS PASSED');
    else console.error('❌ SOME TESTS FAILED');

    for (const r of results) {
        const line = document.createElement('div');
        line.style.color = r.pass ? '#0a0' : '#f44';
        line.textContent = (r.pass ? '✓ ' : '✗ ') + r.msg;
        el.appendChild(line);
    }
}

function runTests() {
    try {
        // ═════════════════════════════════════════════════════════════════
        // 1. CONFIGURATION
        // ═════════════════════════════════════════════════════════════════
        assert(CELL.WALL === 2, 'CELL.WALL is 2');
        assert(CELL.TETRA_WALL === 8, 'CELL.TETRA_WALL is 8');
        assert(CELL.OCTA_WALL === 9, 'CELL.OCTA_WALL is 9');
        assert(WEAPONS.length === 3, '3 weapons defined');
        assert(ENEMY_STATS.imp.hp === 60, 'Imp has 60 HP');
        assert(RENDER.FOV > 0, 'FOV is positive');
        assert(MAP.SIZE === 24, 'Map size is 24');
        assert(IVM.DIRECTIONS.length === 8, 'IVM has 8 directions');
        assert(approx(IVM.CELL_TETRAVOLUME, 0.375, 0.001), `Cell tetravolume ≈ 0.375 (got ${IVM.CELL_TETRAVOLUME.toFixed(4)})`);
        assert(approx(IVM.TETRAHEDRAL_ANGLE, 109.47, 0.1), 'Tetrahedral angle ≈ 109.47°');
        assert(COLORS.quadrayA !== undefined, 'Quadray axis A color defined');
        assert(COLORS.synergetics !== undefined, 'Synergetics HUD color defined');
        assert(COLORS.ivm !== undefined, 'IVM grid color defined');

        // ═════════════════════════════════════════════════════════════════
        // 2. QUADRAY
        // ═════════════════════════════════════════════════════════════════
        const q1 = new Quadray(1, 0, 0, 0);
        assert(q1.a === 1, 'Quadray constructor');
        const c1 = q1.toCartesian();
        assert(typeof c1.x === 'number', 'toCartesian returns x');
        const q2 = new Quadray(0, 1, 0, 0);
        const d12 = Quadray.distance(q1, q2);
        assert(approx(d12, 2, 1e-12), 'Basis vertices are two Cartesian units apart');
        const qn = q1.normalized();
        assert(approx(Math.min(qn.a, qn.b, qn.c, qn.d), 0, 0.01), 'normalized has min ~0');

        // IVM utilities
        const qSnap = Quadray.toIVM(new Quadray(1.3, 0.2, 0.8, 0.1));
        assert([qSnap.a, qSnap.b, qSnap.c, qSnap.d].every((v, i) => v === [1, 0, 1, 0][i]),
            'toIVM rounds canonical components');
        assert(approx(Quadray.cellVolume(), 0.375), 'cellVolume ≈ 0.375');
        assert(Quadray.cellType(0, 0, 0, 0) === 'tetra', 'Origin has tetra parity');
        assert(Quadray.cellType(1, 0, 0, 0) === 'octa', '(1,0,0,0) has octa parity');
        assert(Quadray.IVM_DIRECTIONS.length === 8, 'IVM_DIRECTIONS has 8 entries');

        // Round-trip conversion
        const qOrig = new Quadray(3, 1, 4, 2);
        const cart = qOrig.toCartesian();
        const qBack = Quadray.fromCartesian(cart.x, cart.y, cart.z);
        const roundDist = Quadray.distance(qOrig.normalized(), qBack.normalized());
        assert(roundDist < 0.01, `Round-trip conversion (dist=${roundDist.toFixed(4)})`);

        // ═════════════════════════════════════════════════════════════════
        // 3. MAP GENERATION
        // ═════════════════════════════════════════════════════════════════
        const map = new DoomMap();
        assert(map.rooms.length >= 10, `Generated ${map.rooms.length} rooms (>= 10)`);
        assert(map.cells instanceof Map, 'Map uses sparse Map storage');
        assert(map.cells.size > 100, `Has ${map.cells.size} non-default cells`);
        assert(!map.isSolid(map.rooms[0].a, map.rooms[0].b, map.rooms[0].c, map.rooms[0].d), 'Spawn room center is not solid');

        // 2D slice
        const slice = map.getSlice(map.rooms[0].c, map.rooms[0].d);
        assert(Array.isArray(slice) && Array.isArray(slice[0]), 'getSlice returns 2D array');
        assert(slice[map.rooms[0].a][map.rooms[0].b] === CELL.FLOOR, 'Room center in slice is FLOOR');

        // Cell parity
        assert(map.cellParity(0, 0, 0, 0) === 'tetra', 'Origin is tetra parity');
        assert(map.cellParity(1, 0, 0, 0) === 'octa', '(1,0,0,0) is octa parity');

        // Neighbors
        const neighbors = map.getNeighbors(5, 5, 5, 5);
        assert(neighbors.length === 8, 'getNeighbors returns 8 neighbors');

        // Room shapes (stats)
        assert(map.stats.tetraRooms >= 0, 'Stats tracks tetra rooms');
        assert(map.stats.octaRooms >= 0, 'Stats tracks octa rooms');
        assert(map.stats.rectRooms >= 0, 'Stats tracks rect rooms');
        assert(map.stats.tetraRooms + map.stats.octaRooms + map.stats.rectRooms === map.rooms.length,
            `Room shape sum matches total: ${map.stats.tetraRooms}T+${map.stats.octaRooms}O+${map.stats.rectRooms}R=${map.rooms.length}`);

        // Room shape attributes
        const hasShape = map.rooms.every(r => ['tetra', 'octa', 'rect'].includes(r.shape));
        assert(hasShape, 'All rooms have valid shape attribute');

        // Cell counts
        const counts = map.getCellCounts();
        assert(typeof counts === 'object', 'getCellCounts returns object');

        // ═════════════════════════════════════════════════════════════════
        // 4. ENTITIES
        // ═════════════════════════════════════════════════════════════════
        const player = new Player(5, 5, 5, 5);
        assert(player.alive, 'Player starts alive');
        assert(player.quadray instanceof Quadray, 'Player .quadray returns Quadray');
        assert(typeof player.cartesian.x === 'number', 'Player .cartesian returns {x,y,z}');
        assert(player.cellParity === 'tetra', 'Player at (5,5,5,5) has tetra parity');

        const enemy = new Enemy(7, 5, 5, 5, 'imp');
        assert(enemy.hp === 60, 'Enemy imp has 60 hp');
        assert(enemy.quadray instanceof Quadray, 'Enemy .quadray returns Quadray');
        const dist = player.distanceTo(enemy);
        assert(approx(dist, Math.sqrt(6), 1e-12), 'Two A steps have Cartesian length sqrt(6)');
        assert(approx(Quadray.distance(player, enemy), Math.sqrt(6), 1e-12),
            'Actual Player and Enemy records support geometric distance');
        assert(Quadray.distance(player, { a: 12, b: 12, c: 12, d: 12 }) === 0,
            'Entity record and shifted origin have zero physical separation');
        const enemy2 = new Enemy(5, 6, 5, 5, 'demon');
        assert(enemy2.cellParity === 'octa', 'Enemy at (5,6,5,5) has octa parity');

        // ═════════════════════════════════════════════════════════════════
        // 5. PHYSICS
        // ═════════════════════════════════════════════════════════════════
        const physics = new Physics(map);
        const solidCount = physics.countSolidNeighbors(map.rooms[0].a, map.rooms[0].b, map.rooms[0].c, map.rooms[0].d);
        assert(solidCount >= 0 && solidCount <= 8, `Solid neighbors in range 0-8 (got ${solidCount})`);

        const e1 = { a: 1, b: 2, c: 3, d: 4 };
        const e2 = { a: 4, b: 3, c: 2, d: 1 };
        const qd = physics.quadrayDistance(e1, e2);
        assert(qd > 0, `Quadray distance > 0 (got ${qd.toFixed(2)})`);

        // Exercise the live structural-record collision path at its geometric boundary.
        const spawn = map.rooms[0];
        map.setCell(Math.floor(spawn.a), Math.floor(spawn.b), Math.floor(spawn.c), Math.floor(spawn.d), CELL.FLOOR);
        const nearEnemy = new Enemy(spawn.a + 0.25, spawn.b, spawn.c, spawn.d, 'imp');
        const farEnemy = new Enemy(spawn.a + 0.75, spawn.b, spawn.c, spawn.d, 'imp');
        const shot = new Projectile(spawn.a, spawn.b, spawn.c, spawn.d, 0, 0, 10, 'player');
        const shots = [shot];
        const collisionParticles = [];
        physics.updateProjectiles(shots, [farEnemy, nearEnemy], player, collisionParticles);
        assert(farEnemy.hp === 60, 'Projectile does not hit outside its 0.8 Cartesian radius');
        assert(nearEnemy.hp === 50, 'Projectile hits nearby Enemy through structural distance');
        assert(shots.length === 0 && !shot.alive, 'Hit projectile is consumed by live physics');
        // LOS uses real raw-index occupancy, not physical distance or gauge keys.
        const losMap = new DoomMap(12);
        losMap.cells.clear();
        for (let a = 4; a <= 5; a++)
            for (let b = 4; b <= 5; b++)
                for (let c = 2; c <= 3; c++)
                    for (let d = 2; d <= 3; d++)
                        losMap.setCell(a, b, c, d, CELL.FLOOR);
        const losPhysics = new Physics(losMap);
        const aliasStart = new Quadray(4.5, 4.5, 2, 2);
        const aliasEnd = new Quadray(5.5, 5.5, 3, 3);
        assert(Quadray.distance(aliasStart, aliasEnd) === 0, 'LOS fixture endpoints are physical aliases');
        assert(losPhysics.hasLineOfSight(aliasStart, aliasEnd) &&
            losPhysics.hasLineOfSight(aliasEnd, aliasStart), 'Clear raw path between aliases works in both directions');
        losMap.setCell(5, 5, 2, 2, CELL.WALL);
        assert(!losPhysics.hasLineOfSight(aliasStart, aliasEnd) &&
            !losPhysics.hasLineOfSight(aliasEnd, aliasStart), 'Raw wall blocks gauge-equivalent endpoints in both directions');
        const aliasEnemy = new Enemy(aliasStart.a, aliasStart.b, aliasStart.c, aliasStart.d, 'imp');
        const aliasPlayer = new Player(aliasEnd.a, aliasEnd.b, aliasEnd.c, aliasEnd.d);
        aliasEnemy.speed = 0;
        assert(!losPhysics.hasLineOfSight(aliasEnemy, aliasPlayer), 'Actual entity records retain distinct raw cells');
        losPhysics.updateEnemies([aliasEnemy], aliasPlayer, [], []);
        assert(aliasPlayer.hp === 100 && aliasEnemy.state === 'wander' && !aliasEnemy.lastSeenPlayer,
            'Enemy cannot see or attack a physical alias through a raw wall');
        losMap.setCell(5, 5, 2, 2, CELL.FLOOR);
        losPhysics.updateEnemies([aliasEnemy], aliasPlayer, [], []);
        assert(aliasEnemy.state === 'attack' && aliasPlayer.hp === 100 - aliasEnemy.damage,
            'Removing raw wall restores enemy sight and shared-metric melee range');

        const thinStart = new Quadray(4.5, 4.4999, 2.5, 2.5);
        const thinEnd = new Quadray(5.5, 5.4999, 2.5, 2.5);
        assert(losPhysics.hasLineOfSight(thinStart, thinEnd), 'Ordinary clear raw segment has LOS');
        losMap.setCell(5, 4, 2, 2, CELL.WALL);
        assert(!losPhysics.hasLineOfSight(thinStart, thinEnd) &&
            !losPhysics.hasLineOfSight(thinEnd, thinStart), 'DDA detects even a briefly crossed wall cell');
        const boundaryStart = new Quadray(4.5, 4.5, 2.5, 2.5);
        const boundaryEnd = new Quadray(5, 4.5, 2.5, 2.5);
        assert(!losPhysics.hasLineOfSight(boundaryStart, boundaryEnd) &&
            !losPhysics.hasLineOfSight(boundaryEnd, boundaryStart), 'Wall exactly at either segment endpoint blocks LOS');
        assert(!losPhysics.hasLineOfSight(boundaryEnd, boundaryEnd), 'Coincident raw point inside a wall is blocked');
        assert(losPhysics.hasLineOfSight(boundaryStart, boundaryStart), 'Coincident raw point in floor is clear');
        losMap.setCell(5, 4, 2, 2, CELL.FLOOR);
        losMap.setCell(4, 5, 2, 2, CELL.WALL);
        assert(losPhysics.hasLineOfSight(new Quadray(4.5, 4.5, 2.5, 2.5), new Quadray(5.5, 5.5, 2.5, 2.5)) &&
            losPhysics.hasLineOfSight(new Quadray(5.5, 5.5, 2.5, 2.5), new Quadray(4.5, 4.5, 2.5, 2.5)),
            'Simultaneous positive crossings do not visit off-segment walls');
        losMap.setCell(4, 5, 2, 2, CELL.FLOOR);
        losMap.setCell(5, 5, 2, 2, CELL.WALL);
        assert(!losPhysics.hasLineOfSight(new Quadray(4.5, 5.5, 2.5, 2.5), new Quadray(5.5, 4.5, 2.5, 2.5)) &&
            !losPhysics.hasLineOfSight(new Quadray(5.5, 4.5, 2.5, 2.5), new Quadray(4.5, 5.5, 2.5, 2.5)),
            'Mixed-sign crossing checks the boundary floor cell in both directions');
        for (let a = 6; a < losMap.size; a++) losMap.setCell(a, 4, 2, 2, CELL.FLOOR);
        assert(losPhysics.hasLineOfSight(boundaryStart, new Quadray(11.5, 4.5, 2.5, 2.5)),
            'Carved corridor is clear up to the final in-bounds cell');
        assert(!losPhysics.hasLineOfSight(boundaryStart, new Quadray(12, 4.5, 2.5, 2.5)) &&
            !losPhysics.hasLineOfSight(new Quadray(12, 4.5, 2.5, 2.5), boundaryStart),
            'Exact outer map boundary is solid in both directions');

        gameplayRegressions();

        // ═════════════════════════════════════════════════════════════════
        // 6. SYNERGETICS ANALYSIS
        // ═════════════════════════════════════════════════════════════════
        const cells = extractCells(map);
        assert(cells.length > 0, `Extracted ${cells.length} cells from map`);

        const tv = calculateTetravolume(cells);
        assert(tv.totalTetravolumes > 0, `Tetravolumes > 0 (got ${tv.totalTetravolumes.toFixed(1)})`);
        assert(tv.cellCount === cells.length, 'TV cellCount matches extracted cells');

        const grid = analyzeIVMGrid(cells, map.size);
        assert(grid.occupiedVertices > 0, `IVM grid occupied > 0 (got ${grid.occupiedVertices})`);
        assert(grid.fillRatio >= 0 && grid.fillRatio <= 1, 'Fill ratio in [0,1]');

        const coord = calculateCoordinationNumbers(cells, map);
        assert(coord.average >= 0, `Average coordination >= 0 (got ${coord.average.toFixed(1)})`);

        const poly = detectSynergeticsPolyhedra(cells);
        assert(poly.tetrahedra >= 0, `Tetrahedra detected >= 0 (got ${poly.tetrahedra})`);
        assert(poly.octahedra >= 0, `Octahedra detected >= 0 (got ${poly.octahedra})`);
        assert(poly.cuboctahedra >= 0, `Cuboctahedra detected >= 0 (got ${poly.cuboctahedra})`);

        const com = calculateCenterOfMass(cells);
        assert(com !== null && typeof com.quadray.a === 'number', 'Center of mass has quadray.a');

        const angle = angleBetweenQuadrays(new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0));
        assert(angle > 0 && angle < 180, `Angle between basis vectors: ${angle.toFixed(1)}°`);

        const full = computeAllAnalysis(map);
        assert(full.tetravolume.totalTetravolumes > 0, 'Full analysis has tetravolumes');
        assert(full.ivmGrid.occupiedVertices > 0, 'Full analysis has grid data');
        assert(full.coordination.average >= 0, 'Full analysis has coordination');
        assert(full.polyhedra !== undefined, 'Full analysis has polyhedra');

        // ═════════════════════════════════════════════════════════════════
        // 7. GEOMETRIC IDENTITY VERIFICATION (8 checks)
        // ═════════════════════════════════════════════════════════════════
        // Quadray(1,0,0,0).toCartesian() = (1,1,1)/√2, so length = √(3/2) ≈ 1.2247
        const basisLen = new Quadray(1, 0, 0, 0).toCartesian();
        const bl = Math.sqrt(basisLen.x ** 2 + basisLen.y ** 2 + basisLen.z ** 2);
        const expectedBL = Math.sqrt(3 / 2); // √(3/2) ≈ 1.2247
        assert(approx(bl, expectedBL, 0.01), `Basis length = ${bl.toFixed(4)} ≈ √(3/2)`);

        const c2a = new Quadray(1, 0, 0, 0).toCartesian();
        const c2b = new Quadray(0, 1, 0, 0).toCartesian();
        const dot = c2a.x * c2b.x + c2a.y * c2b.y + c2a.z * c2b.z;
        const cosAngle = dot / (bl * bl);
        const tetAngle = Math.acos(cosAngle) * 180 / Math.PI;
        assert(approx(tetAngle, 109.47, 0.1), `Tetrahedral angle = ${tetAngle.toFixed(2)}° ≈ 109.47°`);

        assert(approx(S3, Math.sqrt(9 / 8), 0.001), `S3 = ${S3.toFixed(4)} ≈ √(9/8)`);

        const cVol = Quadray.cellVolume();
        assert(approx(cVol, 0.375, 0.01), `Cell volume = ${cVol.toFixed(4)} ≈ 0.375`);

        assert(IVM.DIRECTIONS.length === 8, 'Exactly 8 IVM directions');

        let parityOK = true;
        for (let i = 0; i <= 3; i++) {
            const p1 = (0 + i + 0 + 0) % 2;
            const p2 = (1 + i + 0 + 0) % 2;
            if (p1 === p2) parityOK = false;
        }
        assert(parityOK, 'Parity alternates along each axis');

        const qrt = new Quadray(2, 3, 1, 4);
        const crt = qrt.toCartesian();
        const qrtBack = Quadray.fromCartesian(crt.x, crt.y, crt.z);
        const rtDist = Quadray.distance(qrt.normalized(), qrtBack.normalized());
        assert(rtDist < 0.01, `Round-trip fidelity (dist=${rtDist.toFixed(6)})`);

        assert(approx(IVM.VOLUME_RATIOS.T, 1), 'Tetra volume ratio = 1');
        assert(approx(IVM.VOLUME_RATIOS.O, 4), 'Octa volume ratio = 4');
        assert(approx(IVM.VOLUME_RATIOS.C, 20), 'Cubo volume ratio = 20');

        // ═════════════════════════════════════════════════════════════════
        // 8. CONCENTRIC HIERARCHY
        // ═════════════════════════════════════════════════════════════════
        assert(CONCENTRIC_HIERARCHY.TETRAHEDRON === 1, 'CH: Tetra = 1 TV');
        assert(CONCENTRIC_HIERARCHY.CUBE === 3, 'CH: Cube = 3 TV');
        assert(CONCENTRIC_HIERARCHY.OCTAHEDRON === 4, 'CH: Octa = 4 TV');
        assert(CONCENTRIC_HIERARCHY.RHOMBIC_DODECA === 6, 'CH: Rhombic Dodeca = 6 TV');
        assert(CONCENTRIC_HIERARCHY.CUBOCTAHEDRON === 20, 'CH: VE = 20 TV');
        assert(approx(CONCENTRIC_HIERARCHY.ICOSAHEDRON, 18.51, 0.1), `CH: Icosa ≈ 18.51 TV (got ${CONCENTRIC_HIERARCHY.ICOSAHEDRON.toFixed(2)})`);
        assert(CONCENTRIC_HIERARCHY.A_MODULE === 1 / 24, 'CH: A-module = 1/24');
        assert(CONCENTRIC_HIERARCHY.RATIO_T_O === 0.25, 'CH: T/O ratio = 0.25');
        assert(CONCENTRIC_HIERARCHY.RATIO_O_C === 0.2, 'CH: O/C ratio = 0.2');
        assert(HIERARCHY_ORDER.length === 8, 'Hierarchy has 8 ordered entries');

        // ═════════════════════════════════════════════════════════════════
        // 9. JITTERBUG TRANSFORMATION
        // ═════════════════════════════════════════════════════════════════
        const jb0 = jitterbugTransform(0);
        assert(approx(jb0.volume, 20, 0.5), `Jitterbug t=0 ≈ VE (20 TV), got ${jb0.volume.toFixed(1)}`);
        assert(jb0.name.includes('Vector Equilibrium'), `Jitterbug t=0 name: ${jb0.name}`);

        const jb1 = jitterbugTransform(1);
        assert(approx(jb1.volume, 4, 0.5), `Jitterbug t=1 ≈ Octa (4 TV), got ${jb1.volume.toFixed(1)}`);
        assert(jb1.name.includes('Octahedron'), `Jitterbug t=1 name: ${jb1.name}`);

        const jb05 = jitterbugTransform(0.5);
        assert(approx(jb05.volume, 18.51, 0.5), `Jitterbug t=0.5 ≈ Icosa (18.51 TV), got ${jb05.volume.toFixed(1)}`);

        assert(jb0.vertices.length === 12, 'VE has 12 vertices');
        assert(jitterbugAngle(1) === 60, 'Jitterbug angle at t=1 is 60°');

        // ═════════════════════════════════════════════════════════════════
        // 10. FREQUENCY ANALYSIS
        // ═════════════════════════════════════════════════════════════════
        const f1 = analyzeFrequency(1);
        assert(f1.frequency === 1, 'Freq-1 frequency = 1');
        assert(f1.shellVertices === 12, 'Freq-1 shell = 12 vertices (10·1²+2)');
        assert(f1.tetrahedra === 2, 'Freq-1: 2 tetrahedra');
        assert(f1.octahedra === 1, 'Freq-1: 1 octahedron');

        const f2 = analyzeFrequency(2);
        assert(f2.frequency === 2, 'Freq-2 frequency = 2');
        assert(f2.shellVertices === 42, 'Freq-2 shell = 42 vertices (10·4+2)');
        assert(f2.tetrahedra / f2.octahedra === 2, 'Freq-2: T:O = 2:1');

        // ═════════════════════════════════════════════════════════════════
        // 11. EULER VERIFICATION
        // ═════════════════════════════════════════════════════════════════
        const euler = verifyAllEuler();
        assert(euler.length === 7, `7 polyhedra in census (got ${euler.length})`);
        assert(euler.every(e => e.valid), 'All polyhedra satisfy Euler V-E+F=2');

        assert(POLYHEDRA_CENSUS.tetrahedron.V === 4, 'Tetra: 4 vertices');
        assert(POLYHEDRA_CENSUS.tetrahedron.E === 6, 'Tetra: 6 edges');
        assert(POLYHEDRA_CENSUS.tetrahedron.F === 4, 'Tetra: 4 faces');
        assert(POLYHEDRA_CENSUS.cuboctahedron.V === 12, 'VE: 12 vertices');
        assert(POLYHEDRA_CENSUS.cuboctahedron.E === 24, 'VE: 24 edges');
        assert(POLYHEDRA_CENSUS.cuboctahedron.F === 14, 'VE: 14 faces');
        assert(verifyEuler(4, 6, 4).valid, 'Euler: tetrahedron passes');
        assert(verifyEuler(12, 24, 14).valid, 'Euler: cuboctahedron passes');

        // ═════════════════════════════════════════════════════════════════
        // 12. VOLUME CONVERSIONS
        // ═════════════════════════════════════════════════════════════════
        const tvFromXYZ = xyzToTetravolumes(1);
        assert(tvFromXYZ > 1, `1 unit³ = ${tvFromXYZ.toFixed(4)} tetravolumes`);
        const roundTrip = tetravolumesToXYZ(tvFromXYZ);
        assert(approx(roundTrip, 1, 0.001), `XYZ→TV→XYZ round-trip = ${roundTrip.toFixed(4)}`);

        // Closest packing
        const packing = analyzeClosestPacking(13);
        assert(packing.coordination === 12, 'FCC coordination = 12');
        assert(approx(packing.packingEfficiency, 0.7405, 0.01), `Packing eff ≈ 74.05% (got ${(packing.packingEfficiency * 100).toFixed(1)}%)`);

        // Great circle
        const gc = greatCircle(12);
        assert(gc.length === 13, 'Great circle with 12 subdivisions has 13 points');

        // Tetrahedron volume computation
        const tv4 = tetrahedronVolume(
            new Quadray(1, 0, 0, 0), new Quadray(0, 1, 0, 0),
            new Quadray(0, 0, 1, 0), new Quadray(0, 0, 0, 1)
        );
        assert(tv4 > 0, `Tetrahedron from 4 basis vectors has volume ${tv4.toFixed(4)} TV`);

        // ═════════════════════════════════════════════════════════════════
        // 13. CONSTANTS VERIFICATION SUITE
        // ═════════════════════════════════════════════════════════════════
        const constVerify = verifySynergeticsConstants();
        assert(constVerify.passed > 0, `Synergetics constants: ${constVerify.passed}/${constVerify.total} passed`);
        assert(constVerify.failed === 0, `No constant verification failures (${constVerify.failed} failed)`);

        // ── Render results ──
        renderResults();
        console.log(`=== Results: ${passed} passed, ${failed} failed ===`);

    } catch (err) {
        console.error('Test suite crashed:', err);
        results.push({ pass: false, msg: `CRASH: ${err.message}` });
        failed++; total++;
        renderResults();
        console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
    }
}

// Run on DOM ready if in browser
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { try { runTests(); } catch (e) { console.error('Test init failed:', e); } });
    } else {
        try { runTests(); } catch (e) { console.error('Test init failed:', e); }
    }
} else {
    // Node.js environment - run immediately
    runTests();
}
