# Notation and Recording Games

How to record, analyze, and share 4D Quadray Chess games.

---

## Quadray Algebraic Notation (QAN)

4D Quadray Chess uses **Quadray Algebraic Notation** to record moves, analogous to traditional algebraic notation.

### Position Notation

Each position is written as a Quadray coordinate:

```
Format: (a,b,c,d)

Examples:
- (0,0,0,0) - Origin
- (1,0,0,0) - One step in +a direction
- (2,1,0,1) - Complex position
```

For brevity, positions can be written without parentheses:

```
Compact: 0000, 1000, 2101
```

### Move Notation

Basic move notation:

```
Format: [Piece][from] → [to]

Examples:
- N(0,0,1,1) → (2,1,1,1)   Knight moves
- Q(0,4,0,0) → (4,4,0,0)   Queen moves
- P(1,0,0,0) → (2,0,0,0)   Pawn advances
```

### Piece Symbols

| Piece | Symbol | Glyph |
|-------|--------|-------|
| King | K | ♔/♚ |
| Queen | Q | ♕/♛ |
| Rook | R | ♖/♜ |
| Bishop | B | ♗/♝ |
| Knight | N | ♘/♞ |
| Pawn | P (or omit) | ♙/♟ |

### Special Notation

| Symbol | Meaning | Example |
|--------|---------|---------|
| × | Capture | N(1,0,0,0) × (3,1,0,0) |
| + | Check | Q(2,2,0,0) → (4,4,0,0)+ |
| ++ | Double check | R(0,0,0,0) → (0,4,0,0)++ |
| # | Checkmate | Q(3,3,0,0) → (4,4,0,0)# |
| = | Stalemate | (draw) |
| 1-0 | White wins | |
| 0-1 | Black wins | |
| ½-½ | Draw | |

---

## Move Recording Example

### Sample Game

```
4D QUADRAY CHESS
White: Player1
Black: Player2
Date: 2026-02-01

1. N(0,0,1,1) → (2,1,1,1)    N(4,4,1,1) → (2,3,1,1)
2. B(0,0,2,0) → (2,2,2,0)    P(4,3,0,0) → (3,3,0,0)
3. Q(0,4,0,0) → (2,2,0,0)    B(4,4,0,2) → (2,2,0,2)
4. N(2,1,1,1) → (4,2,1,1)+   K(4,4,0,0) → (3,4,0,0)
5. Q(2,2,0,0) × (3,3,0,0)    R(4,4,2,0) → (4,2,2,0)
...
```

### Move List Format

For digital storage:

```json
{
  "moves": [
    {
      "moveNumber": 1,
      "white": {
        "piece": "knight",
        "from": {"a": 0, "b": 0, "c": 1, "d": 1},
        "to": {"a": 2, "b": 1, "c": 1, "d": 1},
        "capture": null
      },
      "black": {
        "piece": "knight",
        "from": {"a": 4, "b": 4, "c": 1, "d": 1},
        "to": {"a": 2, "b": 3, "c": 1, "d": 1},
        "capture": null
      }
    }
  ]
}
```

---

## Distance Notation

4D chess adds a unique element: **movement distance**. The game tracks Quadray distance for each move.

### Distance Formula

```
Distance = √((Δa² + Δb² + Δc² + Δd²) / 2)
```

### Recording Distances

Moves can include distance:

```
N(0,0,1,1) → (2,1,1,1) [d=1.58]
Q(0,4,0,0) → (4,4,0,0) [d=2.83]
```

---

## Game Analysis Notation

### Position Evaluation

| Symbol | Meaning |
|--------|---------|
| ⩲ | White has slight advantage |
| ⩱ | Black has slight advantage |
| ± | White has clear advantage |
| ∓ | Black has clear advantage |
| +- | White winning |
| -+ | Black winning |
| = | Equal position |
| ∞ | Unclear position |

### Move Quality

