/**
 * test_rogue.js — Comprehensive Tests for 4D Rogue
 *
 * 30+ test groups covering:
 *   - Board creation and dungeon generation
 *   - Movement and blocking
 *   - FOV (field of view) computation
 *   - Combat system (attack, defense, damage)
 *   - Experience and leveling
 *   - Inventory (weapons, armor, potions, gold)
 *   - Enemy types and AI behavior
 *   - Dungeon connectivity (stairs reachable via BFS)
 *   - Death and game-over
 *   - Reset and persistence
 *   - Metadata and HUD state
 *   - Synergetics constants verification
 *   - Round-trip conversion integrity
 *
 * Run: node tests/test_rogue.js
 */

if (typeof Quadray === 'undefined') {
    const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}
if (typeof BaseBoard === 'undefined') {
    const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard;
}
if (typeof TurnManager === 'undefined') {
    const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager;
}
if (typeof QuadrayPathfinder === 'undefined') {
    const _pf = require('../../4d_generic/pathfinding.js'); globalThis.QuadrayPathfinder = _pf.QuadrayPathfinder;
}

const { RogueBoard, TILE, ENEMY_TYPES } = require('../js/rogue_board.js');

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Rogue — Comprehensive Tests ===\n');

// ─── 1. Board Creation ──────────────────────────────────────────────
console.log('— Board Creation —');
const b = new RogueBoard(6);
assert('Player placed', b.player !== null);
assert('Player has coords', typeof b.player.a === 'number');
assert('Enemies exist', b.enemies.length > 0);
assert('HP starts at 20', b.hp === 20);
assert('MaxHP starts at 20', b.maxHp === 20);
assert('Base attack is 3', b.baseAtk === 3);
assert('Depth starts at 1', b.depth === 1);
assert('Level starts at 1', b.level === 1);
assert('XP starts at 0', b.xp === 0);
assert('Potions start at 3', b.potions === 3);
assert('Gold starts at 0', b.gold === 0);
assert('No weapon initially', b.weapon === null);
assert('No armor initially', b.armor === null);
assert('Player tile is PLAYER', b.getCell(b.player) === TILE.PLAYER);

// ─── 2. Tile Constants ──────────────────────────────────────────────
console.log('\n— Tile Constants —');
assert('FLOOR = 0', TILE.FLOOR === 0);
assert('WALL = 1', TILE.WALL === 1);
assert('PLAYER = 2', TILE.PLAYER === 2);
assert('ENEMY = 3', TILE.ENEMY === 3);
assert('STAIRS = 4', TILE.STAIRS === 4);
assert('POTION = 5', TILE.POTION === 5);
assert('GOLD = 6', TILE.GOLD === 6);
assert('WEAPON = 7', TILE.WEAPON === 7);
assert('ARMOR = 8', TILE.ARMOR === 8);

// ─── 3. Enemy Types ─────────────────────────────────────────────────
console.log('\n— Enemy Types —');
assert('Goblin defined', ENEMY_TYPES.goblin !== undefined);
assert('Skeleton defined', ENEMY_TYPES.skeleton !== undefined);
assert('Ogre defined', ENEMY_TYPES.ogre !== undefined);
assert('Wraith defined', ENEMY_TYPES.wraith !== undefined);
assert('Wraith has phasing', ENEMY_TYPES.wraith.phasing === true);
assert('Goblin has chaseRange', ENEMY_TYPES.goblin.chaseRange === 5);
assert('Enemies have combat stats', b.enemies.every(e =>
    typeof e.hp === 'number' && typeof e.atk === 'number' && typeof e.def === 'number'
));
assert('Enemies have type names', b.enemies.every(e => typeof e.type === 'string'));

// ─── 4. Movement ─────────────────────────────────────────────────────
console.log('\n— Movement —');
const b2 = new RogueBoard(6);
let moved = false;
for (let d = 0; d < 12; d++) {
    const result = b2.move(d);
    if (result === 'moved') { moved = true; break; }
}
assert('Can move in at least one direction', moved);
assert('Invalid direction returns invalid', b2.move(-1) === 'invalid');
assert('Direction 12+ returns invalid', b2.move(12) === 'invalid');
assert('MoveCount incremented', b2.moveCount > 0);

// ─── 5. FOV (Field of View) ─────────────────────────────────────────
console.log('\n— FOV —');
assert('Visible set has cells', b.visible.size > 0);
assert('Explored set has cells', b.explored.size > 0);
assert('Player cell is visible', b.isVisible(b.player));
assert('Player cell is explored', b.isExplored(b.player));
// Walls far away should not be visible
const allCells = GridUtils.generateGrid(b.size);
const invisibleWalls = allCells.filter(c => b.getCell(c) === TILE.WALL && !b.isVisible(c));
assert('Some walls are not visible (FOV works)', invisibleWalls.length > 0);

