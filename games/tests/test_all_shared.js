/**
 * test_all_shared.js — Integration runner for all shared module tests
 *
 * Runs test_projection.js, test_camera.js, test_zoom.js in sequence
 * and reports combined results.
 *
 * Run: node games/tests/test_all_shared.js
 */
const { execSync } = require('child_process');
const path = require('path');

const TESTS_DIR = __dirname;
const TEST_FILES = [
    'test_projection.js',
    'test_camera.js',
    'test_zoom.js',
    'test_hud.js',
    'test_score_manager.js',
    'test_grid_utils.js',
    'test_base_renderer.js',
    'test_base_game.js',
];

console.log('╔════════════════════════════════════════════╗');
console.log('║   QuadCraft Shared Module Test Runner      ║');
console.log('╚════════════════════════════════════════════╝\n');

let totalPassed = 0, totalFailed = 0, errors = [];

for (const file of TEST_FILES) {
    const filePath = path.join(TESTS_DIR, file);
    try {
        const output = execSync(`node "${filePath}"`, {
            encoding: 'utf-8',
            cwd: path.join(TESTS_DIR, '..')
        });

        // Parse results from output
        const passMatch = output.match(/(\d+) passed/);
        const failMatch = output.match(/(\d+) failed/);
        const p = passMatch ? parseInt(passMatch[1]) : 0;
        const f = failMatch ? parseInt(failMatch[1]) : 0;
        totalPassed += p;
        totalFailed += f;

        const status = f === 0 ? '✅' : '❌';
        console.log(`${status} ${file}: ${p} passed, ${f} failed`);
    } catch (err) {
        totalFailed++;
        errors.push(file);
        console.log(`❌ ${file}: CRASHED`);
        if (err.stdout) console.log(err.stdout);
        if (err.stderr) console.log(err.stderr.split('\n').slice(0, 3).join('\n'));
    }
}

console.log(`\n${'─'.repeat(44)}`);
console.log(`Summary: ${totalPassed} passed, ${totalFailed} failed`);
if (errors.length > 0) {
    console.log(`Errors in: ${errors.join(', ')}`);
}
process.exit(totalFailed > 0 ? 1 : 0);
