# Quadray Chess rules — actual turns, captures and limitations

This is a local chess-inspired variant, not an implementation of every orthodox chess rule. [Piece movement](piece-movement.md) describes the source’s directed pseudo-legal moves.

## Board

`Board(4)` enumerates canonical zero-minimum positions with each normalized component ≤4. Physical coordinates are rank three modulo common offset, not 5^4 independent physical slots. Bounds differ from games using exclusive `[0,size)` raw extents. The prescribed setup has twelve pieces per side; its Black knight at `(0,5,0,0)` lies beyond the default declared board extent, so the setup should not be described as uniformly in bounds.

## Pieces

Each side starts with a king, queen, two rooks, two bishops, two knights and four pawns. White starts; the controller advances its TurnManager after a selected move. Capturing removes the enemy at the destination and adds it to the capturer’s captured-piece list.

## Movement Rules

| Piece | Generated offsets |
| --- | --- |
| King | One positive basis step |
| Rook | Positive single-basis slides |
| Bishop | Positive two-basis-pair slides |
| Queen | Rook plus Bishop destinations |
| Knight | Twelve ordered positive +2/+1 offsets |
| Pawn | White +A / Black +B advance; forward-plus-other-axis captures |

Bounds/occupancy reduce the available destinations. Sliders do not pass through occupied points. There is no castling, en passant or promotion. The piece generators do not exclude moves leaving one’s own king in check.

## Winning Conditions

After a move, the controller computes the next player’s check flag and whether any generated moves exist. With no moves it announces checkmate if checked, otherwise stalemate. It can also end play on king capture. Because `hasLegalMoves` counts pseudo-legal destinations, these labels do not certify orthodox checkmate/stalemate correctness.

## Controls

Click an own piece and then a highlighted destination. Keys 1–9 select the first displayed choices; Escape deselects. Space/M chooses a random move and A toggles interval-driven random autoplay. R/N reset; Shift+drag rotates; wheel or +/− zooms. P stops/restarts the shared display loop, but click/key actions and autoplay are not uniformly pause-gated.

S/L and the Save/Load buttons expose legacy persistence code; see [notation and record compatibility](notation.md), not a guaranteed restore workflow. The selected-piece camera is a second projected view, not movement in an extra physical dimension.

## Strategy Tips

Inspect actual highlighted moves and blockers; do not assume familiar reciprocal rook/king directions, standard promotion races or established mating patterns. [Strategy/readout notes](chess-theory.md) are exploratory, not a solved or measured-strength theory.

[Game guide](../README.md) · [Quadray mathematics](quadray-math.md) · [Tests](../tests/README.md).
