# API Reference

Complete documentation for all 4D Quadray Chess classes and methods.

---

## Quadray Class

**File**: `js/quadray.js`

4D tetrahedral coordinate representation.

### Constructor

```javascript
new Quadray(a = 0, b = 0, c = 0, d = 0)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| a | number | First component |
| b | number | Second component |
| c | number | Third component |
| d | number | Fourth component |

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `clone()` | Quadray | Create a copy |
| `normalized()` | Quadray | Zero-minimum normalization |
| `toCartesian()` | {x, y, z} | Convert to 3D coordinates |
| `length()` | number | Vector magnitude |
| `add(other)` | Quadray | Add two Quadrays |
| `subtract(other)` | Quadray | Subtract Quadrays |
| `scale(scalar)` | Quadray | Multiply by scalar |
| `distanceTo(other)` | number | Distance to another Quadray |
| `equals(other, epsilon)` | boolean | Check equality |
| `toString()` | string | Human-readable format |
| `toKey()` | string | Hash key for Maps |

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `Quadray.fromCartesian(x, y, z)` | Quadray | Create from 3D coords |
| `Quadray.distance(q1, q2)` | number | Distance between two |

### Static Properties

| Property | Value | Description |
|----------|-------|-------------|
| `Quadray.ORIGIN` | (0,0,0,0) | Origin point |
| `Quadray.A` | (1,0,0,0) | +a basis vector |
| `Quadray.B` | (0,1,0,0) | +b basis vector |
| `Quadray.C` | (0,0,1,0) | +c basis vector |
| `Quadray.D` | (0,0,0,1) | +d basis vector |
| `Quadray.BASIS` | Array | All 4 basis vectors |

---

## Piece Classes

**File**: `js/pieces.js`

### Base Class: Piece

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | PieceType enum value |
| `color` | string | PlayerColor enum value |
| `position` | Quadray | Current position |
| `hasMoved` | boolean | Has piece moved |

| Method | Returns | Description |
|--------|---------|-------------|
| `getValidMoves(board)` | Quadray[] | All valid destinations |
| `getSymbol()` | string | Unicode symbol |

### Piece Subclasses

| Class | Symbol (W/B) | Movement |
|-------|--------------|----------|
| King | ♔/♚ | 1 step in any basis direction |
| Queen | ♕/♛ | Rook + Bishop combined |
| Rook | ♖/♜ | Any distance along single axis |
| Bishop | ♗/♝ | Diagonal (2 axes change) |
| Knight | ♘/♞ | L-shape: +2 one axis, +1 another |
| Pawn | ♙/♟ | Forward along primary axis |

### Factory Function

```javascript
createPiece(type, color, position)
```

---

## Board Class

**File**: `js/board.js`

### Constructor

```javascript
new Board(size = 4)
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `size` | number | Board dimension |
| `pieces` | Map | Position key → Piece |
| `capturedPieces` | object | Captured by color |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setupInitialPosition()` | void | Reset to starting position |
| `placePiece(piece)` | void | Add piece to board |
| `getPieceAt(position)` | Piece\|null | Get piece at position |
| `isValidPosition(position)` | boolean | Check if in bounds |
| `hasOwnPiece(position, color)` | boolean | Own piece at position? |
| `hasEnemyPiece(position, color)` | boolean | Enemy at position? |
| `movePiece(from, to)` | Piece\|null | Move and return captured |
| `getPiecesByColor(color)` | Piece[] | All pieces of color |
| `getKing(color)` | Piece\|null | Find King |
| `isInCheck(color)` | boolean | Is King threatened? |
| `getAllPositions()` | Quadray[] | All valid board positions |
| `validateBoard()` | object | Validate piece counts/positions |

### Board Configuration

```javascript
BOARD_CONFIG = {
    TOTAL_PIECES_PER_SIDE: 12,
    TOTAL_PIECES: 24
}
```

---

## Game Class

**File**: `js/game.js`

### Constructor

```javascript
new Game(canvas)
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `board` | Board | Game board |
| `renderer` | Renderer | Visual renderer |
| `currentPlayer` | string | WHITE or BLACK |
| `selectedPiece` | Piece\|null | Currently selected |
| `gameOver` | boolean | Game ended? |
| `moveHistory` | Array | All moves made |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `selectPiece(piece)` | void | Select and show moves |
| `deselectPiece()` | void | Clear selection |
| `makeMove(from, to)` | void | Execute move |
| `selectMoveByNumber(num)` | void | Pick move 1-9 |
| `randomMove()` | void | Make random valid move |
| `resetGame()` | void | Reset to initial state |
| `toJSON()` | object | Serialize game state |
| `fromJSON(data)` | void | Restore game state |
| `exportGame()` | void | Download save file |
| `importGame()` | void | Load save file |

---

## Renderer Class

**File**: `js/renderer.js`

Handles 3D visualization on HTML5 Canvas.

### Key Methods

| Method | Description |
|--------|-------------|
| `project(q)` | Convert Quadray to 2D screen coords |
| `render(currentPlayer)` | Main render loop |
| `getPositionAtScreen(x, y)` | Find position at pixel |

---

## Analysis Module

**File**: `js/analysis.js`

Geometric analysis and metrics.

| Function | Returns | Description |
|----------|---------|-------------|
| `calculateCenterControl(board, color)` | number | Center position control (0-100) |
| `calculateMobilityScore(board, color)` | number | Total available moves |
| `calculatePieceSpread(board, color)` | number | Positional distribution |
| `calculateMaterialScore(board, color)` | number | Sum of piece values |
| `getPositionMetrics(game)` | object | All metrics combined |
| `createMoveLog(game)` | object | Detailed move history |
| `logGameMetrics(game)` | object | Console-formatted metrics |
| `getDistanceStats(game)` | object | Move distance statistics |
| `angleBetweenQuadrays(q1, q2)` | number | Angle between two Quadrays (degrees) |
| `verifyRoundTrip(q)` | object | Test Quadray→Cartesian→Quadray accuracy |
| `verifyGeometricIdentities()` | object | Comprehensive IVM geometry verification |

---

## Storage Module

**File**: `js/storage.js`

Save/load functionality.

| Function | Description |
|----------|-------------|
| `exportGameState(game)` | Serialize to JSON |
| `importGameState(json, game)` | Restore from JSON |
| `downloadJSON(data, filename)` | Trigger file download |
