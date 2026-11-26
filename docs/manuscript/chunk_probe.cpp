// A graphics-free witness for the manuscript's native chunk-routing figure.
#include "src/core/world/World.h"

#include <array>
#include <cmath>
#include <iostream>
#include <tuple>

int main() {
    using namespace QuadCraft;
    World world;
    constexpr float offset = 8.0f;
    constexpr float tolerance = 1e-4f;
    const std::array<Vector3, 3> positions = {
        Vector3(-20.0f, 5.0f, 5.0f),
        Vector3(0.0f, 5.0f, 5.0f),
        Vector3(20.0f, 5.0f, 5.0f),
    };
    const std::array<int, 3> expected = {-2, 0, 1};

    for (std::size_t i = 0; i < positions.size(); ++i) {
        const auto& position = positions[i];
        const Quadray point = Quadray::fromCartesian(position);
        const Quadray shifted(point.a + offset, point.b + offset, point.c + offset,
                              point.d + offset);
        const auto cartesian = shifted.toCartesian();
        if (std::fabs(cartesian.x - position.x) > tolerance ||
            std::fabs(cartesian.y - position.y) > tolerance ||
            std::fabs(cartesian.z - position.z) > tolerance) {
            std::cerr << "Common offset changed sample " << i << '\n';
            return 1;
        }
        const auto [cx, cy, cz] = world.worldToChunkCoords(cartesian);
        if (std::make_tuple(cx, cy, cz) != std::make_tuple(expected[i], 0, 0)) {
            std::cerr << "Unexpected chunk for sample " << i << '\n';
            return 1;
        }
        if (i == 0) {
            world.setBlock(point, Block::DIRT_BLOCK);
            const auto adjacent = Quadray::fromCartesian(Vector3(-19.0f, 5.0f, 5.0f));
            if (world.getBlock(shifted) != Block::DIRT_BLOCK ||
                world.getBlock(adjacent) != Block::AIR_BLOCK) {
                std::cerr << "Unexpected block lookup at negative position\n";
                return 1;
            }
        }
        std::cout << position.x << ' ' << position.y << ' ' << position.z << ' '
                  << cx << ' ' << cy << ' ' << cz << '\n';
    }
}
