# Quaternion-array camera in the browser geometry experiment

[Development index](README.md) · [Gamepad mapping](gamepad_integration_guide.md) · [Projection](cone_plane_intersection_rendering.md)

## Representation and scope

[`src/browser/index.html`](../../src/browser/index.html) stores Cartesian `camPos` and an orientation array `camQ = [x,y,z,w]`. It uses free functions `createQuaternion(axis, angle)`, `multiplyQuaternions(q1,q2)`, `normalizeQuaternion(q)`, `calculateForwardVector(q)` and `calculateUpVector(q)`. Identity orientation is `[0,0,0,1]`.

There is no page-level `class Quaternion` with instance interpolation methods and no generic camera-controller hierarchy. Older [`QuadrayGrid4.html`](../../src/js/experiments/QuadrayGrid4.html) has a related snapshot, not an import of this page. The native [`Camera.h`](../../src/core/entity/Camera.h) uses Euler-angle state; portfolio [`camera.js`](../../games/4d_generic/camera.js) is another independent controller.

## Movement and rotation ownership

`moveCamera(forwardBackward, upDown, leftRight)` derives a basis from `camQ`, combines the supplied displacements and updates `camPos`. It does **not** multiply by elapsed time itself. Keyboard/gamepad callers supply time-scaled movement; mouse dragging supplies pixel-derived displacements.

`rotateCamera(rx,ry,rz=0)` constructs yaw/pitch/roll increments with the current camera basis and composes them into `camQ`, then normalizes. Its arguments are already rotation increments, not angular velocities awaiting another dt multiplication. The quaternion creation helper accepts an axis and angle in radians; the existing callers derive normalized axes.

`normalizeQuaternion` falls back to identity for a near-zero norm. That avoids one degenerate orientation but does not establish robust handling of arbitrary corrupt state.

## Projection and legacy mode

The checkbox `chkQuaternionCamera` selects `isQuatCam()`. `project([x,y,z])` uses the selected mode. The quaternion path uses camera-relative forward depth and `cubeSize`; legacy mode uses separate offsets/zoom/angles. Legacy UI values are not interchangeable with quaternion state.

`paintBall` requires quaternion mode for its sphere drawing path. [Conic rendering](cone_plane_intersection_rendering.md) rebuilds the same camera basis and returns screen-space affine ellipse vectors. A mismatched camera convention or an extra dt factor changes visible geometry.

## Inputs and save state

The page routes mouse drags, wheel movement, keyboard polling and [`updateFromGamepad`](gamepad_integration_guide.md) into the free functions. `StateMap()` stores copies of `camPos` and `camQ` along with legacy camera values and the selected mode. This is the experiment's snapshot format, not a native camera serializer or a universal portfolio save.

## Unsupported camera features and design context

The current free-function camera does not provide collision avoidance, camera-path animation, SLERP keyframes, a touch gesture abstraction or cinematic rigs. Quaternion orientation avoids the specific Euler representation singularity but does not automatically add stable clipping, collision or smoothing.

If adding camera animation, explicitly decide quaternion ordering, multiplication order, coordinate handedness and time ownership. Preserve the existing projection basis and validate navigation near poles/roll states with actual rendering before claiming visual correctness. Do not introduce a second hypothetical camera API in documentation.
