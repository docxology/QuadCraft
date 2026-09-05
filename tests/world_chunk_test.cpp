// World chunk-key tests.
//
// Regression coverage for the canonical chunk key space: chunk (cx, cy, cz)
// is the world-space Cartesian cube [cx*CHUNK_SIZE, (cx+1)*CHUNK_SIZE).
// Every chunk-creation and lookup path must use these keys — quadray
// positions are converted with toCartesian() and floored via
// World::worldToChunkCoords() first. Chunk-local element keys are an
// implementation detail behind World::getBlock/setBlock and
// TetraChunk::worldToChunkSpace/chunkToWorldSpace.

#include "../src/core/world/World.h"
#include "../src/core/world/TetraChunk.h"

#include <cmath>
#include <cstdio>

using namespace QuadCraft;
namespace {

int failures = 0;

void expectTrue(bool condition, const char* what) {
    if (!condition) {
        std::printf("FAIL: %s\n", what);
        ++failures;
    }
}

void expectNear(float actual, float expected, float eps, const char* what) {
    if (!(std::fabs(actual - expected) <= eps)) {
        std::printf("FAIL: %s — expected %g, got %g\n", what,
                    static_cast<double>(expected), static_cast<double>(actual));
        ++failures;
    }
}

// generateChunksAround must key the generated chunk on the Cartesian grid.
// Center at Cartesian (5, 20, 5) is in chunk (0, 1, 0); the pre-unification
// quadray-a/b/c keying would have created chunk (1, 0, 0) instead.
void testGenerationUsesCartesianKeys() {
    World world;
    world.generateChunksAround(QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(5.0f, 20.0f, 5.0f)), 0);
    expectTrue(world.hasChunk(0, 1, 0), "radius-0 generation creates Cartesian chunk (0,1,0)");
    expectTrue(!world.hasChunk(1, 0, 0), "radius-0 generation does not create quadray-keyed chunk (1,0,0)");
}

// Radius-1 generation around the origin creates the center chunk plus its six
// Cartesian face neighbors (sphere cutoff), and nothing else.
void testGenerationRadiusOne() {
    World world;
    world.generateChunksAround(QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(0.0f, 0.0f, 0.0f)), 1);
    expectTrue(world.getChunks().size() == 7, "radius-1 generation creates 7 chunks (center + 6 neighbors)");
    expectTrue(world.hasChunk(0, 0, 0), "center chunk exists");
    expectTrue(world.hasChunk(1, 0, 0) && world.hasChunk(-1, 0, 0), "x neighbors exist");
    expectTrue(world.hasChunk(0, 1, 0) && world.hasChunk(0, -1, 0), "y neighbors exist");
    expectTrue(world.hasChunk(0, 0, 1) && world.hasChunk(0, 0, -1), "z neighbors exist");
    expectTrue(!world.hasChunk(1, 1, 0), "diagonal chunk outside radius not created");
}

// setBlock/getBlock must roundtrip through the world regardless of which
// Cartesian chunk the position falls in, and must not leak to other positions.
void testBlockRoundtrip() {
    World world;
    QuadCraft::Quadray p = QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(20.0f, 5.0f, 5.0f));
    world.setBlock(p, QuadCraft::Block::STONE_BLOCK);
    expectTrue(world.getBlock(p) == QuadCraft::Block::STONE_BLOCK, "set/get roundtrip at (20,5,5)");
    expectTrue(world.hasChunk(1, 0, 0), "setBlock created Cartesian chunk (1,0,0)");

    QuadCraft::Quadray q = QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(21.0f, 5.0f, 5.0f));
    expectTrue(world.getBlock(q) == QuadCraft::Block::AIR_BLOCK, "adjacent position reads air");

    // Negative coordinates must floor correctly (chunk (-2,0,0) for x=-20).
    QuadCraft::Quadray n = QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(-20.0f, 5.0f, 5.0f));
    world.setBlock(n, QuadCraft::Block::DIRT_BLOCK);
    expectTrue(world.getBlock(n) == QuadCraft::Block::DIRT_BLOCK, "set/get roundtrip at (-20,5,5)");
    expectTrue(world.hasChunk(-2, 0, 0), "negative coordinates floor to chunk (-2,0,0)");
}

// Chunk center must be the center of the chunk's Cartesian cube.
void testChunkCenter() {
    QuadCraft::TetraChunk chunk(1, 0, 0);
    QuadCraft::Vector3 c = chunk.getCenter();
    expectNear(c.x, 24.0f, 1e-4f, "chunk (1,0,0) center x");
    expectNear(c.y, 8.0f, 1e-4f, "chunk (1,0,0) center y");
    expectNear(c.z, 8.0f, 1e-4f, "chunk (1,0,0) center z");
}

// Local <-> world coordinate conversion must roundtrip inside the chunk.
void testLocalWorldRoundtrip() {
    QuadCraft::TetraChunk chunk(1, 0, 0);
    QuadCraft::Quadray p = QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(20.0f, 5.0f, 5.0f));
    QuadCraft::Quadray local = chunk.worldToChunkSpace(p);
    QuadCraft::Vector3 back = chunk.chunkToWorldSpace(local).toCartesian();
    expectNear(back.x, 20.0f, 1e-3f, "world->local->world x");
    expectNear(back.y, 5.0f, 1e-3f, "world->local->world y");
    expectNear(back.z, 5.0f, 1e-3f, "world->local->world z");
}

} // namespace

int main() {
    testGenerationUsesCartesianKeys();
    testGenerationRadiusOne();
    testBlockRoundtrip();
    testChunkCenter();
    testLocalWorldRoundtrip();

    if (failures != 0) {
        std::printf("%d check(s) failed\n", failures);
        return 1;
    }
    std::printf("world_chunk_test: all checks passed\n");
    return 0;
}
