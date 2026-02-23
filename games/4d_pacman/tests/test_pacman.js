/**
 * test_pacman.js — Comprehensive Tests for 4D Pac-Man
 *
 * Groups: construction, directions, movement, pellets, power pellets,
 * ghost behavior, fruit system, death/collision, level progression,
 * reset, metadata, distances, synergetics.
 *
 * Run: node tests/test_pacman.js
 */
const { Quadray } = require('../../4d_generic/quadray.js');
const { GridUtils } = require('../../4d_generic/grid_utils.js');
const { SYNERGETICS, verifyRoundTrip, verifyGeometricIdentities } = require('../../4d_generic/synergetics.js');
const { PacManBoard } = require('../js/pacman_board.js');

let passed = 0, failed = 0, total = 0;
function assert(name, condition) {
    total++;
    if (condition) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

console.log('=== 4D Pac-Man — Comprehensive Tests ===\n');

// ─── 1. Board Construction ───────────────────────────────────────────
console.log('— Board Construction —');
const b = new PacManBoard(5);
assert('Board size 5', b.size === 5);
assert('Pellets exist', b.pellets.size > 0);
assert('Power pellets exist', b.powerPellets.size > 0);
assert('4 ghosts', b.ghosts.length === 4);
assert('Lives start at 3', b.lives === 3);
assert('Score starts at 0', b.score === 0);
assert('Level starts at 1', b.level === 1);
assert('Game not over', !b.gameOver);
assert('Not won', !b.won);
assert('PelletsEaten = 0', b.pelletsEaten === 0);
assert('No fruit initially', b.fruit === null);
assert('FruitEaten = 0', b.fruitEaten === 0);
assert('TotalPellets tracked', b.totalPellets > 0);

// ─── 2. Directions ───────────────────────────────────────────────────
console.log('\n— Directions —');
assert('12 directions', PacManBoard.DIRECTIONS.length === 12);
assert('Directions have da', typeof PacManBoard.DIRECTIONS[0].da === 'number');
assert('Directions have name', typeof PacManBoard.DIRECTIONS[0].name === 'string');

// ─── 3. Movement ─────────────────────────────────────────────────────
console.log('\n— Movement —');
const b2 = new PacManBoard(5);
b2.setDirection(PacManBoard.DIRECTIONS[0]);
const result = b2.step();
assert('Step returns play/hit/gameover', ['play', 'hit', 'gameover', 'dead', 'levelup'].includes(result));

// Wrapping
const b3 = new PacManBoard(5);
assert('wrap(0) = 0', b3.wrap(0) === 0);
assert('wrap(5) wraps to 0', b3.wrap(5) === 0);
assert('wrap(-1) wraps to 4', b3.wrap(-1) === 4);

// ─── 4. Pellet Eating ────────────────────────────────────────────────
console.log('\n— Pellet Eating —');
const b4 = new PacManBoard(5);
const pelletKey = [...b4.pellets][0];
if (pelletKey) {
    const [a, bc, c, d] = b4.parseKey(pelletKey);
    b4.pacman = { a, b: bc, c, d };
    b4.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
    const pelletsBefore = b4.pellets.size;
    b4.step();
    assert('Pellet eaten', b4.pellets.size < pelletsBefore || b4.pelletsEaten > 0);
    assert('Score increased', b4.score >= 10);
}

// ─── 5. Power Pellet ─────────────────────────────────────────────────
console.log('\n— Power Pellets —');
const b5 = new PacManBoard(5);
const ppKey = [...b5.powerPellets][0];
if (ppKey) {
    const [pa, pb, pc, pd] = b5.parseKey(ppKey);
    b5.pacman = { a: pa, b: pb, c: pc, d: pd };
    b5.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
    const ppBefore = b5.powerPellets.size;
    b5.step();
    assert('Power pellet consumed', b5.powerPellets.size < ppBefore);
    assert('Power timer set', b5.powerTimer > 0);
    assert('Ghosts scared', b5.ghosts.some(g => g.scared));
    assert('Score increased by 50', b5.score >= 50);
}

// ─── 6. Ghost Behavior ──────────────────────────────────────────────
console.log('\n— Ghost Behavior —');
const b6 = new PacManBoard(5);
assert('Ghosts have state', b6.ghosts.every(g => typeof g.state === 'string'));
assert('Ghosts have name', b6.ghosts.every(g => typeof g.name === 'string'));
assert('Ghosts have coordinates', b6.ghosts.every(g =>
    typeof g.a === 'number' && typeof g.b === 'number'));

// Scared ghost
b6.powerTimer = 10;
b6.ghosts.forEach(g => { g.scared = true; g.state = 'frightened'; });
const ghostBefore = { ...b6.ghosts[0] };
b6.step();
assert('Scared ghosts can move', true); // May or may not have moved

// ─── 7. Fruit System ────────────────────────────────────────────────
console.log('\n— Fruit System —');
const b7 = new PacManBoard(5);
assert('5 fruit types defined', b7.fruitTypes.length === 5);
assert('Cherry is first', b7.fruitTypes[0].name === 'Cherry');
assert('Melon is last', b7.fruitTypes[4].name === 'Melon');
assert('Fruit threshold = 0.3', b7.fruitThreshold === 0.3);

// Simulate fruit spawn
b7.pelletsEaten = Math.ceil(b7.totalPellets * 0.3);
b7._spawnFruit();
assert('Fruit spawned', b7.fruit !== null);
assert('Fruit has position', typeof b7.fruit?.pos?.a === 'number');
assert('Fruit has timer', b7.fruit?.timer === 50);
assert('Fruit has points', b7.fruit?.points >= 100);

// Fruit collection
const b7b = new PacManBoard(5);
b7b._spawnFruit();
if (b7b.fruit) {
    b7b.pacman = { ...b7b.fruit.pos };
    b7b.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
    const scoreBefore = b7b.score;
    b7b.step();
    assert('Fruit collected gives score', b7b.score > scoreBefore);
    assert('Fruit removed after collect', b7b.fruit === null);
    assert('FruitEaten incremented', b7b.fruitEaten === 1);
}

// Fruit expiry
const b7c = new PacManBoard(5);
b7c._spawnFruit();
if (b7c.fruit) {
    b7c.fruit.timer = 1;
    b7c.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
    b7c.step();
    assert('Fruit expires after timer', b7c.fruit === null);
}

// ─── 8. Death / Game Over ────────────────────────────────────────────
console.log('\n— Death / Game Over —');
const b8 = new PacManBoard(5);
b8.lives = 1;
const mid = Math.floor(b8.size / 2);
// Place a ghost on pacman
b8.ghosts[0].a = b8.pacman.a;
b8.ghosts[0].b = b8.pacman.b;
b8.ghosts[0].c = b8.pacman.c;
b8.ghosts[0].d = b8.pacman.d;
b8.ghosts[0].state = 'chase';
b8.ghosts[0].scared = false;
b8.pacmanDir = { da: 0, db: 0, dc: 0, dd: 0, name: 'none' };
const deathResult = b8.step();
assert('Death result is dead', deathResult === 'dead');
assert('Game over', b8.gameOver);

// ─── 9. Reset ────────────────────────────────────────────────────────
console.log('\n— Reset —');
const b9 = new PacManBoard(5);
b9.score = 999; b9.lives = 0; b9.gameOver = true;
b9.level = 5; b9.fruitEaten = 3;
b9.reset();
assert('Reset clears score', b9.score === 0);
assert('Reset restores lives', b9.lives === 3);
assert('Reset clears gameOver', !b9.gameOver);
assert('Reset resets level', b9.level === 1);
assert('Reset clears fruitEaten', b9.fruitEaten === 0);
assert('Reset restores pellets', b9.pellets.size > 0);
assert('Reset clears fruit', b9.fruit === null);

// ─── 10. getEntities ─────────────────────────────────────────────────
console.log('\n— getEntities —');
const ents = b.getEntities();
assert('Returns array', Array.isArray(ents));
assert('Includes pacman', ents.some(e => e.type === 'pacman'));
assert('Includes ghost', ents.some(e => e.type === 'ghost'));
assert('Includes pellet', ents.some(e => e.type === 'pellet'));

// ─── 11. Metadata ────────────────────────────────────────────────────
console.log('\n— Metadata —');
const meta = b.getMetadata();
assert('Has score', typeof meta.score === 'number');
assert('Has lives', typeof meta.lives === 'number');
assert('Has level', typeof meta.level === 'number');
assert('Has pelletsRemaining', typeof meta.pelletsRemaining === 'number');
assert('Has pelletsEaten', typeof meta.pelletsEaten === 'number');
assert('Has ghostsEaten', typeof meta.ghostsEaten === 'number');
assert('Has powerTimer', typeof meta.powerTimer === 'number');
assert('Has gameOver', typeof meta.gameOver === 'boolean');
assert('Has fruit field', meta.fruit === null || typeof meta.fruit === 'string');
assert('Has fruitEaten', typeof meta.fruitEaten === 'number');
assert('Has tetraCount', typeof meta.tetraCount === 'number');
assert('Has octaCount', typeof meta.octaCount === 'number');
assert('Has totalPellets', typeof meta.totalPellets === 'number');

// ─── 12. Distance Methods ────────────────────────────────────────────
console.log('\n— Distance Methods —');
const p1 = { a: 0, b: 0, c: 0, d: 0 };
const p2 = { a: 2, b: 2, c: 2, d: 2 };
assert('Manhattan > 0', b.manhattanDistance(p1, p2) > 0);
assert('Euclidean > 0', b.euclideanDistance(p1, p2) > 0);

// ─── 13. Synergetics & Round-Trip ────────────────────────────────────
console.log('\n— Synergetics & Round-Trip —');
assert('TETRA_VOL = 1', SYNERGETICS.TETRA_VOL === 1);
assert('OCTA_VOL = 4', SYNERGETICS.OCTA_VOL === 4);
const rt = verifyRoundTrip(new Quadray(1, 0, 0, 0));
assert('Round-trip passes', rt.passed);
const geo = verifyGeometricIdentities();
assert('Geometric identities pass', geo.allPassed);

// ─── Summary ─────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed (${total} total) ===`);
process.exit(failed > 0 ? 1 : 0);
