# Native OpenGL rendering and visibility boundaries

`mesh/` contains CPU chunk conversion and GPU buffers; `shader/` wraps compilation/linking/uniforms. [Game.cpp](../game/Game.cpp) embeds GLSL sources and performs drawing; there is no separate postprocessing or asset pipeline here.

The game requests OpenGL 3.3 core with GLFW/GLEW. It builds per-chunk meshes, checks chunk visibility and binds view/projection/model uniforms. See [mesh details](mesh/README.md) and [shader interface](shader/README.md). Frustum checks are not occlusion testing, normal/color shading is not a texture/material system, and water transparency metadata does not establish correct sorted blending. F1/F2 are Game/Input debug toggles, not renderer methods.

No hardware frame-rate, mesh-generation budget or cross-platform rendering guarantee follows from this source audit.
