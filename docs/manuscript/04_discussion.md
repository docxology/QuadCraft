# Discussion

Common-offset equivalence permits a change of coefficients without moving
the physical point. Cartesian conversion and floor division determine the
chunk key before chunk-local conversion determines the element key. Code
that crosses this interface should preserve both the Cartesian key
policy and the distinction between world-space and chunk-local coordinates.

The tested points avoid exact floating-point chunk boundaries. They also
use native physical coordinates, so this study does not extend to raw
four-index slots in portfolio games. The fixture and existing native
logic tests yield no measurements of graphics throughput, browser
input, or general game behavior.
