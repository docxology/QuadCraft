# 4D Quadray Chess Documentation

Welcome to the comprehensive documentation for **4D Quadray Chess**.

![Tests](https://img.shields.io/badge/tests-83%20passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Contents

### Core Documentation

| Document | Description |
|----------|-------------|
| [Game Rules](game-rules.md) | How to play 4D chess |
| [Piece Movement](piece-movement.md) | Detailed movement for each piece |
| [Quadray Math](quadray-math.md) | Quadray coordinate system and IVM geometry |
| [Notation](notation.md) | Recording games and move notation |

### Strategy & Theory

| Document | Description |
|----------|-------------|
| [Chess Theory](chess-theory.md) | Complete strategy guide (openings, tactics, endgames) |
| [Chess History](chess-history.md) | Evolution from ancient chess to 4D |

### Technical Reference

| Document | Description |
|----------|-------------|
| [API Reference](api-reference.md) | Complete class and method documentation |
| [Architecture](architecture.md) | Code structure and modules |

## Quick Links

- **Play**: Open `index.html` or run `python3 -m http.server 8080`
- **Tests**: `cd tests && node test_all.js` (83 tests)
- **Source**: `js/` directory (7 modules, ~2000 lines)

## Getting Started

```bash
# Clone and run
cd 4d_chess
python3 -m http.server 8080
# Open http://localhost:8080
```

## Module Architecture

```
┌─────────────┐
│  quadray.js │  Core 4D coordinate math
└──────┬──────┘
       │
       v
┌─────────────┐
│  pieces.js  │  Chess piece classes
└──────┬──────┘
       │
       v
┌─────────────┐
│  board.js   │  24-piece game board
└──────┬──────┘
       │
  ┌────┴────┬─────────────┐
  │         │             │
  v         v             v
┌─────┐ ┌───────┐ ┌──────────┐
│game │ │render │ │ analysis │
└──┬──┘ └───────┘ └──────────┘
   │
   v
┌─────────┐
│ storage │  Save/Load JSON
└─────────┘
```

## Key Concepts

- **Quadray coordinates** (a, b, c, d) define positions
- Four basis vectors point to tetrahedron vertices
- Pieces move along these tetrahedral axes
- 24 total pieces (12 per side)

## Running Tests

```bash
# Node.js CLI (83 tests)
cd tests && node test_all.js

# Or open in browser
open tests/test.html
```

## License

MIT License - Part of the QuadCraft project.
