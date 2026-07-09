# Test Suite - Agent Instructions

## Overview

Test suite for 4D Quadray Chess (91 tests, 100% pass rate).

## Files

| File | Purpose |
|------|---------|
| test_all.js | Main, runnable test suite (all 91 tests — `node test_all.js`) |
| lib_runner.js | Shared TestRunner class (helper, not run directly) |
| lib_quadray.js | Quadray coordinate test helpers (helper, not run directly) |
| lib_geometry.js | IVM verification helpers (helper, not run directly) |
| test.html | Browser visual runner |

## Running Tests

```bash
# Node.js CLI
node test_all.js

# Browser
open test.html
```

## Test Coverage

| Module | Tests |
|--------|-------|
| Quadray | 17 (12 + 5 extended) |
| Pieces | 13 (8 + 5 extended) |
| Board | 13 (7 + 6 extended) |
| Movement Rules | 4 |
| Game State | 2 |
| Geometry | 9 |
| Analysis | 9 (5 + 4 extended) |
| Storage | 6 (3 + 3 extended) |
| Edge Cases | 5 |
| Math | 5 |
| FPVRenderer | 8 |

## Adding Tests

1. Add `test.it()` inside appropriate `test.describe()` block
2. Use assertions: `assertEqual`, `assertTrue`, `assertApprox`
3. Run `node test_all.js` to verify

## Assertions

- `test.assertEqual(actual, expected, message)`
- `test.assertTrue(condition, message)`
- `test.assertFalse(condition, message)`
- `test.assertApprox(actual, expected, tolerance, message)`
