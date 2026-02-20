/**
 * test_score_manager.js — Tests for ScoreManager module
 *
 * Tests: score tracking, level-up, lives, reset, serialization, high score.
 * Run: node games/tests/test_score_manager.js
 */
const path = require('path');
const { ScoreManager } = require(path.join(__dirname, '..', '..', '4d_generic', 'score_manager.js'));

let passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.error(`  ❌ ${msg}`); }
}

console.log('╔═══════════════════════════════════╗');
console.log('║   Test: ScoreManager Module       ║');
console.log('╚═══════════════════════════════════╝\n');

// 1. Default construction
console.log('▸ Default construction');
const sm = new ScoreManager();
assert(sm.score === 0, 'initial score = 0');
assert(sm.level === 1, 'initial level = 1');
assert(sm.lives === 3, 'initial lives = 3');
assert(sm.linesCleared === 0, 'initial linesCleared = 0');

// 2. Custom options
console.log('▸ Custom options');
const sm2 = new ScoreManager({ lives: 5, level: 2, levelThreshold: 100 });
assert(sm2.lives === 5, 'custom lives = 5');
assert(sm2.level === 2, 'custom starting level = 2');
assert(sm2.levelThreshold === 100, 'custom threshold = 100');

// 3. addScore
console.log('▸ addScore()');
const sm3 = new ScoreManager({ levelThreshold: 100 });
let result = sm3.addScore(50);
assert(sm3.score === 50, 'score = 50 after adding 50');
assert(!result.leveled, 'no level-up at 50');

result = sm3.addScore(60);
assert(sm3.score === 110, 'score = 110 after adding 60');
assert(result.leveled, 'levels up past threshold');
assert(sm3.level === 2, 'now at level 2');

// 4. Multiple level-ups
console.log('▸ Multiple level-ups');
const sm4 = new ScoreManager({ levelThreshold: 100 });
sm4.addScore(250);
assert(sm4.level === 3, 'score 250 → level 3');

// 5. loseLife
console.log('▸ loseLife()');
const sm5 = new ScoreManager({ lives: 2 });
let dead = sm5.loseLife();
assert(!dead, 'not dead at 1 life');
assert(sm5.lives === 1, 'lives = 1');

dead = sm5.loseLife();
assert(dead, 'dead at 0 lives');
assert(sm5.lives === 0, 'lives = 0');

// 6. Unlimited lives
console.log('▸ Unlimited lives');
const sm6 = new ScoreManager({ lives: 0 });
assert(!sm6.loseLife(), 'unlimited lives never dies');
assert(!sm6.loseLife(), 'still alive');

// 7. addLife
console.log('▸ addLife()');
const sm7 = new ScoreManager({ lives: 2 });
sm7.addLife();
assert(sm7.lives === 3, 'addLife increments');

// 8. nextLevel
console.log('▸ nextLevel()');
const sm8 = new ScoreManager();
sm8.nextLevel();
assert(sm8.level === 2, 'manual nextLevel');

// 9. reset
console.log('▸ reset()');
const sm9 = new ScoreManager({ lives: 3, levelThreshold: 100 });
sm9.addScore(200);
sm9.loseLife();
sm9.linesCleared = 5;
sm9.reset();
assert(sm9.score === 0, 'score reset to 0');
assert(sm9.level === 1, 'level reset to 1');
assert(sm9.lives === 3, 'lives reset to initial');
assert(sm9.linesCleared === 0, 'linesCleared reset');

// 10. toJSON
console.log('▸ toJSON()');
const sm10 = new ScoreManager({ lives: 3 });
sm10.addScore(100);
const json = sm10.toJSON();
assert(json.score === 100, 'toJSON score');
assert(json.level === 1, 'toJSON level');
assert(json.lives === 3, 'toJSON lives');
assert(json.highScore >= 0, 'toJSON highScore');
assert(json.linesCleared === 0, 'toJSON linesCleared');

// 11. High score tracking (no localStorage in Node)
console.log('▸ High score tracking');
const sm11 = new ScoreManager({ storageKey: null });
sm11.addScore(500);
assert(sm11.highScore === 0, 'no storageKey → highScore stays 0');

console.log(`\n${'─'.repeat(36)}`);
console.log(`ScoreManager: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
