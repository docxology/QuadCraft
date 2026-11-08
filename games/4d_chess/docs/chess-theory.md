# Quadray Chess strategy notes — directed moves and descriptive metrics

These are exploratory questions grounded in the current move generators, not proven openings, solved endgames or measured game balance. [Rules](game-rules.md) differ from orthodox chess, especially self-check, king capture and absent promotion.

## Fundamental Concepts

Positions use a rank-three tetrahedral embedding. Moves are directed and piece-specific: four positive king/rook axes, six positive bishop pairs and twelve ordered knight offsets. Bounds, normalization and blockers make the graph position-dependent. It is not a fixed collection of independent orthogonal axes, and an occupancy-dependent legal-move relation is not automatically a mathematical group.

Before evaluating a plan, inspect actual generated destinations and whether its claimed reverse move exists. A coordinate that looks central in raw coefficients is not necessarily a geometric centroid or a well-connected position.

## Piece Values and Material

[chess_analysis.js](../js/chess_analysis.js) uses these conventional heuristic weights: queen 9, rook 5, bishop 3, knight 3, pawn 1 and king 0. The zero king weight is accounting convention, not a claim that losing it is harmless. These weights have not been calibrated here as empirical values for the variant.

## Opening Principles

Useful inspection questions are: which pieces have generated moves, which own pieces block sliders, and which opponent destinations threaten a piece? Explore several basis/pair directions rather than assuming a standard e-pawn opening. The prescribed setup and directed rules require their own analysis; no opening book is shipped.

## Middlegame Strategy

Look for two valuable targets reachable by one piece, shared blockers and opportunities to increase generated mobility. Describe such patterns using concrete source-valid positions, not invented “hyperdiagonal” movement. Pin/skewer terminology is only an analogy when self-check is not enforced.

## Endgame Concepts

Do not transfer promotion races, reciprocal king opposition, standard mating tables or no-draw conclusions to this implementation. Pawns do not promote, king moves are directed and king capture can terminate play. A small-position search would need the exact implemented terminal conditions and move semantics; no tablebase is provided.

## Center Control Metrics

The actual position readouts are:

| Readout | Definition and limitation |
| --- | --- |
| Material | Sum of the fixed weights above |
| Mobility | Sum of each side’s generated destination counts, not self-check-filtered legal mobility |
| Center control | Mean `max(0,(4-distance)/4)*100` relative to fixed reference `(2,2,0,0)`; not a board-centroid or territory calculation |
| Spread | Mean pairwise physical distance between a side’s piece positions; not uniform-solid mass distribution or proven control |
| Check | Whether opposing generated moves reach the king |

These metrics are descriptions, not probabilities of winning. Move-history log/distance helpers still expect legacy flat records; see [notation](notation.md) for their incompatibility with the current controller.

## Further Reading

[Movement](piece-movement.md) · [Quadray mathematics](quadray-math.md) · [API reference](api-reference.md) · [Architecture](architecture.md).
