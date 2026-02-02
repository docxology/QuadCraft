# Game Rules

How to play 4D Quadray Chess.

---

## Overview

4D Quadray Chess is a chess variant played in four-dimensional tetrahedral space. The game uses traditional chess pieces with movement rules adapted for the Quadray coordinate system.

---

## Board

- **Coordinates**: (a, b, c, d) where each component ranges from 0 to 4
- **Positions**: Normalized lattice points in 4D space
- **Visualization**: Projected to 3D for display

---

## Pieces

Each side starts with **12 pieces**:

| Piece | Count | Symbol |
|-------|-------|--------|
| King | 1 | ♔/♚ |
| Queen | 1 | ♕/♛ |
| Rooks | 2 | ♖/♜ |
| Bishops | 2 | ♗/♝ |
| Knights | 2 | ♘/♞ |
| Pawns | 4 | ♙/♟ |

---

## Movement Rules

### King ♔

Moves **1 step** in any of the four Quadray directions.

```
Available moves from any position:
  +a, +b, +c, +d (4 directions)
```

### Queen ♕

Combines **Rook + Bishop** movement. Can slide any distance along single axes or diagonals.

### Rook ♖

Slides **any distance** along a single Quadray axis.

```
Movement along one axis:
  +na, -na, +nb, -nb, +nc, -nc, +nd, -nd
  (where n = 1, 2, 3, ...)
```

### Bishop ♗

Moves **diagonally** where two axes change simultaneously.

```
Example diagonal movements:
  +a+b, +a-b, +a+c, +a-c, +a+d, +a-d
  +b+c, +b-c, +b+d, +b-d
  +c+d, +c-d
  (6 diagonal directions)
```

### Knight ♘

Moves in **L-shape**: +2 in one axis, +1 in another.

```
Example knight moves:
  +2a+1b, +2a+1c, +2a+1d, +2b+1a, ...
  (12 possible directions)
```

### Pawn ♙

- **White pawns**: Advance along +a axis
- **Black pawns**: Advance along +b axis
- **Capture**: Diagonal movement (+a+c, +a+d for white)
- **Initial move**: Can move 2 squares forward

---

## Turn Order

1. **White** moves first
2. Players alternate turns
3. Must move on your turn (no passing)

---

## Winning Conditions

### Checkmate

The opponent's King is in check with no legal escape moves.

### King Capture

If a King is captured, that player loses immediately.

### Stalemate

If a player has no legal moves but is not in check, the game is a **draw**.

---

## Controls

| Action | Control |
|--------|---------|
| Select piece | Click on piece |
| Move | Click destination or press 1-9 |
| Random move | Space or M key |
| Auto-play | A key |
| Rotate view | Drag mouse |
| Zoom | Scroll wheel or +/- |
| Reset game | R key |
| Save game | Click 💾 button |
| Load game | Click 📂 button |

---

## Strategy Tips

1. **Control the center** - Central positions have more influence
2. **Develop pieces** - Get all pieces into active positions
3. **Watch all 4 axes** - Threats can come from any direction
4. **Use the Knight** - L-shaped moves are hard to block
5. **Coordinate pieces** - Combine piece movements for attacks

---

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Yellow ring | Selected piece |
| Green circles | Valid move destinations |
| Numbers | Move selection (1-9) |
| Purple highlight | Hovered position |

---

## FAQ

**Q: Why 4D?**
A: The Quadray coordinate system naturally extends to 4 dimensions, creating richer gameplay possibilities.

**Q: Is this harder than regular chess?**
A: The additional axis adds complexity, but the piece movements follow consistent rules.

**Q: Can I play against another person?**
A: Yes! Players take turns on the same screen, or use auto-play for AI demonstration.
