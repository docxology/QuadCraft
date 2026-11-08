# Native Euler camera and frustum interface

[Camera.h](Camera.h) contains `Camera`, `Frustum` and `CameraMovement`; there is no general entity registry or player physics body.

`Camera::position` and basis vectors are Cartesian `Vector3`. `processKeyboard(CameraMovement,float deltaTime)` uses seconds, movement speed and a capped distance-dependent factor. `processMouseMovement(float,float,bool constrainPitch=true)` updates Euler yaw/pitch (degrees); pitch clamps to ±89 degrees. This native implementation is not the quaternion browser camera.

`getViewMatrix()` returns `std::vector<float>` in column-major order; `getProjectionMatrix(float aspect,float nearPlane,float farPlane) const` returns the projection. `getQuadrayPosition()` converts current position; `getPositionQuadray()` accesses the cached value updated by movement. `Frustum::sphereInFrustum` tests bounding spheres, not occlusion. Drone roll fields/methods do not imply quaternion orientation or collision constraints. Camera movement can pass through terrain.
