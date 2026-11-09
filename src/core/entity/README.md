# Native Euler camera and frustum interface

[Camera.h](Camera.h) contains `Camera`, `Frustum` and `CameraMovement`; there is no general entity registry or player physics body.

`Camera::position` and basis vectors are Cartesian `Vector3`. `processKeyboard(CameraMovement,float deltaTime)` uses seconds, movement speed and a capped distance-dependent factor. `processMouseMovement(float,float,bool constrainPitch=true)` updates Euler yaw/pitch (degrees); pitch clamps to ±89 degrees. This native implementation is not the quaternion browser camera.

`getViewMatrix() const` returns `std::array<float,16>` in column-major order without heap allocation. Non-const `getProjectionMatrix(float aspect,float nearPlane,float farPlane)` returns the same fixed-size type and configures the frustum's aspect/near/far. `zoom` is the authoritative vertical field of view (degrees), shared by terrain, overlay and frustum; scroll clamps it to 1–45 degrees and updates the frustum. `getQuadrayPosition()` converts current position; `getPositionQuadray()` accesses the cached value initialized by construction and updated by movement. `Frustum::sphereInFrustum` tests bounding spheres, not occlusion. Drone roll fields/methods do not imply quaternion orientation or collision constraints. Camera movement can pass through terrain.
