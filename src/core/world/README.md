# Native sparse chunks and procedural terrain limits

[World.h](World.h) maps Cartesian integer chunk triples to `shared_ptr<TetraChunk>`. Chunk coordinates use floor division, including negative positions; `TetraChunk::CHUNK_SIZE` is 16 Cartesian units. Local element keys are normalized quadrays, not global chunk indices.

`World::getBlock/setBlock` convert world quadrays to chunk-local coordinates; `getOrCreateChunk`, `generateChunksAround`, `updateChunks`, `getDirtyChunks` and dirty marking manage the synchronous lifecycle. `TetraChunk::generate()` clears and regenerates procedural contents. Chunk unload/recreation is not persistent storage. See [canonical chunk lifecycle](../../../docs/development/chunk_system.md).

[TerrainGenerator.h](TerrainGenerator.h) samples an 8×8×8 Cartesian grid per chunk, derives five candidate centers per cell and chooses air/stone/dirt/grass/sand/water/ore with deterministic sine-based multioctave functions. Despite helper names/comments, this is not a seeded Perlin/simplex library or a biome system.

[TetrahedralElement.h](TetrahedralElement.h) stores position/material and uses fixed vertex offsets. Those offsets are not a regular tetrahedron, and the generated center arrangement plus reflected-neighbor heuristic is not a demonstrated face-to-face tessellation. `TetraChunk::getNeighbors` reflects center-to-face directions; mesh face visibility is therefore heuristic. Block flags are material metadata, not fluid dynamics or rigid-body simulation. Float hashing with epsilon equality also deserves care for arbitrary off-grid positions.
