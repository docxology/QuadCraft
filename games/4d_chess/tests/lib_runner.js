/**
 * Test Runner - Shared testing infrastructure
 * 
 * A simple test framework for browser and Node.js environments.
 * @version 1.0.0
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.currentDescribe = null;
        this.passed = 0;
        this.failed = 0;
    }

    describe(name, fn) {
        this.currentDescribe = name;
        console.log(`📦 ${name}`);
        fn();
    }

    it(name, fn) {
        try {
            fn();
            console.log(`    ✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`    ❌ ${name}`);
            console.error(`       Error: ${error.message}`);
            this.failed++;
        }
    }

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected ${expected}, got ${actual}`);
        }
    }

    assertApprox(actual, expected, tolerance, message = '') {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message} Expected ~${expected} (±${tolerance}), got ${actual}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} Expected true, got false`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message} Expected false, got true`);
        }
    }

    summary() {
        const total = this.passed + this.failed;
        const pct = ((this.passed / total) * 100).toFixed(1);
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`📊 TEST RESULTS: ${this.passed}/${total} passed (${pct}%)`);
        if (this.failed === 0) {
            console.log('✅ All tests passed!');
        } else {
            console.log(`❌ ${this.failed} tests failed`);
        }
        console.log('═══════════════════════════════════════════════════');
        return { passed: this.passed, failed: this.failed, total };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner };
}
