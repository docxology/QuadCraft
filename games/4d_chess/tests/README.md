# Test Suite

Unit and integration tests for 4D Quadray Chess.

## Quick Start

```bash
# Node.js CLI (91 tests)
node test_all.js

# Browser visual runner
open test.html
```

## Test Files

| File | Tests | Description |
|------|-------|-------------|
| test_all.js | 91 | Complete, runnable test suite (`node test_all.js`) |
| lib_runner.js | — | Shared TestRunner class (helper, not run directly) |
| lib_quadray.js | — | Quadray coordinate test helpers (helper, not run directly) |
| lib_geometry.js | — | IVM geometry verification helpers (helper, not run directly) |
| test.html | — | Browser test runner |

## Coverage by Module

- **Quadray Class**: 12 tests (coordinates, arithmetic, conversion) + 5 extended
- **Piece Classes**: 8 tests (movement, symbols) + 5 extended
- **Board Class**: 7 tests (setup, validation, check detection) + 6 extended
- **Piece Movement Rules**: 4 tests
- **Game State**: 2 tests
- **Geometric Verification**: 9 tests (angles, round-trip, identities)
- **Analysis Module**: 5 tests + 4 extended
- **Storage Module**: 3 tests + 3 extended
- **Edge Cases**: 5 tests
- **Math Accuracy**: 5 tests (tetrahedral angles, triangle inequality)
- **FPVRenderer Module**: 8 tests

## Test Result: 91/91 passed (100%)