// ─── 6. Combat System ───────────────────────────────────────────────
console.log('\n— Combat System —');
const b3 = new RogueBoard(8);
const initialHP = b3.hp;
const initialEnemyCount = b3.enemies.length;
// Try to attack an enemy by moving into it
let attacked = false;
for (let d = 0; d < 12; d++) {
    const nbrs = GridUtils.neighbors(b3.player.a, b3.player.b, b3.player.c, b3.player.d);
    const target = nbrs[d];
    if (GridUtils.inBounds(target.a, target.b, target.c, target.d, b3.size)) {
        if (b3.getCell(target) === TILE.ENEMY) {
            b3.move(d);
            attacked = true;
            break;
        }
    }
}
if (attacked) {
    assert('Combat occurred (HP may have changed or enemy killed)',
        b3.enemies.length < initialEnemyCount || b3.hp < initialHP || b3.combatLog.length > 0);
}
assert('Combat log is populated', b3.combatLog.length > 0);

// ─── 7. Damage Calculation ──────────────────────────────────────────
console.log('\n— Damage Calculation —');
assert('getAttack returns base + weapon', b.getAttack() === b.baseAtk);
assert('getDefense returns base + armor', b.getDefense() === b.baseDef);
// Equip a weapon and verify
const b4 = new RogueBoard(6);
b4.weapon = { name: 'Test Sword', bonus: 5 };
assert('With weapon, ATK = base + 5', b4.getAttack() === b4.baseAtk + 5);
b4.armor = { name: 'Test Mail', bonus: 3 };
assert('With armor, DEF = base + 3', b4.getDefense() === b4.baseDef + 3);

// ─── 8. Potion Usage ────────────────────────────────────────────────
console.log('\n— Potion Usage —');
const b5 = new RogueBoard(6);
b5.hp = 10; // Reduce HP
const beforePotions = b5.potions;
const used = b5.usePotion();
assert('Potion used successfully', used === true);
assert('HP increased', b5.hp > 10);
assert('Potion count decreased', b5.potions === beforePotions - 1);
assert('HP capped at maxHp', b5.hp <= b5.maxHp);
// Try with 0 potions
b5.potions = 0;
assert('Cannot use potion when empty', b5.usePotion() === false);

// ─── 9. Leveling System ─────────────────────────────────────────────
console.log('\n— Leveling System —');
const b6 = new RogueBoard(6);
b6.xp = 19; // Just below level-up threshold
b6._checkLevelUp();
assert('No level-up at 19 XP', b6.level === 1);
b6.xp = 20;
b6._checkLevelUp();
assert('Level-up at 20 XP', b6.level === 2);
assert('MaxHP increased by 5', b6.maxHp === 25);
assert('BaseAtk increased by 1', b6.baseAtk === 4);
assert('XP threshold increased', b6.xpToLevel === 30);

// ─── 10. Item Pickup ─────────────────────────────────────────────────
console.log('\n— Item Pickup —');
const b7 = new RogueBoard(6);
const goldPos = { a: 0, b: 0, c: 0, d: 0 };
b7.setCell(goldPos, TILE.GOLD);
b7.items.push({ pos: goldPos, type: 'gold', data: { amount: 50 } });
b7._pickupItem(goldPos);
assert('Gold picked up', b7.gold === 50);

// ─── 11. Weapon Equip ───────────────────────────────────────────────
console.log('\n— Weapon Equip —');
const b8 = new RogueBoard(6);
const wpnPos = { a: 1, b: 0, c: 0, d: 0 };
b8.setCell(wpnPos, TILE.WEAPON);
b8.items.push({ pos: wpnPos, type: 'weapon', data: { name: 'Axe', bonus: 3 } });
b8._pickupItem(wpnPos);
assert('Weapon equipped', b8.weapon !== null);
assert('Weapon name is Axe', b8.weapon.name === 'Axe');
assert('Weapon bonus is 3', b8.weapon.bonus === 3);

// ─── 12. Armor Equip ────────────────────────────────────────────────
console.log('\n— Armor Equip —');
const armPos = { a: 2, b: 0, c: 0, d: 0 };
b8.setCell(armPos, TILE.ARMOR);
b8.items.push({ pos: armPos, type: 'armor', data: { name: 'Plate', bonus: 4 } });
b8._pickupItem(armPos);
assert('Armor equipped', b8.armor !== null);
assert('Armor name is Plate', b8.armor.name === 'Plate');
assert('Armor bonus is 4', b8.armor.bonus === 4);

