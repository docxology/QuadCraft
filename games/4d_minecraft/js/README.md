# 4D Minecraft JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`minecraft_board.js`](minecraft_board.js) | `MinecraftBoard` | Board state and game rules |
| [`minecraft_renderer.js`](minecraft_renderer.js) | `MinecraftRenderer` | Canvas projection and drawing |
| [`minecraft_game.js`](minecraft_game.js) | `MinecraftGame` | Input, lifecycle and HUD |
| [`minecraft_analysis.js`](minecraft_analysis.js) | Analysis functions | Cached block statistics and shared identity checks |

## Game-specific interfaces

The board exports `BlockType` (not `BLOCK_TYPES`), `BLOCK_COLORS` and `BLOCK_NAMES`. `minecraft_analysis.js` exports `markAnalysisDirty()`, `getAnalysis(board)`, `computeAllAnalysis(board)` and analysis helpers; load it before the controller. Census and coordination use eight raw axis neighbors. The reported center is the equal-weight block-position mean; `calculateBoundingTetrahedron` actually uses a padded Cartesian bounding box. Tetravolume is the implementation’s per-stored-block weight `(1/sqrt(2))^3 * S3`, not the volume of a physical nonoverlapping block union. Fill uses raw `size^4`; distance statistics cap input at the first 200 blocks.

## Projection and interaction

`MinecraftRenderer` paints square block faces in stable back-to-front projected-scale order. Drawing, hover and `hitTest` use the same faces and reverse paint-order containment; outlines do not extend the selectable square. This is not first-person ray casting or tetrahedral face intersection.

Do not silently wire board physics into the analysis-only controller. Preserve raw block occupancy and face-based picking. External world edits must invalidate analysis with `markAnalysisDirty()`.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
