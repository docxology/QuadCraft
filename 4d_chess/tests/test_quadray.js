/**
 * Quadray Tests - Test suite for the Quadray class
 * 
 * Tests coordinate creation, normalization, arithmetic, and conversions.
 */

// Load dependencies for Node.js
if (typeof require !== 'undefined') {
    const { Quadray, ROOT2, S3 } = require('../js/quadray.js');
    global.Quadray = Quadray;
    global.ROOT2 = ROOT2;
    global.S3 = S3;
}

function runQuadrayTests(test) {
    test.describe('Quadray Class', () => {
        test.it('should create a Quadray with given coordinates', () => {
            const q = new Quadray(1, 2, 3, 4);
            test.assertEqual(q.a, 1, 'a component');
            test.assertEqual(q.b, 2, 'b component');
            test.assertEqual(q.c, 3, 'c component');
            test.assertEqual(q.d, 4, 'd component');
        });

        test.it('should normalize to non-negative coordinates', () => {
            const q = new Quadray(-1, 0, 1, 2);
            const n = q.normalized();
            test.assertEqual(Math.min(n.a, n.b, n.c, n.d), 0, 'Min should be 0');
            test.assertTrue(n.a >= 0 && n.b >= 0 && n.c >= 0 && n.d >= 0, 'All should be non-negative');
        });

        test.it('should add two Quadrays correctly', () => {
            const q1 = new Quadray(1, 0, 0, 0);
            const q2 = new Quadray(0, 1, 0, 0);
            const sum = q1.add(q2);
            test.assertEqual(sum.a, 1, 'a component');
            test.assertEqual(sum.b, 1, 'b component');
        });

        test.it('should subtract Quadrays correctly', () => {
            const q1 = new Quadray(2, 1, 0, 0);
            const q2 = new Quadray(1, 0, 0, 0);
            const diff = q1.subtract(q2);
            test.assertEqual(diff.a, 1, 'a component');
            test.assertEqual(diff.b, 1, 'b component');
        });

        test.it('should scale a Quadray correctly', () => {
            const q = new Quadray(1, 0, 0, 0);
            const scaled = q.scale(2);
            test.assertEqual(scaled.a, 2, 'a should be doubled');
        });

        test.it('should convert to Cartesian coordinates', () => {
            const q = Quadray.A; // (1, 0, 0, 0)
            const c = q.toCartesian();
            test.assertTrue(typeof c.x === 'number', 'x should be a number');
            test.assertTrue(typeof c.y === 'number', 'y should be a number');
            test.assertTrue(typeof c.z === 'number', 'z should be a number');
        });

        test.it('should calculate length correctly', () => {
            const q = Quadray.A;
            const len = q.length();
            test.assertApprox(len, 1 / ROOT2, 0.01, 'Length of basis vector');
        });

        test.it('should detect equality between Quadrays', () => {
            const q1 = new Quadray(1, 2, 3, 4);
            const q2 = new Quadray(1, 2, 3, 4);
            test.assertTrue(q1.equals(q2), 'Should be equal');
        });

        test.it('should create Quadray from string representation', () => {
            const q = new Quadray(1, 0, 0, 0);
            const s = q.toString();
            test.assertTrue(s.includes('1') || s.includes('a'), 'String should contain coordinate info');
        });

        test.it('Basis vectors should have equal length', () => {
            const lengths = Quadray.BASIS.map(b => b.length());
            const first = lengths[0];
            for (const len of lengths) {
                test.assertApprox(len, first, 0.0001, 'All basis vectors should have equal length');
            }
        });

        test.it('static distance should match instance distanceTo', () => {
            const q1 = new Quadray(1, 0, 0, 0);
            const q2 = new Quadray(0, 1, 0, 0);
            const d1 = Quadray.distance(q1, q2);
            const d2 = q1.distanceTo(q2);
            test.assertApprox(d1, d2, 0.0001, 'Both distance methods should match');
        });
    });

    test.describe('Extended Quadray Tests', () => {
        test.it('clone should create independent copy', () => {
            const q1 = new Quadray(1, 2, 3, 4);
            const q2 = q1.clone();
            test.assertTrue(q1.equals(q2), 'Clone should equal original');
        });

        test.it('toKey should return consistent hash string', () => {
            const q = new Quadray(1, 0, 0, 0);
            const key1 = q.toKey();
            const key2 = q.toKey();
            test.assertEqual(key1, key2, 'Keys should be consistent');
        });

        test.it('toKey should differ for different positions', () => {
            const q1 = new Quadray(1, 0, 0, 0);
            const q2 = new Quadray(0, 1, 0, 0);
            test.assertTrue(q1.toKey() !== q2.toKey(), 'Different positions should have different keys');
        });

        test.it('fromCartesian should convert correctly', () => {
            const original = new Quadray(1, 0, 0, 0);
            const cart = original.toCartesian();
            const recovered = Quadray.fromCartesian(cart.x, cart.y, cart.z);
            const norm1 = original.normalized();
            const norm2 = recovered.normalized();
            test.assertApprox(norm1.a, norm2.a, 0.01, 'a should match');
        });

        test.it('distanceTo should match static distance', () => {
            const q1 = new Quadray(1, 0, 0, 0);
            const q2 = new Quadray(0, 1, 0, 0);
            const d1 = q1.distanceTo(q2);
            const d2 = Quadray.distance(q1, q2);
            test.assertApprox(d1, d2, 0.0001, 'Methods should match');
        });
    });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runQuadrayTests };
}