// ─── 13. Dungeon Connectivity ────────────────────────────────────────
console.log('\n— Dungeon Connectivity —');
const b9 = new RogueBoard(8);
const allCells9 = GridUtils.generateGrid(b9.size);
const stairsCell = allCells9.find(c => b9.getCell(c) === TILE.STAIRS);
assert('Stairs exist in dungeon', stairsCell !== undefined);
if (stairsCell) {
    const isWalkable = (pos) => b9.getCell(pos) !== TILE.WALL;
    const path = QuadrayPathfinder.bfs(b9.player, stairsCell, isWalkable, b9.size);
    assert('Stairs reachable from player via BFS', path !== null && path.length > 0);
}

// ─── 14. Death and Game Over ─────────────────────────────────────────
console.log('\n— Death and Game Over —');
const b10 = new RogueBoard(6);
b10.hp = 1;
b10._enemyAttack({ name: 'Test', atk: 10, def: 0 });
assert('Death when HP reaches 0', b10.gameOver === true);
assert('HP is 0 after death', b10.hp === 0);
assert('Cannot move after death', b10.move(0) === 'invalid');

// ─── 15. Reset ───────────────────────────────────────────────────────
console.log('\n— Reset —');
const b11 = new RogueBoard(6);
b11.gold = 999; b11.depth = 5; b11.level = 3; b11.xp = 50;
b11.weapon = { name: 'Sword', bonus: 5 };
b11.gameOver = true;
b11.reset();
assert('Reset clears gold', b11.gold === 0);
assert('Reset restores HP', b11.hp === 20);
assert('Reset clears depth', b11.depth === 1);
assert('Reset clears level', b11.level === 1);
assert('Reset clears XP', b11.xp === 0);
assert('Reset clears weapon', b11.weapon === null);
assert('Reset clears armor', b11.armor === null);
assert('Reset restores potions', b11.potions === 3);
assert('Reset clears gameOver', b11.gameOver === false);
assert('Reset clears combat log', b11.combatLog.length <= 1); // May have "Entered dungeon" msg
assert('Player exists after reset', b11.player !== null);

// ─── 16. Metadata ────────────────────────────────────────────────────
console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has hp', typeof meta.hp === 'number');
assert('Has maxHp', typeof meta.maxHp === 'number');
assert('Has gold', typeof meta.gold === 'number');
assert('Has depth', typeof meta.depth === 'number');
assert('Has level', typeof meta.level === 'number');
assert('Has xp', typeof meta.xp === 'number');
assert('Has attack', typeof meta.attack === 'number');
assert('Has defense', typeof meta.defense === 'number');
assert('Has potions', typeof meta.potions === 'number');
assert('Has enemies count', typeof meta.enemies === 'number');
assert('Has combatLog', Array.isArray(meta.combatLog));
assert('Has visibleCells', typeof meta.visibleCells === 'number');
assert('Has exploredCells', typeof meta.exploredCells === 'number');

// ─── 17. IVM Directions ──────────────────────────────────────────────
console.log('\n— IVM Directions —');
assert('12 IVM directions', GridUtils.DIRECTIONS.length === 12);
assert('Directions are arrays', Array.isArray(GridUtils.DIRECTIONS[0]));

