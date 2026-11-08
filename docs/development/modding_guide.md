# Source-level customization, not a mod SDK

[Development index](README.md) · [Native API](api_reference.md) · [Asset limitations](asset_creation_guide.md)

## Supported extension boundary

QuadCraft is editable source. It does **not** ship a mod loader, MDK installer, stable binary plugin ABI, `mod.json` resolver, namespaced content-pack registry or `quadcraft/api/` headers. The native namespace is `QuadCraft`, not `quadcraft`.

Do not run a supposed `tools/install_mdk.sh` or include `IQuadCraftMod.h`: those were hypothetical examples, not repository interfaces. Native changes require rebuilding the executable. Portfolio changes require editing the relevant JavaScript/HTML and serving the shared file hierarchy.

## Add a native material in source

[`Block.h`](../../src/core/world/Block.h) defines `Block::BlockID` and `BlockRegistry`. Registering a value changes material metadata in a `World` instance:

```cpp
#include "core/world/World.h"

void registerCrystal(QuadCraft::World& world) {
    constexpr QuadCraft::Block::BlockID crystalId = 7;
    world.blockRegistry.registerBlock(
        QuadCraft::Block(crystalId, false, true, "crystal"));
}
```

This is source-level registration, not plugin discovery. Registry insertion overwrites the same numeric ID; choose IDs deliberately. To make the material appear, use `World::setBlock` at an actual stored position or modify terrain selection. Color generation is controlled by [`ChunkMesher.cpp`](../../src/render/mesh/ChunkMesher.cpp); texture/model loading is not added by registering a block. The `solid` flag alone does not add collision response.

## Customize terrain or rendering

[`TerrainGenerator.h`](../../src/core/world/TerrainGenerator.h) owns private noise/material parameters and `generateChunk(TetraChunk&)`. There is no public biome/structure callback registry or seed setter. Modify this implementation if the goal is different generation, while preserving [Cartesian chunk ownership](chunk_system.md).

The native shader strings are in [`Game.cpp`](../../src/game/Game.cpp). Mesh face/color generation is in `ChunkMesher.cpp`. Neither is a reloadable resource pack. Keep geometry-space and shader expectations synchronized.

## Extend a portfolio game

The catalog lives in [`games/src/core/registry.py`](../../games/src/core/registry.py). Existing games use game-prefixed board/renderer/controller files and sibling shared helpers. Consult the [portfolio guide](../games.md) and [scaffold guide](../../games/doc/scaffold_guide.md) for the existing workflow; scaffolding is a starting structure, not an implemented game or proof of playability.

The historical browser's editable brush table is another local source extension point, not a portable mod API. Its [direct evaluation button](realtime_code_evaluation.md) runs trusted code with page privileges and is not a safe plugin sandbox.

## Conceptual future plugin requirements

A real plugin system would need a versioned loading contract, dependency/conflict policy, resource ownership, teardown, save compatibility and a clear trust model before distribution instructions would be meaningful. Native code loaded in-process would carry the host process's privileges; a JavaScript allowlist alone would not provide isolation. No packaging, marketplace, cross-mod interoperability or multiplayer synchronization guarantee is implied by this design context.
