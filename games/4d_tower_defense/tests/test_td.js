/**
 * test_td.js -- 4D Tower Defense Unit Tests
 * Tests board logic, creep types, tower upgrades, sell, abilities, wave mechanics.
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
    assert(b.path.length === 20, `Path has 20 waypoints (got ${b.path.length})`);
    assert(b.lives === 20, "Starts with 20 lives");
    assert(b.gold === 100, "Starts with 100 gold");
    assert(b.wave === 0, "Starts at wave 0");
    assert(b.gameOver === false, "Not game over at start");
    assert(b.speed === 1, "Default speed is 1x");

    // ─── Path Integrity ───
    for (let i = 0; i < b.path.length; i++) {
        const wp = b.path[i];
        assert(wp instanceof Quadray, `Waypoint ${i} is a Quadray`);
        assert(wp.a >= 0 && wp.b >= 0 && wp.c >= 0 && wp.d >= 0, `Waypoint ${i} has non-negative coords`);
    }

    // ─── Tower Placement ───
    assert(b.placeTower(new Quadray(1, 1, 0, 0)), "Can place tetra tower");
    assert(b.gold === 85, "Tetra costs 15 gold");
    assert(b.towers.length === 1, "1 tower placed");
    assert(!b.placeTower(new Quadray(1, 1, 0, 0)), "Cannot stack towers");
    assert(!b.placeTower(new Quadray(0, 0, 0, 0)), "Cannot place on path start");
    assert(!b.placeTower(new Quadray(2, 4, 4, 3)), "Cannot place on path end");

    // Place octa tower
    assert(b.placeTower(new Quadray(4, 1, 0, 0), 'octa'), "Can place octa tower");
    assert(b.gold === 45, "Octa costs 40 gold");

    // Insufficient gold
    assert(!b.placeTower(new Quadray(5, 1, 0, 0), 'cubo'), "Cannot afford cubo (100g)");

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

    assert(fastCreep.baseSpeed > normalCreep.baseSpeed, "Fast creep is faster");
    assert(armoredCreep.hp > normalCreep.hp, "Armored creep has more HP");
    assert(bossCreep.hp > armoredCreep.hp, "Boss has most HP");
    assert(bossCreep.goldValue > normalCreep.goldValue, "Boss gives more gold");
    assert(fastCreep.baseSpeed === normalCreep.baseSpeed * 2, "Fast is 2x speed");

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
    assert(TOWER_TYPES.tetra.ability === 'rapid', "Tetra ability is rapid");
    assert(TOWER_TYPES.octa.ability === 'splash', "Octa ability is splash");
    assert(TOWER_TYPES.cubo.ability === 'slow', "Cubo ability is slow");

    // ─── Creep Type Definitions ───
    assert(CREEP_TYPES.normal !== undefined, "Normal creep type exists");
    assert(CREEP_TYPES.fast !== undefined, "Fast creep type exists");
    assert(CREEP_TYPES.armored !== undefined, "Armored creep type exists");
    assert(CREEP_TYPES.boss !== undefined, "Boss creep type exists");

    // ─── Gold Math ───
    const b5 = new TowerDefenseBoard(6);
    b5.gold = 500;
    b5.placeTower(new Quadray(1, 1, 0, 0), 'tetra');
    b5.placeTower(new Quadray(4, 1, 0, 0), 'octa');
    b5.placeTower(new Quadray(5, 5, 0, 0), 'cubo');
    assert(b5.gold === 345, `Gold after 3 towers: 500-15-40-100 = 345 (got ${b5.gold})`);
    const totalTV = b5.getTotalTV();
    assert(totalTV === 25, `Total TV = 1+4+20 = 25 (got ${totalTV})`);

    // ─── Event Log ───
    assert(b5.log.length > 0, "Event log has entries");
    assert(b5.log[b5.log.length - 1].msg.includes('Cubo'), "Last log entry mentions Cubo");

    console.log("\nAll 4D Tower Defense tests completed!");
    if (typeof window !== 'undefined' && window.updateSummary) window.updateSummary();
}

if (typeof require !== 'undefined' && require.main === module) {
    runTests();
} else if (typeof window !== 'undefined') {
    // Run in browser
    runTests();
}