// ─── 18. Synergetics Constants ───────────────────────────────────────
console.log('\n— Synergetics Constants —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
assert('CUBO_VOL = 20', SYNERGETICS.CUBO_VOL === 20);

// ─── 19. Round-Trip Conversions ──────────────────────────────────────
console.log('\n— Round-Trip Conversions —');
const rtTests = [new Quadray(1, 0, 0, 0), new Quadray(2, 1, 0, 1)];
for (const q of rtTests) {
    const rt = verifyRoundTrip(q);
    assert(`Round-trip ${q.toString()}: error=${rt.error.toFixed(4)}`, rt.passed);
}

// ─── 20. Geometric Identities ────────────────────────────────────────
console.log('\n— Geometric Identities —');
const geoResults = verifyGeometricIdentities();
assert('All geometric checks pass', geoResults.allPassed === true);

// ─── 21. Stair Descent ──────────────────────────────────────────────
console.log('\n— Stair Descent —');
const b12 = new RogueBoard(6);
const depthBefore = b12.depth;
// Manually simulate stair descent
b12.depth++;
b12._generateDungeon();
assert('Depth incremented after descent', b12.depth === depthBefore + 1);
assert('New enemies spawned', b12.enemies.length > 0);
assert('Player placed in new dungeon', b12.player !== null);

// ─── 22. Enemy Pool Scaling ──────────────────────────────────────────
console.log('\n— Enemy Pool Scaling —');
const b13 = new RogueBoard(6);
b13.depth = 1;
const pool1 = b13._getEnemyPool();
assert('Depth 1: only goblins', pool1.length === 1 && pool1[0] === 'goblin');
b13.depth = 3;
const pool3 = b13._getEnemyPool();
assert('Depth 3: goblins + skeletons', pool3.length === 2);
b13.depth = 7;
const pool7 = b13._getEnemyPool();
assert('Depth 7: skeletons + ogres + wraiths', pool7.length === 3);
assert('Depth 7 includes wraith', pool7.includes('wraith'));

// ─── 23. Combat Log ──────────────────────────────────────────────────
console.log('\n— Combat Log —');
const b14 = new RogueBoard(6);
b14._log('Test message');
assert('Log message added', b14.combatLog.includes('Test message'));
assert('Max log enforced', b14.combatLog.length <= b14.maxLog);

// ─── 24. Magic Scrolls ───────────────────────────────────────────────
console.log('\n— Magic Scrolls —');
const b15 = new RogueBoard(6);
b15.scrolls.teleport = 1;
b15.scrolls.fireball = 1;
b15.scrolls.mapping = 1;

// Test Teleport
b15.useScroll('teleport');
assert('Teleport consumes scroll', b15.scrolls.teleport === 0);

// Test Fireball
const fbEnemyPos = GridUtils.boundedNeighbors(b15.player.a, b15.player.b, b15.player.c, b15.player.d, b15.size).find(c => b15.getCell(c) === TILE.FLOOR);
if (fbEnemyPos) {
    b15.enemies.push({ pos: fbEnemyPos, type: 'goblin', hp: 5, maxHp: 5, xp: 5, def: 0, name: 'Target', atk: 1 });
    b15.setCell(fbEnemyPos, TILE.ENEMY);
    b15._computeFOV();
    b15.useScroll('fireball');
    const targetAlive = b15.enemies.find(e => e.name === 'Target');
    assert('Fireball damages/kills visible enemy', !targetAlive || targetAlive.hp < 5);
    assert('Fireball consumes scroll', b15.scrolls.fireball === 0);
}

// Test Mapping
const expBefore = b15.explored.size;
b15.useScroll('mapping');
assert('Mapping scroll reveals map', b15.explored.size > expBefore);
assert('Mapping consumes scroll', b15.scrolls.mapping === 0);

// ─── 25. Doors and Traps ─────────────────────────────────────────────
console.log('\n— Doors and Traps —');
const b16 = new RogueBoard(6);
const dtNbrsPos = GridUtils.boundedNeighbors(b16.player.a, b16.player.b, b16.player.c, b16.player.d, b16.size);
const doorPos = dtNbrsPos[0];
b16.setCell(doorPos, TILE.DOOR);

const allNbrs = GridUtils.neighbors(b16.player.a, b16.player.b, b16.player.c, b16.player.d);
let dirIndexDoor = -1;
for (let i = 0; i < allNbrs.length; i++) {
    if (allNbrs[i].a === doorPos.a && allNbrs[i].b === doorPos.b && allNbrs[i].c === doorPos.c && allNbrs[i].d === doorPos.d) {
        dirIndexDoor = i; break;
    }
}
const resultDoor = b16.move(dirIndexDoor);
assert('Moving into door opens it', resultDoor === 'door');
assert('Door tile becomes FLOOR', b16.getCell(doorPos) === TILE.FLOOR);

// Test Trap
const trapPos = dtNbrsPos[1];
b16.setCell(trapPos, TILE.TRAP);
let dirIndexTrap = -1;
for (let i = 0; i < allNbrs.length; i++) {
    if (allNbrs[i].a === trapPos.a && allNbrs[i].b === trapPos.b && allNbrs[i].c === trapPos.c && allNbrs[i].d === trapPos.d) {
        dirIndexTrap = i; break;
    }
}
const hpBeforeTrap = b16.hp;
const resultTrap = b16.move(dirIndexTrap);
assert('Moving into trap triggers it', resultTrap === 'moved' || resultTrap === 'dead');
assert('Trap deals 5 damage', b16.hp === Math.max(0, hpBeforeTrap - 5));

// ─── 26. Boss Generation ─────────────────────────────────────────────
console.log('\n— Boss Generation —');
const b17 = new RogueBoard(6);
b17.depth = 5;
b17._generateDungeon();
const hasBoss = b17.enemies.some(e => e.boss === true || e.type === 'dragon');
assert('Boss (Dragon) generates on depth 5', hasBoss);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);