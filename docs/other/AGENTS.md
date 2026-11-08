# Historical Technical Discussions — Agent Guidelines

## Purpose

These maintained discussions retain historical filenames and useful section anchors. They are not immutable publications, implemented API specifications, or substitutes for source evidence.

## Guidelines

- Read the [canonical coordinate contract](../quadray_coordinates.md) and [mathematical reference](../mathematics/quadray_coordinates.md) before editing formulas.
- Physical quadrays have rank 3 with common-offset equivalence. Four coefficients are not four independent Euclidean axes; no fixed component sum is required.
- Match every conversion, metric, and unit claim to the declared embedding. Separate gauge normalization from physical rescaling and volume-unit choices.
- Correct false body text rather than adding a warning above it. Historical conclusions may be revised when they conflict with mathematics or source.
- Distinguish observed engine code, raw game-label conventions, historical external implementations, and unimplemented design proposals.
- Link current implementation claims to primary source such as [native coordinates](../../src/core/coordinate/Quadray.h), [native storage](../../src/core/world/TetraChunk.h), or [shared grid utilities](../../games/4d_generic/grid_utils.js).
- Do not infer a regular mesh, validated tessellation, performance benefit, or finished feature from a coordinate representation alone.
- Preserve filenames and useful anchors when feasible. Keep the [papers index](README.md) and [documentation navigation](../README.md) accurate.

## Note

The filenames are truncated legacy titles. Their continued presence does not certify the original text's correctness or publication status.
