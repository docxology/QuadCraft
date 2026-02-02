/**
 * Geometric Verification Tests
 * 
 * Tests for the geometric verification functions that validate
 * the IVM/Quadray mathematical properties.
 */

// Load dependencies for Node.js
if (typeof require !== 'undefined') {
    const { Quadray } = require('../js/quadray.js');
    const analysis = require('../js/analysis.js');
    global.Quadray = Quadray;
    global.angleBetweenQuadrays = analysis.angleBetweenQuadrays;
    global.verifyRoundTrip = analysis.verifyRoundTrip;
    global.verifyGeometricIdentities = analysis.verifyGeometricIdentities;
}

function runGeometryTests(test) {
    test.describe('Geometric Verification Functions', () => {
        test.it('angleBetweenQuadrays should compute tetrahedral angle (~109.47°)', () => {
            const angle = angleBetweenQuadrays(Quadray.A, Quadray.B);
            test.assertApprox(angle, 109.47, 1.0, 'Angle between A and B should be ~109.47°');
        });

        test.it('angleBetweenQuadrays should be symmetric', () => {
            const angle1 = angleBetweenQuadrays(Quadray.A, Quadray.C);
            const angle2 = angleBetweenQuadrays(Quadray.C, Quadray.A);
            test.assertApprox(angle1, angle2, 0.001, 'Angle should be symmetric');
        });

        test.it('angleBetweenQuadrays should return 0 for zero vectors', () => {
            const angle = angleBetweenQuadrays(Quadray.ORIGIN, Quadray.A);
            test.assertEqual(angle, 0, 'Angle with origin should be 0');
        });

        test.it('verifyRoundTrip should pass for basis vectors', () => {
            for (const basis of Quadray.BASIS) {
                const result = verifyRoundTrip(basis);
                test.assertTrue(result.passed, `Round-trip should pass for ${basis.toString()}`);
            }
        });

        test.it('verifyRoundTrip should report error magnitude', () => {
            const result = verifyRoundTrip(new Quadray(2, 1, 0, 1));
            test.assertTrue('error' in result, 'Should have error property');
            test.assertTrue(typeof result.error === 'number', 'Error should be a number');
        });

        test.it('verifyGeometricIdentities should return complete results', () => {
            const results = verifyGeometricIdentities();
            test.assertTrue('timestamp' in results, 'Should have timestamp');
            test.assertTrue('checks' in results, 'Should have checks array');
            test.assertTrue('allPassed' in results, 'Should have allPassed boolean');
            test.assertTrue(results.checks.length >= 6, 'Should have at least 6 checks');
        });

        test.it('verifyGeometricIdentities should pass all checks', () => {
            const results = verifyGeometricIdentities();
            test.assertTrue(results.allPassed, 'All geometric identity checks should pass');
        });

        test.it('verifyGeometricIdentities checks should have required properties', () => {
            const results = verifyGeometricIdentities();
            for (const check of results.checks) {
                test.assertTrue('name' in check, 'Check should have name');
                test.assertTrue('description' in check, 'Check should have description');
                test.assertTrue('expected' in check, 'Check should have expected');
                test.assertTrue('actual' in check, 'Check should have actual');
                test.assertTrue('passed' in check, 'Check should have passed');
            }
        });

        test.it('All 6 basis angle pairs should be tetrahedral', () => {
            const basisLabels = ['A', 'B', 'C', 'D'];
            let pairCount = 0;
            for (let i = 0; i < 4; i++) {
                for (let j = i + 1; j < 4; j++) {
                    const angle = angleBetweenQuadrays(Quadray.BASIS[i], Quadray.BASIS[j]);
                    test.assertApprox(angle, 109.47, 1.0, `${basisLabels[i]}-${basisLabels[j]} should be ~109.47°`);
                    pairCount++;
                }
            }
            test.assertEqual(pairCount, 6, 'Should have exactly 6 basis pairs');
        });
    });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runGeometryTests };
}
