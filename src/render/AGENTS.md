# Native OpenGL rendering and visibility boundaries maintenance

Coordinate Vertex layout, VAO attributes and embedded GLSL changes together. Retain GL resource/context lifetime ownership. Measure performance before making claims; do not document occlusion, LOD, postprocessing or transparent depth sorting merely as expected renderer features.

Read the adjacent [directory guide](README.md) before changing this area. Report source inspection separately from executed runtime checks.
