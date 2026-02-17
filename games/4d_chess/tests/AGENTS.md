# Test Suite - Agent Instructions

## Overview

Test suite for 4D Quadray Chess (83 tests, 100% pass rate).

## Files

| File | Purpose |
|------|---------|
| test_all.js | Main test suite (all 83 tests) |
| test_runner.js | Shared TestRunner class |
| test_quadray.js | Quadray coordinate tests |
| test_geometry.js | IVM verification tests |
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
| Quadray | 17 |
| Pieces | 13 |
| Board | 13 |
| Geometry | 9 |
| Analysis | 9 |
| Storage | 6 |
| Edge Cases | 5 |
| Math | 5 |

## Adding Tests

1. Add `test.it()` inside appropriate `test.describe()` block
2. Use assertions: `assertEqual`, `assertTrue`, `assertApprox`
3. Run `node test_all.js` to verify

## Assertions

- `test.assertEqual(actual, expected, message)`
- `test.assertTrue(condition, message)`
- `test.assertFalse(condition, message)`
- `test.assertApprox(actual, expected, tolerance, message)`
