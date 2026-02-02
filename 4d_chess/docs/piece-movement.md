# Piece Movement Deep Dive

Comprehensive guide to how each piece moves in 4D Quadray space.

---

## Movement Fundamentals

### The Four Axes

All movement in 4D Quadray Chess occurs along four tetrahedral axes:

| Axis | Direction | Color Code |
|------|-----------|------------|
| **a** | Quadray (1,0,0,0) | Red |
| **b** | Quadray (0,1,0,0) | Green |
| **c** | Quadray (0,0,1,0) | Blue |
| **d** | Quadray (0,0,0,1) | Yellow |

### Movement Types

| Type | Description | Used By |
|------|-------------|---------|
| **Single-axis** | One axis changes | Rook, King |
| **Diagonal** | Two axes change together | Bishop, King (partial) |
| **L-shape** | +2 one axis, +1 another | Knight |
| **Sliding** | Any distance along path | Rook, Bishop, Queen |
| **Stepping** | Exactly 1 unit | King |

---

## King ♔

### Movement Pattern

The King moves **exactly 1 step** in any of the four basis directions.

```
From position (a, b, c, d), King can move to:
- (a+1, b, c, d)  →  +a direction
- (a, b+1, c, d)  →  +b direction
- (a, b, c+1, d)  →  +c direction
- (a, b, c, d+1)  →  +d direction
```

### Visualization

```
         (+a)
          ●
          |
    (+b)──K──(+d)
          |
         (+c)
         
4 possible moves from any position
```

### Special Rules

- Cannot move into check
- Cannot move to position occupied by own piece
- Can capture enemy pieces by moving to their position
- No castling in 4D (would require different rule adaptation)

### Strategic Notes

- In the opening/middlegame: Keep protected, minimize movement
- In the endgame: Becomes an active piece, important for pawn support
- **Max mobility**: 4 moves (all axes available)
- **Min mobility**: 0 (if all directions blocked or lead to check)

---

## Queen ♕

### Movement Pattern

The Queen combines **Rook + Bishop** movement. She can:

1. Slide any distance along a single axis (Rook-like)
2. Slide any distance along diagonals (Bishop-like)

### Single-Axis Movement (Rook-like)

```
Axis moves:
- ±na: (a±n, b, c, d) for n = 1, 2, 3...
- ±nb: (a, b±n, c, d)
- ±nc: (a, b, c±n, d)
- ±nd: (a, b, c, d±n)
```

### Diagonal Movement (Bishop-like)

```
Two axes change by same amount:
- ±a±b: (a±n, b±n, c, d)
- ±a±c: (a±n, b, c±n, d)
- ±a±d: (a±n, b, c, d±n)
- ±b±c: (a, b±n, c±n, d)
- ±b±d: (a, b±n, c, d±n)
- ±c±d: (a, b, c±n, d±n)

6 diagonal planes × 2 directions each = 12 diagonal directions
```

### Strategic Notes

- Most powerful piece (value: 8 points)
- Controls both axis lines and diagonal planes
- Best on open boards with clear lines of sight
- Early development risky (can be harassed by minor pieces)
- **Max directions**: 16 (4 axes × 2 + 6 diagonals × 2)

---

## Rook ♖

### Movement Pattern

The Rook slides any distance along a **single axis**.

```
From position (a, b, c, d):

+a direction: (a+1,b,c,d), (a+2,b,c,d), (a+3,b,c,d)...
-a direction: (a-1,b,c,d), (a-2,b,c,d)... (until a=0)
+b direction: (a,b+1,c,d), (a,b+2,c,d), (a,b+3,c,d)...
-b direction: (a,b-1,c,d), (a,b-2,c,d)...
+c direction: (a,b,c+1,d), (a,b,c+2,d)...
-c direction: (a,b,c-1,d)...
+d direction: (a,b,c,d+1), (a,b,c,d+2)...
-d direction: (a,b,c,d-1)...
```

### Visualization

```
     (+a)
      |
      ●
      |
(−b)──R──(+b)
      |
      ●
      |
     (−a)
     
Plus +c, -c, +d, -d (not shown in 2D projection)
```

### Blocking

The Rook cannot jump over pieces:

- Stops at the square before a friendly piece
- Can capture an enemy piece by moving to its square
- Path must be clear

### Strategic Notes

- Value: 4 points
- Strongest on open axes (no pawns blocking)
- Pair of Rooks ("doubled Rooks") control entire axis
- Excellent for endgame play
- **Max squares**: Limited by board size and blocking pieces

---

## Bishop ♗

### Movement Pattern

The Bishop slides diagonally, where **two axes change by equal amounts**.

```
Diagonal planes (6 total):
- a-b plane: (a±n, b±n, c, d)  →  4 directions
- a-c plane: (a±n, b, c±n, d)  →  4 directions
- a-d plane: (a±n, b, c, d±n)  →  4 directions
- b-c plane: (a, b±n, c±n, d)  →  4 directions
- b-d plane: (a, b±n, c, d±n)  →  4 directions
- c-d plane: (a, b, c±n, d±n)  →  4 directions
```

### Diagonal Directions

Each plane offers 4 diagonal directions:

