# Native Vertex buffers and heuristic chunk meshing maintenance

Inspect Mesh.cpp attribute offsets alongside Shader/Game GLSL before changing Vertex. Preserve chunk-origin translation. Do not claim shared vertices, exact internal-face elimination, cross-chunk topology correctness or performance thresholds without evidence; reflected neighbors and sampled picking are not geometric intersection routines.

Read the adjacent [directory guide](README.md) before changing this area. Report source inspection separately from executed runtime checks.
