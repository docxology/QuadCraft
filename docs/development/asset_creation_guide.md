# Native vertex colors and browser assets: actual import limits

[Development index](README.md) · [Source customization](modding_guide.md) · [Renderer architecture](architecture.md)

## Native renderer has no asset-pack loader

[`ChunkMesher.cpp`](../../src/render/mesh/ChunkMesher.cpp) assigns block colors, adds positional/face variation and writes zero texture coordinates. [`Game.cpp`](../../src/game/Game.cpp) embeds GLSL source and shades vertex color with lighting and wireframe/overlay options. The shader's texture-coordinate field is not evidence of texture sampling.

There is no runtime PNG texture registry, OBJ/glTF importer, mod asset directory, resource-pack metadata or `registerTexture` method. CMake does not copy an `assets/` directory. A block registered in `BlockRegistry` is a material record, not an imported model.

## Change visible native content at its actual source

- Material metadata: [`Block.h`](../../src/core/world/Block.h).
- Material selection during generation: [`TerrainGenerator.h`](../../src/core/world/TerrainGenerator.h).
- Tetrahedron geometry: [`TetrahedralElement.h`](../../src/core/world/TetrahedralElement.h).
- Face vertices, normals and colors: `ChunkMesher.cpp`.
- Shader effects: the source strings in `Game.cpp`.

These are compiled changes. Preserve the world-space mesh offset and declared Cartesian scale; there is no universal asset convention of “one unit equals one tetrahedron height.” Coefficient-unit quadray basis vectors have Cartesian length `sqrt(3/2)` in the native/shared embedding.

## Browser content belongs to its game/page

Portfolio games draw with their own Canvas renderer and HTML/CSS. Keep any page-relative resource URL consistent with the HTTP root and retain sibling shared modules. The historical geometry experiment likewise owns its own Canvas drawing functions; an image or model added beside it is not automatically loaded or registered.

## Texture/model design context only

If an importer is implemented in the future, it must specify UV coordinates, winding/normals, image color/alpha conventions, scale/orientation, ownership and loading errors. Triangular faces could be UV-mapped into images, but PNG sizes, glTF support and mod folder layouts are not current requirements or supported recipes. Decide these interfaces in code before documenting an asset pipeline.