| Symbol | Meaning |
|--------|---------|
| ! | Good move |
| !! | Brilliant move |
| ? | Mistake |
| ?? | Blunder |
| !? | Interesting move |
| ?! | Dubious move |

### Commentary Example

```
4. N(2,1,1,1) → (4,2,1,1)+!!
   Brilliant knight check! Forces King to (3,4,0,0),
   opening the diagonal for the Queen attack.
   
   4... K(4,4,0,0) → (3,4,0,0)?
   Better was K(4,4,0,0) → (4,3,0,0), keeping
   axis options open.
```

---

## Import/Export Formats

### JSON Format (Native)

The game's native save format:

```json
{
  "version": "1.0",
  "timestamp": "2026-02-01T12:00:00Z",
  "currentPlayer": "white",
  "pieces": [
    {
      "type": "king",
      "color": "white",
      "position": {"a": 0, "b": 4, "c": 0, "d": 0},
      "hasMoved": true
    }
  ],
  "moveHistory": [
    {
      "from": {"a": 0, "b": 0, "c": 1, "d": 1},
      "to": {"a": 2, "b": 1, "c": 1, "d": 1},
      "captured": null
    }
  ]
}
```

### Exporting Games

1. Click 💾 **Save** button (or press **S**)
2. File downloads as `quadray-chess-2026-02-01T12-00-00.json`
3. Share file or store for later analysis

### Importing Games

1. Click 📂 **Load** button (or press **L**)
2. Select JSON save file
3. Game state restores to saved position

---

## Coordinate Reference Tables

### Basis Vectors

| Name | Quadray | Cartesian |
|------|---------|-----------|
| A | (1,0,0,0) | (0.707, 0.707, 0.707) |
| B | (0,1,0,0) | (-0.707, -0.707, 0.707) |
| C | (0,0,1,0) | (-0.707, 0.707, -0.707) |
| D | (0,0,0,1) | (0.707, -0.707, -0.707) |

### Common Positions

| Name | Quadray | Description |
|------|---------|-------------|
| Origin | (0,0,0,0) | Center of board |
| White Home | Low a-axis | Starting area |
| Black Home | Low b-axis | Starting area |
| Center | (2,2,x,x) | High-value positions |
| Edge | Any component = 4 | Board boundary |

---

## Analysis Tools

### In-Game Math Panel

The game displays real-time Quadray math:

```
📐 QUADRAY MATH
Selected: white knight
a = 2.00  b = 1.00  c = 1.00  d = 1.00
→ Cartesian: (0.71, 0.00, 0.00)
Distance from origin: 1.58 units
Valid moves: 11 positions
```

### Metrics from analysis.js

| Function | Returns | Use |
|----------|---------|-----|
| `getPositionMetrics(game)` | Object | All metrics summary |
| `calculateMaterialScore(board, color)` | Number | Piece value total |
| `calculateMobilityScore(board, color)` | Number | Available moves |
| `calculateCenterControl(board, color)` | Number | Center dominance |
| `calculatePieceSpread(board, color)` | Number | Position diversity |
| `getDistanceStats(game)` | Object | Move distance analysis |

### Verification Button

Click **🔬 Verify Math** in the sidebar to run geometric verification:

- Basis vector lengths
- Tetrahedral symmetry (109.47°)
- Round-trip conversion accuracy
- Distance formula validation

---

## Sharing Games

### Text Format

For forums/chat:

```
4D Quadray Chess Game
1. N0011-2111 N4411-2311
2. B0020-2220 P4300-3300
3. Q0400-2200 B4402-2202
...
Result: 1-0

Analysis: White's knight sacrifice on move 7 (N2200×3110)
created a decisive attack along the a-axis.
```

### URL Sharing

Future feature: Encode positions in URL parameters:

```
https://example.com/4dchess?pos=K0400.Q2200.R0000.R0040...
```

---

## Further Reading

- [Game Rules](game-rules.md) - How to play
- [Chess Theory](chess-theory.md) - Strategy guide
- [API Reference](api-reference.md) - Technical details
