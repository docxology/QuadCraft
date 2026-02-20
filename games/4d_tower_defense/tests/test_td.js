/**
 * test_td.js -- 4D Tower Defense Unit Tests
 * Tests board logic, creep types, tower upgrades, sell, abilities, wave mechanics,
 * procedural paths, swarm splitting, regen healing, and rhombic sniper tower.
 */
const assert = (c, m) => {
    if (!c) { console.error(`❌ FAILED: ${m}`); throw new Error(m); }
    console.log(`✅ PASSED: ${m}`);
};

if (typeof require !== 'undefined') {
    const { Quadray } = require('../../4d_generic/quadray.js');
    const { TowerDefenseBoard, TDTower, TDCreep, TOWER_TYPES, CREEP_TYPES } = require('../js/td_board.js');
    global.Quadray = Quadray;
    global.TowerDefenseBoard = TowerDefenseBoard;
    global.TDTower = TDTower;
    global.TDCreep = TDCreep;
    global.TOWER_TYPES = TOWER_TYPES;
    global.CREEP_TYPES = CREEP_TYPES;
    // Polyfill performance.now for Node.js
    if (typeof performance === 'undefined') { global.performance = { now: () => Date.now() }; }
}

function runTests() {
    console.log("Running 4D Tower Defense Tests...\n");

    // ─── Board Initialization ───
    const b = new TowerDefenseBoard(6);
    assert(b.path.length >= 10, `Path has >= 10 waypoints (got ${b.path.length})`);
    assert(b.lives === 20, "Starts with 20 lives");
    assert(b.gold === 100, "Starts with 100 gold");
    assert(b.wave === 0, "Starts at wave 0");
    assert(b.gameOver === false, "Not game over at start");
    assert(b.speed === 1, "Default speed is 1x");

    // ─── Path Integrity (Procedural) ───
    for (let i = 0; i < b.path.length; i++) {
        const wp = b.path[i];
        assert(wp instanceof Quadray, `Waypoint ${i} is a Quadray`);
        assert(wp.a >= 0 && wp.b >= 0 && wp.c >= 0 && wp.d >= 0, `Waypoint ${i} has non-negative coords`);
    }

    // Verify each segment is a connected IVM neighbor (distance ~0.707 in IVM space)
    for (let i = 1; i < b.path.length; i++) {
        const dist = Quadray.distance(b.path[i - 1], b.path[i]);
        assert(dist > 0.3 && dist < 1.5, `Segment ${i - 1}->${i} is connected (dist=${dist.toFixed(3)})`);
    }

    // Verify no duplicate waypoints
    const pathKeys = new Set();
    for (const wp of b.path) {
        const k = `${wp.a},${wp.b},${wp.c},${wp.d}`;
        assert(!pathKeys.has(k), `No duplicate waypoint at ${k}`);
        pathKeys.add(k);
    }

    // ─── Tower Placement ───
    // Helper: find a valid off-path position (far from all waypoints)
    function findSafePos(board, offsetA, offsetB) {
        const q = new Quadray(100 + offsetA, 100 + offsetB, 0, 0);
        // Verify it's not on path
        for (const wp of board.path) {
            if (Quadray.distance(q, wp) < 0.1) {
                // Extremely unlikely with coords 100+, but just shift more
                return new Quadray(200 + offsetA, 200 + offsetB, 0, 0);
            }
        }
        return q;
    }

    const validPos = findSafePos(b, 0, 0);
    assert(b.placeTower(validPos), "Can place tetra tower");
    assert(b.gold === 85, "Tetra costs 15 gold");
    assert(b.towers.length === 1, "1 tower placed");
    assert(!b.placeTower(validPos), "Cannot stack towers");
    assert(!b.placeTower(b.path[0]), "Cannot place on path start");

    // Place octa tower at a different safe position
    const validPos2 = findSafePos(b, 1, 0);
    assert(b.placeTower(validPos2, 'octa'), "Can place octa tower");
    assert(b.gold === 45, "Octa costs 40 gold");

    // Insufficient gold for Rhombic
    const validPos3 = findSafePos(b, 2, 0);
    assert(!b.placeTower(validPos3, 'rhombic'), "Cannot afford rhombic (250g)");

    // ─── Tower Upgrade ───
    const tower = b.towers[0];
    assert(tower.level === 0, "Tower starts at level 0");
    const upCost = tower.getUpgradeCost();
    assert(upCost === 15, `Tetra upgrade 1 costs 15 (got ${upCost})`);
    assert(b.upgradeTower(tower), "Can upgrade tower");
    assert(tower.level === 1, "Tower is now level 1");
    assert(tower.damage === 12, `Lv1 damage is 12 (got ${tower.damage})`);
    assert(tower.totalInvested === 30, `Total invested is 30 (got ${tower.totalInvested})`);

    // Upgrade again
    b.gold += 100; // Add gold for testing
    assert(b.upgradeTower(tower), "Can upgrade to level 2");
    assert(tower.level === 2, "Tower is now level 2");
    assert(b.upgradeTower(tower), "Can upgrade to level 3");
    assert(tower.level === 3, "Tower is now level 3 (max)");
    assert(tower.getUpgradeCost() === -1, "Max level returns -1 for upgrade cost");
    assert(!b.upgradeTower(tower), "Cannot upgrade past max");

    // ─── Tower Sell ───
    const sellVal = tower.getSellValue();
    assert(sellVal > 0, `Sell value is positive (${sellVal})`);
    assert(sellVal === Math.floor(tower.totalInvested * 0.6), "Sell refunds 60%");
    const goldBefore = b.gold;
    b.sellTower(tower);
    assert(b.gold === goldBefore + sellVal, "Gold increased by sell value");
    assert(b.towers.length === 1, "Tower removed (1 remaining)");

    // ─── Creep Types ───
    const normalCreep = new TDCreep('normal', 1);
    const fastCreep = new TDCreep('fast', 1);
    const armoredCreep = new TDCreep('armored', 1);
    const bossCreep = new TDCreep('boss', 1);
    const regenCreep = new TDCreep('regen', 1);
    const swarmCreep = new TDCreep('swarm', 1);
    const swarmletCreep = new TDCreep('swarmlet', 1);

    assert(fastCreep.baseSpeed > normalCreep.baseSpeed, "Fast creep is faster");
    assert(armoredCreep.hp > normalCreep.hp, "Armored creep has more HP");
    assert(bossCreep.hp > armoredCreep.hp, "Boss has most HP");
    assert(bossCreep.goldValue > normalCreep.goldValue, "Boss gives more gold");
    assert(fastCreep.baseSpeed === normalCreep.baseSpeed * 2, "Fast is 2x speed");

    // ─── New creep type assertions ───
    assert(regenCreep.hp > normalCreep.hp, "Regen creep has more HP than normal");
    assert(regenCreep.baseSpeed < normalCreep.baseSpeed, "Regen creep is slower than normal");
    assert(swarmCreep.baseSpeed > normalCreep.baseSpeed, "Swarm creep is faster than normal");
    assert(swarmletCreep.hp < normalCreep.hp, "Swarmlet has less HP than normal");
    assert(swarmletCreep.goldValue < normalCreep.goldValue, "Swarmlet gives less gold");

    // ─── Regen Healing ───
    const bRegen = new TowerDefenseBoard(6);
    bRegen.spawnWave();
    // Manually inject a regen creep and damage it
    const rc = new TDCreep('regen', 1);
    rc.delay = 0;
    rc.segmentIndex = 1;
    rc.segmentT = 0;
    const rcMaxHp = rc.maxHp;
    rc.hp = Math.round(rcMaxHp * 0.5); // Damage to 50%
    const rcHpBefore = rc.hp;
    bRegen.creeps = [rc];
    // Tick 30 times to trigger regen (fires every 30 ticks)
    for (let i = 0; i < 30; i++) bRegen._step();
    assert(rc.hp > rcHpBefore, `Regen creep healed: ${rcHpBefore} -> ${rc.hp}`);
    assert(rc.hp <= rcMaxHp, "Regen does not exceed maxHp");

    // ─── Swarm Split ───
    const bSwarm = new TowerDefenseBoard(6);
    const sc = new TDCreep('swarm', 1);
    sc.delay = 0;
    sc.segmentIndex = 2;
    sc.segmentT = 0.5;
    sc.hp = 1; // Almost dead
    bSwarm.creeps = [sc];
    bSwarm._killCreep(sc, null);
    const swarmlets = bSwarm.creeps.filter(c => c.type === 'swarmlet');
    assert(swarmlets.length === 2, `Swarm death spawns 2 swarmlets (got ${swarmlets.length})`);
    assert(swarmlets[0].segmentIndex === 2, "Swarmlets inherit segment index");

    // ─── Wave Spawning ───
    const b2 = new TowerDefenseBoard(6);
    b2.spawnWave();
    assert(b2.wave === 1, "Wave 1 spawned");
    assert(b2.creeps.length > 0, "Creeps spawned");
    const wave1Count = b2.creeps.length;
    assert(wave1Count === 6, `Wave 1 has 6 creeps (got ${wave1Count})`);

    // Boss wave (wave 5)
    for (let w = 2; w <= 5; w++) {
        b2.creeps = [];
        b2.waveActive = false;
        b2.spawnWave();
    }
    assert(b2.wave === 5, "Advanced to wave 5");
    const hasBoss = b2.creeps.some(c => c.type === 'boss');
    assert(hasBoss, "Wave 5 has a boss creep");

    // ─── Tick Updates ───
    const b3 = new TowerDefenseBoard(6);
    b3.spawnWave();
    for (let i = 0; i < 10; i++) b3.update();
    assert(b3.tick === 10, "Tick increments correctly");

    // Speed multiplier
    b3.speed = 3;
    const tickBefore = b3.tick;
    b3.update();
    assert(b3.tick === tickBefore + 3, "3x speed does 3 ticks per update");

    // ─── Creep Position ───
    const b4 = new TowerDefenseBoard(6);
    b4.spawnWave();
    const creep = b4.creeps[0];
    creep.delay = 0;
    const startPos = b4.getCreepPosition(creep);
    assert(startPos instanceof Quadray, "Creep position is a Quadray");

    // ─── Tower Type Definitions ───
    assert(TOWER_TYPES.tetra.tv === 1, "Tetra TV = 1");
    assert(TOWER_TYPES.octa.tv === 4, "Octa TV = 4");
    assert(TOWER_TYPES.cubo.tv === 20, "Cubo TV = 20");
    assert(TOWER_TYPES.rhombic.tv === 6, "Rhombic TV = 6");
    assert(TOWER_TYPES.tetra.ability === 'rapid', "Tetra ability is rapid");
    assert(TOWER_TYPES.octa.ability === 'splash', "Octa ability is splash");
    assert(TOWER_TYPES.cubo.ability === 'slow', "Cubo ability is slow");
    assert(TOWER_TYPES.rhombic.ability === 'sniper', "Rhombic ability is sniper");

    // ─── Rhombic Stats ───
    assert(TOWER_TYPES.rhombic.cost === 250, "Rhombic costs 250g");
    assert(TOWER_TYPES.rhombic.range === 12.0, "Rhombic has 12.0 range");
    assert(TOWER_TYPES.rhombic.damage === 150, "Rhombic does 150 damage");
    assert(TOWER_TYPES.rhombic.fireRate === 3000, "Rhombic fire rate is 3000ms");
    assert(TOWER_TYPES.rhombic.upgrades.length === 3, "Rhombic has 3 upgrade levels");

    // ─── Creep Type Definitions ───
    assert(CREEP_TYPES.normal !== undefined, "Normal creep type exists");
    assert(CREEP_TYPES.fast !== undefined, "Fast creep type exists");
    assert(CREEP_TYPES.armored !== undefined, "Armored creep type exists");
    assert(CREEP_TYPES.boss !== undefined, "Boss creep type exists");
    assert(CREEP_TYPES.regen !== undefined, "Regen creep type exists");
    assert(CREEP_TYPES.swarm !== undefined, "Swarm creep type exists");
    assert(CREEP_TYPES.swarmlet !== undefined, "Swarmlet creep type exists");

    // ─── Gold Math ───
    const b5 = new TowerDefenseBoard(6);
    b5.gold = 500;
    b5.placeTower(new Quadray(50, 50, 0, 0), 'tetra');
    b5.placeTower(new Quadray(51, 51, 0, 0), 'octa');
    b5.placeTower(new Quadray(52, 52, 0, 0), 'cubo');
    assert(b5.gold === 345, `Gold after 3 towers: 500-15-40-100 = 345 (got ${b5.gold})`);
    const totalTV = b5.getTotalTV();
    assert(totalTV === 25, `Total TV = 1+4+20 = 25 (got ${totalTV})`);

    // ─── Rhombic Gold Math ───
    b5.gold = 300;
    b5.placeTower(new Quadray(53, 53, 0, 0), 'rhombic');
    assert(b5.gold === 50, `Gold after rhombic: 300-250 = 50 (got ${b5.gold})`);
    const totalTV2 = b5.getTotalTV();
    assert(totalTV2 === 31, `Total TV = 1+4+20+6 = 31 (got ${totalTV2})`);

    // ─── Event Log ───
    assert(b5.log.length > 0, "Event log has entries");
    assert(b5.log[b5.log.length - 1].msg.includes('Rhombic'), "Last log entry mentions Rhombic");

    // ─── Metadata ───
    const meta = b5.getMetadata();
    assert(meta.rhombicCount === 1, `Metadata tracks rhombic count (got ${meta.rhombicCount})`);
    assert(meta.tetraCount === 1, "Metadata tracks tetra count");
    assert(meta.octaCount === 1, "Metadata tracks octa count");
    assert(meta.cuboCount === 1, "Metadata tracks cubo count");

    // ─── Procedural Path Regeneration ───
    const b6 = new TowerDefenseBoard(6);
    const b7 = new TowerDefenseBoard(6);
    // Paths should be different (randomized) -- check origin is same
    assert(b6.path[0].a === 0 && b6.path[0].b === 0, "Path always starts at origin");
    assert(b7.path[0].a === 0 && b7.path[0].b === 0, "Path always starts at origin");
    // Note: in rare cases paths could match; we just verify structure
    assert(b6.path.length >= 10, `Re-generated path 1 has >= 10 waypoints (${b6.path.length})`);
    assert(b7.path.length >= 10, `Re-generated path 2 has >= 10 waypoints (${b7.path.length})`);

    console.log("\nAll 4D Tower Defense tests completed!");
    if (typeof window !== 'undefined' && window.updateSummary) window.updateSummary();
}

