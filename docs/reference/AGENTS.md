# Reference - AI Agent Guidelines

## Purpose

Maintain source-bound terminology. The [canonical quadray contract](../quadray_coordinates.md) governs geometry and coordinate conventions; the [reference index](README.md) and [glossary](glossary.md) provide navigation and concise definitions. Follow the parent [documentation guidance](../AGENTS.md).

## Guidelines

1. Keep terms concise, group them by topic or initial letter, and preserve useful heading anchors.
2. Distinguish mathematical definitions, observed source behavior and conceptual gameplay/design vocabulary. A glossary entry must not invent a feature or API.
3. Physical quadrays have rank three modulo common offsets. Do not call them independent Euclidean 4D axes, vertex distances, or fixed-sum weights. Zero-minimum normalization is gauge selection, not unit-length normalization.
4. Separate native physical occupancy from raw game identities. [`World.h`](../../src/core/world/World.h) uses Cartesian chunk indices and chunk-local quadrays; [`TetraChunk.h`](../../src/core/world/TetraChunk.h) normalizes float keys with exact hashes and epsilon equality. This is not integer quantization. [`GridUtils.key`](../../games/4d_generic/grid_utils.js) retains raw labels; common-offset aliases can be distinct slots.
5. Distinguish lattice sites, navigation graphs, display models, screen markers and voxel boundaries. Not every integer quadray belongs to one FCC contact lattice, and not every statistic called a face/volume/center measures a physical solid.
6. Check actual formulas/callers, not comments alone. [`TetrahedralElement.h`](../../src/core/world/TetrahedralElement.h) supplies nonregular display offsets; [`minecraft_analysis.js`](../../games/4d_minecraft/js/minecraft_analysis.js) supplies model-specific counts and means; [`minecraft_renderer.js`](../../games/4d_minecraft/js/minecraft_renderer.js) paints screen-space square markers.
7. Link scale-dependent volume and inverse details to the canonical documentation instead of asserting universal package-independent constants or rounding policies.

## Related Documentation

[Canonical quadrays](../quadray_coordinates.md) · [Glossary](glossary.md) · [UI surfaces](../ui/user_interface.md) · [Documentation index](../README.md)
