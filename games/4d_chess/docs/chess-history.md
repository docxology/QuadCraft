# Chess-variant context — what Quadray Chess does and does not extend

## Origins of Chess

The project borrows familiar piece names, alternating turns and capture terminology from chess. A detailed historical chronology is not needed to specify these software rules; historical claims should be checked against dedicated references rather than inferred from the game’s branding.

For historical study, the existing bibliography points to H. J. R. Murray’s *A History of Chess* and Marilyn Yalom’s *Birth of the Chess Queen*. They are background reading, not evidence for this implementation’s mathematical or gameplay claims.

## Dimensional Extensions of Chess

Conventional planar chess, layered/three-dimensional variants such as Raumschach, and hypothetical four-independent-index boards are different rule systems. A board’s number of stored labels, the dimension of its physical embedding and the complexity of its legal-move graph are distinct quantities. None alone establishes difficulty, strategic depth or learnability.

## The Quadray Innovation

Here “4D Quadray Chess” is a portfolio title. Four tetrahedral coefficients represent three-dimensional physical points modulo a common offset. The default chess board stores canonical physical positions and uses directed piece generators; it is not an independent four-dimensional Euclidean hypercube.

The implementation borrows IVM/Synergetics terminology, but chess piece moves do not all follow the shared twelve-neighbor FCC graph. No historical quotation, tessellation claim or universal natural-geometry advantage is required to explain the actual code. See [Quadray mathematics](quadray-math.md) and [movement rules](piece-movement.md).

## Mathematical Connections

A useful research representation is a directed graph: canonical board positions are vertices and a specified piece’s generated moves are edges, conditioned on occupancy. Knight tours, nonattacking queen placements, symmetry and reachability can be posed as questions on that exact graph. No tour existence, queen-placement bound, solved mate pattern or group structure is established by this documentation.

## Future Directions

Opening databases, endgame tables, stronger AI, network play, VR/AR and alternate pieces are research/design possibilities, not supported current features. The shipped autoplay is random local move selection, not a trained opponent or online matchmaking service. Evaluate any proposed extension against the current [rules](game-rules.md), especially pseudo-legal moves and legacy storage boundaries.

## References

- [Kirby Urner’s Quadray material](http://www.grunch.net/synergetics/quadrays.html)
- [Fuller’s Synergetics](http://www.rwgrayprojects.com/synergetics/synergetics.html)
- [QuadCraft source](https://github.com/docxology/QuadCraft)

[Strategy/readouts](chess-theory.md) · [Game rules](game-rules.md) · [Piece movement](piece-movement.md).
