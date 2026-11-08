# Native Vertex buffers and heuristic chunk meshing

[Mesh.h](Mesh.h) defines `Vertex { Vector3 position, normal, color; float texCoordU, texCoordV; }`. `Mesh::create(const std::vector<Vertex>&, const std::vector<unsigned int>&)` uploads data; `render() const` and `render(int) const` draw it. `isInitialized`, vertex/index counts and the destructor manage/query GPU state. There are no public `upload/bind/draw/clear` methods.

[ChunkMesher.cpp](ChunkMesher.cpp) creates a mesh from non-air elements, offsets local vertices by the Cartesian chunk origin, applies a small inward inset, assigns per-face vertex colors and emits three separate vertices per rendered triangle. It does not share vertices or batch by texture. Texture coordinates are currently unused zeros.

Face visibility queries the world through reflected-neighbor positions and air/transparent flags. This is a prototype heuristic: element vertex offsets are not regular and face indexing/reflection does not prove a consistent tessellation. Normal direction correction is not a proof of triangle winding correctness. The element processing guard can truncate large chunks. Dirty regeneration is budgeted by Game, including invalidation on camera movement; there is no demonstrated sub-10ms guarantee.
