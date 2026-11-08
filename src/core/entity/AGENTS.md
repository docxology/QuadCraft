# Native Euler camera and frustum interface maintenance

Keep cached Cartesian/quadray position and frustum updates coherent. Inspect Game/Input callers before changing view matrix storage or movement units. Do not document a Matrix4 return type, an ECS, quaternion rotation or terrain collision as implemented native behavior.

Read the adjacent [directory guide](README.md) before changing this area. Report source inspection separately from executed runtime checks.
