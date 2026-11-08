# Native Shader compilation and actual uniform setters

[Shader.h](Shader.h) provides a default constructor, `loadFromSource(vertexSource,fragmentSource)` and `loadFromFile(vertexPath,fragmentPath)`, both returning bool. A two-filename constructor is not implemented.

`use() const` binds the program. Setters are `setBool`, `setInt`, `setFloat`, `setVec3` (Vector3 or three floats) and `setMat4(const std::string&,const float*)`; there is no generic Matrix4 or setVec2/setVec4 interface. `isInitialized()` reports a nonzero program ID; compile/link diagnostics come from Shader.cpp.

The current Game loads embedded GLSL, not loose `.glsl` files. Inspect [Game.cpp](../../game/Game.cpp) for active attribute locations and uniform names (`model`, `view`, `projection`); arbitrary lighting uniforms in examples do not define an application contract. Resource cleanup requires the OpenGL context lifecycle.
