# 4D Quadray Checkers

A 4D checkers game using [Quadray coordinates](https://en.wikipedia.org/wiki/Quadray_coordinates) — tetrahedral basis vectors in four-dimensional space.

## Play

Open `index.html` in any modern browser. No build step or server required.

```bash
open index.html
# or
python3 -m http.server 8080
# then visit http://localhost:8080/games/4d_checkers/
```

## How It Works

### Board Topology

The board is a **4×4×4×4 grid** in Quadray space. Each position has coordinates `(a, b, c, d)` where each component ranges from 0 to 3.

- **Red** starts at Sum 0 and Sum 2 positions (near origin).
- **Black** starts at Sum 8 and Sum 6 positions (far side).

### Movement

Pieces move **diagonally** — changing exactly **two** Quadray coordinates by ±1 per step. This gives 6 possible directions, analogous to diagonal movement in standard checkers.

- **Red** moves to increase coordinate sum (away from origin).
- **Black** moves to decrease coordinate sum (toward origin).
- **Kings** can move in both directions.

### Capture

Jump over an adjacent enemy piece to an empty square beyond it, removing the captured piece — standard checkers jump mechanics extended to 4D.

### Promotion

- **Red** promotes to King when reaching Sum ≥ 8.
- **Black** promotes to King when reaching Sum ≤ 0.

## File Structure

```text
4d_checkers/
├── index.html              # Game entry point (premium dark UI)
├── js/
│   ├── quadray.js          # 4D tetrahedral coordinates
│   ├── checkers_board.js   # Board logic, pieces, move generation
│   ├── checkers_game.js    # Game controller & interaction
│   └── checkers_renderer.js# Canvas 3D rendering & HUD
├── tests/
│   ├── test_checkers.js    # Node.js unit tests (11 tests)
│   └── test.html           # Browser test runner
├── README.md               # ← You are here
└── AGENTS.md               # Agent coding instructions
```

## Tests

```bash
# Run all tests
node tests/test_checkers.js

# Expected output:
# ✅ PASSED: Board should have pieces
# ✅ PASSED: Should have Red pieces
# ✅ PASSED: Origin should have Red piece
# ✅ PASSED: Piece at origin should have moves
# ✅ PASSED: Should serve move to (1,1,0,0)
# ✅ PASSED: Should have a capture move
# ✅ PASSED: Capture target should be (2,2,0,0)
# ✅ PASSED: Start should be empty
# ✅ PASSED: Target should be occupied
# ✅ PASSED: Captured piece should be gone
# ✅ PASSED: Piece should promote to King at Sum >= 8
# All tests completed!
```

Or open `tests/test.html` in a browser for in-browser verification.

## Controls

| Action | Input |
|--------|-------|
| Select piece | Click on your piece |
| Move | Click a green indicator |
| Capture | Click a red-haloed indicator |
| Rotate view | Shift + drag |
| New game | Click "↻ New Game" button |

## Technical Details

- **Rendering**: HTML5 Canvas with perspective projection
- **Coordinate System**: Quadray (a, b, c, d) with zero-minimum normalization
- **Module Pattern**: Browser globals + CommonJS dual export

---

*Part of the [QuadCraft](../../) project — Exploring 4D tetrahedral geometry through interactive applications.*
