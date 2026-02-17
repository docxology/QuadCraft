# Test Suite

Unit and integration tests for 4D Quadray Chess.

## Quick Start

```bash
# Node.js CLI (83 tests)
node test_all.js

# Browser visual runner
open test.html
```

## Test Files

| File | Tests | Description |
|------|-------|-------------|
| test_all.js | 83 | Complete test suite |
| test_runner.js | — | Shared TestRunner class |
| test_quadray.js | 17 | Quadray coordinate tests |
| test_geometry.js | 9 | IVM geometry verification |
| test.html | — | Browser test runner |

## Coverage by Module

- **Quadray Class**: 17 tests (coordinates, arithmetic, conversion)
- **Piece Classes**: 13 tests (movement, symbols)
- **Board Class**: 13 tests (setup, validation, check detection)
- **Geometric Verification**: 9 tests (angles, round-trip, identities)
- **Analysis Module**: 9 tests (metrics)
- **Storage Module**: 6 tests (save/load)
- **Edge Cases**: 5 tests
- **Math Accuracy**: 5 tests (tetrahedral angles, triangle inequality)

## Test Result: 83/83 passed (100%)