function runExtendedTests() {
    console.log("\nRunning Extended Tests...\n");

    // ─── Board Reset ───
    const b = new TowerDefenseBoard(6);
    const originalPathLen = b.path.length;
    b.gold = 500;
    b.placeTower(new Quadray(10, 10, 0, 0), 'tetra');
    b.spawnWave();
    b.reset();
    assert(b.towers.length === 0, "Reset clears towers");
    assert(b.creeps.length === 0, "Reset clears creeps");
    assert(b.wave === 0, "Reset resets wave to 0");
    assert(b.gold === 100, "Reset restores gold to 100");
    assert(b.lives === 20, "Reset restores lives to 20");
    assert(b.gameOver === false, "Reset clears game over");
    assert(b.path.length >= 10, `Reset generates new path (${b.path.length} waypoints)`);
    assert(b.path[0].a === 0 && b.path[0].b === 0, "Reset path starts at origin");

    // ─── Sniper Targeting (Highest HP) ───
    const bSniper = new TowerDefenseBoard(6);
    // Directly inject a rhombic tower near the path (bypass placeTower validation)
    const sniperPos = new Quadray(
        bSniper.path[2].a + 3, bSniper.path[2].b + 3,
        bSniper.path[2].c, bSniper.path[2].d
    );
    const sniperTower = new TDTower(sniperPos, 'rhombic');
    sniperTower.range = 50; // Ensure creeps are within range
    bSniper.towers.push(sniperTower);
    // Manually add two creeps: low HP and high HP
    const lowHp = new TDCreep('normal', 1);
    lowHp.delay = 0; lowHp.segmentIndex = 2; lowHp.segmentT = 0;
    lowHp.hp = 10; lowHp.maxHp = 10;
    const highHp = new TDCreep('normal', 1);
    highHp.delay = 0; highHp.segmentIndex = 2; highHp.segmentT = 0.2;
    highHp.hp = 500; highHp.maxHp = 500;
    bSniper.creeps = [lowHp, highHp];
    // Force fire by setting lastFire far in the past
    sniperTower.lastFire = -10000;
    bSniper.tick = 10000 / 16; // align simulated time
    bSniper._step();
    // The sniper should target the highest-HP creep
    assert(highHp.hp < 500, `Sniper targeted highest HP creep (500 -> ${highHp.hp})`);

    // ─── Tower Range Definitions ───
    assert(TOWER_TYPES.tetra.range === 2.0, "Tetra base range is 2.0");
    assert(TOWER_TYPES.octa.range === 3.5, "Octa base range is 3.5");
    assert(TOWER_TYPES.cubo.range === 5.5, "Cubo base range is 5.5");
    assert(TOWER_TYPES.rhombic.range === 12.0, "Rhombic base range is 12.0");

    // ─── Creep Trail ───
    const bTrail = new TowerDefenseBoard(6);
    const trailCreep = new TDCreep('normal', 1);
    trailCreep.delay = 0;
    trailCreep.segmentIndex = 0;
    trailCreep.segmentT = 0;
    bTrail.creeps = [trailCreep];
    assert(trailCreep.trail.length === 0, "Creep trail starts empty");
    for (let i = 0; i < 10; i++) bTrail._step();
    assert(trailCreep.trail.length > 0, `Creep trail populated (${trailCreep.trail.length} entries)`);
    assert(trailCreep.trail.length <= 6, "Creep trail capped at 6");

    // ─── Game Over Trigger ───
    const bGO = new TowerDefenseBoard(6);
    bGO.lives = 1;
    const leaker = new TDCreep('normal', 1);
    leaker.delay = 0;
    leaker.segmentIndex = bGO.path.length - 1;
    leaker.segmentT = 1.0;
    bGO.creeps = [leaker];
    bGO._step();
    assert(bGO.gameOver === true, "Game over when lives hit 0");
    assert(bGO.lives <= 0, "Lives is 0 or below");

    // ─── Wave Countdown ───
    const bWC = new TowerDefenseBoard(6);
    bWC.spawnWave();
    bWC.creeps = [];
    bWC.waveActive = true;
    bWC._step(); // triggers wave cleared
    assert(bWC.waveActive === false, "Wave clears when no creeps left");
    assert(bWC.waveCountdown > 0, "Wave countdown set after clearing");

    // ─── Creep Speed Consistency ───
    const speeds = {};
    for (const [key, def] of Object.entries(CREEP_TYPES)) {
        const c = new TDCreep(key, 1);
        speeds[key] = c.baseSpeed;
    }
    assert(speeds.fast > speeds.normal, "Fast > Normal speed");
    assert(speeds.swarm > speeds.normal, "Swarm > Normal speed");
    assert(speeds.swarmlet > speeds.normal, "Swarmlet > Normal speed");
    assert(speeds.armored < speeds.normal, "Armored < Normal speed");
    assert(speeds.regen < speeds.normal, "Regen < Normal speed");
    assert(speeds.boss < speeds.normal, "Boss < Normal speed");

    // ─── Volume Ratios ───
    const bVR = new TowerDefenseBoard(6);
    assert(bVR.volumeRatios.tetra === 1, "Volume ratio tetra = 1");
    assert(bVR.volumeRatios.octa === 4, "Volume ratio octa = 4");
    assert(bVR.volumeRatios.cubo === 20, "Volume ratio cubo = 20");
    assert(bVR.volumeRatios.rhombic === 6, "Volume ratio rhombic = 6");

    // ─── Log Management ───
    const bLog = new TowerDefenseBoard(6);
    for (let i = 0; i < 15; i++) bLog.addLog(`Test ${i}`);
    assert(bLog.log.length === 8, "Log capped at 8 entries");
    assert(bLog.log[bLog.log.length - 1].msg === "Test 14", "Most recent log entry is last");

    console.log("\nAll Extended Tests completed!");
}

if (typeof require !== 'undefined' && require.main === module) {
    runTests();
    runExtendedTests();
} else if (typeof window !== 'undefined') {
    // Run in browser
    runTests();
    runExtendedTests();
}
