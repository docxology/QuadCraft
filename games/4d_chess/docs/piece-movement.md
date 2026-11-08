# Quadray Chess piece movement — directed pseudo-legal destinations

Source: [chess_pieces.js](../js/chess_pieces.js). [Board bounds and keys](../js/chess_board.js) and the [geometry contract](quadray-math.md) determine whether generated positions refer to occupied/in-bounds physical points.

## Movement Fundamentals

`Quadray.BASIS` contains A, B, C and D. Adding an offset normalizes its result. The default board accepts normalized components from 0 through `size` inclusive; slider distance is capped by `board.maxDistance` (`size*2`). These are directed rules: a negative basis step is equivalent to three positive basis steps together, not to one of the king’s four positive steps.

Own-occupied destinations are excluded. Sliders stop at the first occupied point, allowing an enemy capture but not passage through it. These generated moves are **pseudo-legal**: no simulation filters moves that leave the mover’s king in check.

## King

Adds each positive basis vector once: four candidate destinations before bounds/occupancy checks. It does not generate eight signed basis directions or perform attacked-square/self-check exclusion. Castling is absent.

## Rook

Slides by positive multiples of each of the four basis vectors, up to the board’s distance cap, stopping at bounds or a blocker.

## Bishop

Slides along the six positive pair sums: A+B, A+C, A+D, B+C, B+D and C+D. Both coefficients of the pair increase together before normalization; this is not arbitrary signed four-axis diagonal movement.

## Queen

Concatenates Rook and Bishop destinations. It has no separate all-axis/hyperdiagonal generator.

## Knight

For every ordered pair of distinct basis indices, adds `2*BASIS[i] + BASIS[j]`: twelve candidate offsets before bounds/own-occupancy filtering. Intermediate occupancy is not tested. Do not describe 24 signed jumps or import a standard-board knight-tour result.

## Pawn

White advances along +A; Black along +B. A single forward step requires an empty destination. If `hasMoved` is false, a two-step advance is allowed only when both intermediate and final points are empty and in bounds. Captures add the forward basis plus one of the other three bases and require an enemy on that destination.

There is no promotion, en passant or automatic color-dependent negative-axis move. `Board.movePiece` sets `hasMoved` after any move.

## Valid Move Calculation

`piece.getValidMoves(board)` generates destinations. `Board.movePiece(from,to)` is the lower-level mutator and does not validate turn, movement pattern or self-check; normal UI selection supplies generated moves. `Board.isInCheck(color)` asks whether an opposing generated destination matches the king, which is distinct from enforcing orthodox legal moves.

For an isolated rule example, clear a board and place a piece explicitly rather than assume the default arrangement leaves a destination unoccupied. For interactive exploration, select a piece and inspect the highlighted destinations; numbered buttons show only the first nine choices.

[Game rules](game-rules.md) · [Strategy and metrics](chess-theory.md) · [API reference](api-reference.md).
