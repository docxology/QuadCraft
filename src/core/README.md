# Native coordinates, camera and chunk storage

`coordinate/` supplies float vectors/quadrays; `entity/Camera.h` supplies the view; `world/` supplies sparse chunks and procedural material selection. `Game` owns its `World` and `Camera` separately, rather than storing the camera in an ECS/world hierarchy.

Start with [coordinate units](coordinate/README.md), [camera](entity/README.md) and [world lifecycle](world/README.md). There is no native save serialization or collision simulation in these core classes. Geometry is prototype geometry, not a proven regular tetrahedral tessellation.
