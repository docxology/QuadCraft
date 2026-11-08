# Block Models: Native Elements, Raw Game Slots, and Brush Geometry

There is no single block runtime shared by every QuadCraft entrypoint. This page names the actual source contracts rather than inventing a universal material/behavior API.

[Design index](README.md) · [Coordinate contract](../quadray_coordinates.md) · [Geometry boundaries](../mathematics/tetrahedral_geometry.md) · [Controls](controls_and_navigation.md) · [World generation](world_generation.md).

## Tetrahedral Block Fundamentals

A quadray is a point/anchor, not a cell. The physical point identifies common-offset tuples, but a game can deliberately preserve raw tuple identity. A tetrahedron's four faces, an FCC point's 12 contacts, a screen marker and a stored block record are four different objects.

Regular tetrahedra alone do not fill Euclidean 3D space. Neither raw slot count nor parity labels demonstrate a space-filling tetrahedral-octahedral mesh.

## Native Block Types and Properties

[Block.h](../../src/core/world/Block.h) defines a 16-bit `BlockID` and fields `id`, `transparent`, `solid`, and `name`. Its registry starts with air, stone, dirt, grass, water, sand and ore. Water is transparent and nonsolid in that registry. `registerBlock(const Block&)` stores a record; unknown IDs resolve to air.

These are simple material flags, not implemented hardness, resistance, density, friction, restitution, luminance, crafting recipes, signal conduction or event handlers. A native water block flag does not create fluid simulation, and sand's name does not implement gravity.

## Tetrahedral Element Geometry

Native [TetrahedralElement](../../src/core/world/TetrahedralElement.h) stores normalized position and block ID, exposes four vertices and four triangular faces, and queries flags through the registry. It has no per-element orientation field, rotation API or point-containment method.

The current fixed offsets are not a regular tetrahedron and do not retain generation's cube-corner subdivision geometry. See the [explicit offsets and unequal-edge derivation](../mathematics/tetrahedral_geometry.md#tetrahedral-element-class). Do not assign ideal tetrahedral volume, face adjacency or packing guarantees to these meshes.

## Block Data Storage

Native [World](../../src/core/world/World.h) selects cubic Cartesian chunks, each of side 16. [TetraChunk](../../src/core/world/TetraChunk.h) stores only non-air elements under chunk-local normalized floating quadrays; air assignment erases a record and marks the chunk dirty. Exact component hashes coexist with an epsilon comparator, so this is not a proven general approximate-key scheme or integer palette compression. See [native occupancy limitations](../quadray_coordinates.md#native-world-occupancy).

[MinecraftBoard](../../games/4d_minecraft/js/minecraft_board.js) instead uses a `Map` of literal `GridUtils.key(a,b,c,d)` strings. Offsetting all four components can select a **different stored block** even though projection is unchanged. `getVisibleBlocks()` returns all stored records with a quadray and a parity label; its name does not mean exact 3D occlusion culling. Raw occupied count is not physical union volume.

## Portfolio Minecraft Block Types

| ID | Name | ID | Name |
| --- | --- | --- | --- |
| 0 | Air | 6 | Water |
| 1 | Stone | 7 | Sand |
| 2 | Dirt | 8 | Diamond |
| 3 | Grass | 9 | Planks |
| 4 | Wood | 10 | Glass |
| 5 | Leaves | | |

These names and colors come from Minecraft's own board module, not the native registry. Glass has a translucent renderer color. This does not imply light transmission simulation or material strength. Inventory is a per-type counter; initial stock and model recipes are visible in that source.

## Block Orientation — Game Parity Labels

The shared `Quadray.cellType()` returns `tetra`/`octa` according to the parity of the sum of separately rounded components. It supplies metadata, not a general block orientation model. It does not define four possible rotations, vertices, collision surfaces or a physical honeycomb. Integer common-offset changes preserve parity; arbitrary real shifts before component rounding need not. See [cell parity](../mathematics/ivm_synergetics.md#cell-parity).

The monolithic [browser painter](../../src/browser/index.html) separately has `PB_TETZ`, `PB_TETC`, `PB_OCT` and `PB_BALL` brush masks and corresponding geometry operations. Their existence there does not mean the portfolio's parity rule implements those brush shapes.

## Block Placement and Breaking

### Portfolio Minecraft

[MinecraftGame._bindMouse()](../../games/4d_minecraft/js/minecraft_game.js) calls screen-space `hitTest`. Plain left-click attempts `placeBlock(a,b,c+1,d)`; Alt+left-click calls `removeBlock(a,b,c,d)`. Shift-click and non-left buttons are ignored by that action handler.

`placeBlock` rejects occupied targets and depleted stock, writes the selected type, decrements its inventory count and increments the placement counter. `removeBlock` rejects air, erases the raw slot, returns the type to inventory and increments the removal counter. These methods do not enforce a component boundary or structural support test. Placement succeeds by model rules, not by proving face adjacency or collision-free geometry.

### Native Prototype

[Input](../../src/game/Input.h) samples a Cartesian ray into world-key queries. A hit allows left-button air assignment or right-button stone placement at the previous sample. That is not an exact triangle-face intersection, arbitrary selected-block inventory, timed mining or a guaranteed adjacent-cell construction.

## Block Rendering

Native [ChunkMesher](../../src/render/mesh/ChunkMesher.cpp) emits colored triangles with computed normals and candidate-neighbor visibility checks; texture coordinates are currently unused. Portfolio [MinecraftRenderer](../../games/4d_minecraft/js/minecraft_renderer.js) paints depth-ordered square markers and uses the same bounds for picking. Neither is evidence for shared texture atlases, physically propagated block lighting, recursive level of detail or a common GPU voxel pipeline.

## Block Updates and Ticking

Minecraft's board has callable `stepPhysics()` and `stepTime()` methods. Sand and water can move toward `c-1`; water can copy itself into qualifying bounded neighbors, using randomness to limit each spreading pass. This is discrete raw-label behavior, not a conservative volumetric fluid solver. Its neighbor helper minimum-normalizes targets, which is distinct from raw occupancy identity.

The ordinary [MinecraftGame.update()](../../games/4d_minecraft/js/minecraft_game.js) only refreshes analysis: it does not call board `update()`. Falling/spreading/time are therefore not automatically active in the default interactive loop. No shared scheduled/random block-tick framework is implied.

## Block Crafting and Processing

MinecraftBoard's callable `craft('planks')` consumes one wood and grants four planks; `craft('glass')` consumes one sand and grants one glass, returning success/failure. Default game keys do not invoke those recipes, but the [Minecraft page](../../games/4d_minecraft/index.html) supplies Craft Planks/Glass buttons that call them directly. This small implemented UI does not establish a common smelting system, heat model, recipe-registration service or industrial processing framework.

## Block API and Modding

The native registry and JavaScript board methods are actual source-level extension points with different signatures and state. They are not a stable plugin ABI or a universal modding SDK. Earlier diagrams of event-driven `Material`, `BlockType`, `TickManager`, machinery and portal classes were conceptual, not runnable APIs, and are not retained as implementation descriptions.

## Design Questions, Not Implemented Guarantees

A future block system would need explicit choices about canonical physical cells versus raw logical slots, validated cell geometry, face adjacency, inventory rules and activation of simulation. Structural collapse, redstone-like networks, ecology, weather response, general fluid mechanics and market economies are separate features, not consequences of tetrahedral coordinates. No balance, strength or rendering-speed advantage is asserted without measurement.
