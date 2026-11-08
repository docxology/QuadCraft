# Experimental paintbrush masks and offset composition

[Development index](README.md) · [JavaScript map](javascript_implementation.md) · [Evaluation safety](realtime_code_evaluation.md)

## Brush data in the newer geometry experiment

[`src/browser/index.html`](../../src/browser/index.html) defines a `paintbrushes` object and these bit flags:

| Flag | Value | Target |
|---|---:|---|
| `PB_OTHER` | 1 | Special-case marker; not a generic callback framework |
| `PB_TETZ` | 2 | Z tetrahedra |
| `PB_OCT` | 4 | Octahedra |
| `PB_TETC` | 8 | C tetrahedra |
| `PB_BALL` | 16 | Balls |

A normal brush has `{mask, quads}`: a target mask and a list of quadray offsets. Existing names include `oneBall`, `oneOctahedron`, `oneTetrahedronZ`, `oneTetrahedronC`, `bothTets`, line repeats and `distance0To1_13Balls`. These are page-local structures, not native block templates or a shared portfolio editor API.

## Selection is a Minkowski sum, not a union

The `<select id="paintbrushSelect" multiple>` UI feeds `getSelectedBrushes()`, `buildBrushFromBrushes()` and `recomputeBrushFromSelect()`. The global `Brush` holds the result.

`mergeBrushes(a,b)` ORs masks and constructs **all pairwise sums** of offsets. It deduplicates by reference through a `Set` (the local `Q()` factory interns quadrays), then sorts coefficients lexicographically. Multiple selections therefore compose larger patterns through Minkowski sums; they do not simply append the selected shapes. Two brushes with m and n offsets can generate m*n candidate sums before deduplication.

The interned-object assumption belongs to this HTML implementation. A `Set` of fresh `games/4d_generic/Quadray` objects would not automatically deduplicate equal coordinates.

## Applying a brush

`paint(q, brush, isPaintElseUnpaint)` adds each offset to the target and dispatches by mask. Balls use `AddBall`/`RemBall`, which select `CCPBallGrid` or `QBalls` based on the page option. Tetrahedra/octahedra use their respective add functions.

**Removal is incomplete for non-ball shapes in this page**: the octahedron/C/Z unpaint branches log warnings rather than removing geometry. The function-based brush callback path is commented out. There is no general transaction, undo/redo history, flood-fill tool or safe user-defined procedural brush runtime.

`paintOrUnpaint(isPaint)` applies the selected `Brush` at `targetQ()`. Keyboard backtick/1 and the gamepad bumpers trigger it; held polling can apply repeatedly. The page draws an outline preview, but that preview is not proof that every masked operation supports both paint and unpaint.

## Source-level pattern editing

To change a pattern, edit the existing `paintbrushes` table using the local `Q`/`Directions` conventions and populate/recompute the selection as the page does. Avoid copying the portfolio's differently shaped `Quadray` API into this table. See [CCP grid limits](ccp_ball_grid_system.md) for ball storage and snapping.

The textarea/eval button is a separate trusted debugging facility. It provides neither a procedural-brush schema nor a sandbox; read [live evaluation](realtime_code_evaluation.md) before using it.

## Retained design considerations

An eventual editor would need reversible edits for every supported shape, bounded pattern expansion, explicit raw/physical coordinate semantics and persistence of brush definitions. Preview, batching and caching are useful design categories, but no fictitious `PaintbrushManager`, history class or noise generator is required to understand the current source.
