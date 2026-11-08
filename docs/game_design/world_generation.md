# World Generation: Native Cartesian Sampling and Minecraft Raw Slots

The native prototype and portfolio Minecraft initialize different worlds. Neither implements the universal biome/template/plugin framework once described here. This page traces the actual development-checkout code; it contains no runtime or visual-validation receipt.

[Design index](README.md) · [Coordinate contract](../quadray_coordinates.md) · [Block storage](block_system.md) · [Geometry boundaries](../mathematics/tetrahedral_geometry.md).

## Terrain Generation Algorithm

### Native Prototype

[TetraChunk.generate()](../../src/core/world/TetraChunk.cpp) clears existing elements and invokes a static [TerrainGenerator](../../src/core/world/TerrainGenerator.h). The generator:

1. Samples an $8\times8\times8$ Cartesian grid inside each side-16 Cartesian chunk, giving sample-cube side 2.
2. Constructs each sample cube's eight corners and visits five hardcoded four-corner index groups.
3. Averages each group's four vertices to obtain an anchor.
4. Chooses a block type from Cartesian height and field values.
5. Converts a non-air anchor into chunk-local quadrays and stores its block ID.

Only anchors and IDs survive this process. The native rendered element uses separate fixed offsets; it does **not** retain each group's cube-corner vertices. Therefore the five groups do not establish a faithful rendered cube subdivision, nonoverlap or a space-filling regular tetrahedral honeycomb.

### Native Noise Generation

The method named `simplexNoise()` actually sums four sine terms, normalizes them, and returns a deterministic field. `fractalNoise()` combines repeated frequency/amplitude-scaled evaluations and maps the result to approximately `[0,1]`. It is not a Perlin or simplex-noise implementation despite older comments and names.

Defaults in the constructor include terrain scale 0.02, terrain amplitude 32, cave scale 0.1, cave threshold 0.7, four base octaves, persistence 0.5 and lacunarity 2. These are source configuration values, not measured optimal tuning ranges or a user settings UI. No seed parameter is exposed by this generator.

### Native Block Assignment

`determineBlockType` evaluates a base height field plus a mountain term, a three-octave cave field and a separate ore field. Below the terrain height, cave values can produce air; otherwise surface/subsurface/deep thresholds choose sand or grass, dirt, ore or stone. Above the surface but below Cartesian height 5 it can choose water. These are threshold rules, not a temperature/humidity biome classifier, fluid solver or ecology system.

## Chunk Management

[World](../../src/core/world/World.h) owns cubic **Cartesian** chunks. Each key is the floor of Cartesian position divided by `CHUNK_SIZE`, independently on each axis, including negative coordinates. Local quadrays come from subtracting that chunk's Cartesian origin and applying the continuous inverse.

`getChunk` creates an empty chunk if absent; `getOrCreateChunk` generates a newly created chunk. These operations are not interchangeable generation guarantees. Native update paths generate an approximate spherical neighborhood of chunk indices and may unload distant nonvisible chunks, with source-defined distance/height adjustments. This is native behavior, not a feature of Minecraft's board map. It does not establish persistent infinite worlds: there is no generation seed/persistence guarantee implied by these methods.

## Portfolio Minecraft Initial Terrain

[MinecraftBoard](../../games/4d_minecraft/js/minecraft_board.js) defaults to `size=8` and stores all blocks in one resident raw-key `Map`. `generateTerrain()` clears that map, then:

- Loops `a`, `b`, and `d` in `[0,size)` and `c` over 0, 1, 2.
- Fills `c=0` with stone and `c=1` with dirt.
- Adds grass at `c=2` when `Math.random() > 0.3` (70% probability per slot).
- Makes four random tree-placement attempts, with wood at `c=3..5` and a leaf neighborhood at `c=6`.
- Writes diamonds at `(3,3,0,3)` and `(4,4,0,4)`.
- Adds two sand records and one water record at fixed labels.

Tree attempts can overlap; four attempts are not a guarantee of four distinct trees. Leaf offsets are not bounds-checked, and fixed decorations do not adapt to every constructor size. `setBlock` and `placeBlock` also do not enforce `size` bounds. Thus `size=8` describes the initial sampling and helper bounds, **not a hard boundary on all stored records**. There is no chunk streaming or player-position-based world loading in this game.

`Math.random()` supplies grass/tree choices without an exposed seeded generation contract. Resetting does not reproduce an identical seed-controlled world.

## Raw Slots Versus Physical Cells

`GridUtils.key(a,b,c,d)` preserves the tuple literally. An integer common offset changes the storage label but leaves the projected point unchanged. Initial raw layers therefore must not be described as a unique physical voxelization. The nominal $\mathrm{size}^4$ label space differs from minimum-zero canonical point enumeration, which has $\mathrm{size}^4-(\mathrm{size}-1)^4$ points within the same component extent.

Some helper operations use minimum-normalized `GridUtils.neighbors()`, even while the board stores raw labels. This mixed convention matters when interpreting connectivity, fill percentage and aliasing; see the [canonical occupancy contract](../quadray_coordinates.md#usage-across-games).

## World Updates After Generation

The board exposes falling/spreading/time methods, but [MinecraftGame.update()](../../games/4d_minecraft/js/minecraft_game.js) only refreshes cached analysis. The [page's own animation callback](../../games/4d_minecraft/index.html) updates sidebar/status displays; it does not advance board physics/time. Consequently displayed time and a night-capable sky renderer do not establish a running day/night simulation in the default game.

Craft Planks and Craft Glass buttons on that page directly invoke the board's inventory conversions. Those are real UI actions, distinct from the inactive physics/time update path. See [block model methods](block_system.md#block-crafting-and-processing).

## Design Considerations, Not Implemented Systems

A future terrain design could choose reproducible seeded fields, explicit biome classification, structured feature placement and validated tetrahedral cells. Those choices would need to specify:

- Whether state belongs to canonical physical cells or independent raw game slots.
- The cell complex and shared-face rules, not just point coordinates.
- Which sampling scale and Euclidean or tetra-unit volumes are meant.
- How generation, modification and persistence interact across chunks.

L-systems, Voronoi regions, domain warping, climate blending, template adaptation, generation-event plugins and infinite saveable worlds are not supplied as current runnable APIs here. No `NoiseGenerator`, `BiomeGenerator`, `StructureGenerator` or plugin-hook recipe is implied by this discussion.

## Related Reading

- [Current gameplay boundaries](gameplay_overview.md)
- [IVM topology and volume accounting](../mathematics/ivm_synergetics.md)
- [Implementation architecture](../architecture.md)
- [Games portfolio](../games.md)