```
a-b plane example:
- (+a, +b): (a+n, b+n, c, d)
- (+a, -b): (a+n, b-n, c, d)  
- (-a, +b): (a-n, b+n, c, d)
- (-a, -b): (a-n, b-n, c, d)
```

### Strategic Notes

- Value: 3 points
- Each Bishop accesses specific diagonal "colors"
- Two Bishops cover different diagonal networks
- Strong in open positions with long diagonals
- Best when controlling multiple diagonal lanes

---

## Knight ♘

### Movement Pattern

The Knight moves in an **L-shape**: +2 in one axis, +1 in a perpendicular axis.

```
L-shape pattern:
- Move 2 units along one axis
- Move 1 unit along a different axis

From (a, b, c, d):
(a+2, b+1, c, d), (a+2, b-1, c, d)
(a+2, b, c+1, d), (a+2, b, c-1, d)
(a+2, b, c, d+1), (a+2, b, c, d-1)
(a-2, b+1, c, d), (a-2, b-1, c, d)
... etc for all axis combinations
```

### Complete Move List

The Knight has access to **24 unique move patterns** in 4D:

| Primary Axis | Secondary Axis | Moves |
|--------------|----------------|-------|
| ±2a | ±1b, ±1c, ±1d | 6 |
| ±2b | ±1a, ±1c, ±1d | 6 |
| ±2c | ±1a, ±1b, ±1d | 6 |
| ±2d | ±1a, ±1b, ±1c | 6 |

### Special Properties

- **Jumping**: Knights can jump over other pieces
- **Alternating squares**: Like traditional chess, Knights alternate between "colors"
- **No blocking**: The only piece that ignores intervening pieces
- **Fork potential**: High due to 24 move directions

### Strategic Notes

- Value: 4 points (higher than traditional due to 4D power)
- Excellent for forks and unexpected attacks
- Strong in closed positions (can jump blockers)
- Best when centralized (more moves available)
- Hard to trap due to jumping ability

### Move Count by Position

| Position Type | Typical Moves |
|---------------|---------------|
| Center | 11-16 moves |
| Near edge | 6-10 moves |
| Corner | 3-6 moves |

---

## Pawn ♙

### Movement Pattern

Pawns have the most restrictive yet consequential movement.

#### Forward Movement

- **White pawns**: Advance along **+a** axis
- **Black pawns**: Advance along **+b** axis

```
White Pawn at (a, b, c, d):
- Normal move: (a+1, b, c, d)
- Initial double: (a+2, b, c, d) if not moved

Black Pawn at (a, b, c, d):
- Normal move: (a, b+1, c, d)
- Initial double: (a, b+2, c, d) if not moved
```

#### Capture Movement

Pawns capture diagonally:

```
White Pawn captures:
- (a+1, b, c+1, d) - diagonal in a-c plane
- (a+1, b, c, d+1) - diagonal in a-d plane

Black Pawn captures:
- (a, b+1, c+1, d) - diagonal in b-c plane
- (a, b+1, c, d+1) - diagonal in b-d plane
```

### Promotion

When a pawn reaches the far edge of its advancement axis:

- **White**: Promotes at high a-coordinate (edge of board)
- **Black**: Promotes at high b-coordinate

Promotion choices:

- Queen (most common)
- Rook
- Bishop
- Knight

### Special Rules

- **Cannot move backward**: Pawns only advance
- **Cannot capture forward**: Only diagonal captures
- **En passant**: Not implemented in current version

### Strategic Notes

- Value: 1 point (base unit)
- **Passed pawns**: Extremely valuable (no enemy pawn can block)
- **Pawn chains**: Connected pawns defend each other
- **Promotion threat**: A pawn approaching promotion demands attention
- Key for controlling space and creating structure

---

## Movement Comparison Table

| Piece | Directions | Max Range | Jumps? | Slides? |
|-------|------------|-----------|--------|---------|
| King | 4 | 1 square | No | No |
| Queen | 16 | Board edge | No | Yes |
| Rook | 8 | Board edge | No | Yes |
| Bishop | 24 | Board edge | No | Yes |
| Knight | 24 | Fixed L-shape | Yes | No |
| Pawn | 1-2 | 1 (or 2 initial) | No | No |

---

## Valid Move Calculation

The game calculates valid moves in `pieces.js`:

```javascript
class Piece {
    getValidMoves(board) {
        // 1. Generate all candidate moves based on piece type
        // 2. Filter by board boundaries
        // 3. Remove moves blocked by own pieces
        // 4. For sliding pieces, stop at first blocking piece
        // 5. Add captures of enemy pieces
        return validMoves;
    }
}
```

### Board Validation

```javascript
board.isValidPosition(position)
// Returns true if position is within board boundaries
// Coordinates must be: 0 ≤ a, b, c, d ≤ board.size
```

---

## Interactive Testing

When playing, select a piece to see its valid moves:

1. Click on a piece
2. Green circles appear at valid destinations
3. Numbers 1-9 label the first 9 moves
4. Math panel shows selected piece coordinates

---

## Further Reading

- [Game Rules](game-rules.md) - Complete rules reference
- [Chess Theory](chess-theory.md) - Strategy guide
- [Quadray Math](quadray-math.md) - Coordinate system details
- [API Reference](api-reference.md) - Code documentation
