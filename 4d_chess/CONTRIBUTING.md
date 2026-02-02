# Contributing to 4D Quadray Chess

Thank you for your interest in contributing! This guide explains how to get started.

---

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Node.js (for running tests via CLI)
- Text editor or IDE

### Quick Start

```bash
# Clone the repository
git clone https://github.com/docxology/QuadCraft.git
cd QuadCraft/4d_chess

# Open in browser
open index.html

# Run tests
cd tests && node test_all.js
```

---

## Project Structure

```text
4d_chess/
├── js/           # JavaScript modules
├── docs/         # Documentation
├── tests/        # Test suite
├── index.html    # Main game page
└── README.md     # Project overview
```

---

## Code Standards

### JavaScript Style

- Use ES6+ features (classes, const/let, arrow functions)
- JSDoc comments for public functions
- 4-space indentation
- Descriptive variable names

### Example

```javascript
/**
 * Calculate distance between two Quadrays.
 * @param {Quadray} q1 - First position
 * @param {Quadray} q2 - Second position
 * @returns {number} Euclidean distance
 */
static distance(q1, q2) {
    const diff = q1.subtract(q2);
    return diff.length();
}
```

### Module Export Pattern

All modules support browser and Node.js:

```javascript
// At end of module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClassName };
}
```

---

## Testing

### Running Tests

```bash
# CLI (Node.js)
cd tests && node test_all.js

# Browser
open tests/test.html
```

### Adding Tests

1. Open `tests/test_all.js`
2. Find or create appropriate `describe` block
3. Add `it` test case

```javascript
test.describe('Your Module', () => {
    test.it('should do something', () => {
        const result = yourFunction();
        test.assertEqual(result, expected, 'Description');
    });
});
```

### Test Assertions

- `test.assertEqual(actual, expected, message)`
- `test.assertTrue(condition, message)`
- `test.assertFalse(condition, message)`
- `test.assertApprox(actual, expected, tolerance, message)`

---

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Edit code
- Add tests
- Update documentation

### 3. Test Your Changes

```bash
cd tests && node test_all.js
# Ensure all tests pass
```

### 4. Commit

```bash
git add -A
git commit -m "Add: feature description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

---

## Adding New Features

### New Piece Type

1. Edit `js/pieces.js`
2. Create class extending `Piece`
3. Implement `getValidMoves(board)`
4. Add to `PieceType` enum
5. Update `createPiece()` factory
6. Add tests in `test_all.js`

### New Analysis Metric

1. Edit `js/analysis.js`
2. Add function following existing pattern
3. Add to exports
4. Add tests

### New UI Feature

1. Add HTML in `index.html`
2. Add CSS styles
3. Add handler in `game.js`
4. Connect via event listener

---

## Documentation

### Updating Docs

- Keep `docs/api-reference.md` in sync with code
- Update `docs/architecture.md` for structural changes
- Update `README.md` for user-facing changes

### Documentation Format

- Use Markdown
- Include code examples
- Add tables for structured data

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn

---

## Questions?

Open an issue on GitHub for:

- Bug reports
- Feature requests
- General questions

Thank you for contributing!
