# Collision and motion: implemented kernels versus native physics design

[Development index](README.md) · [Entities](entity_system.md) · [Portfolio units](../games.md)

## Native motion and picking are not a rigid-body engine

[`Camera::processKeyboard`](../../src/core/entity/Camera.h) moves a drone-like Cartesian camera with elapsed-seconds scaling and adaptive speed. [`Input::castRayFromCamera`](../../src/game/Input.h) samples points along the view ray, converts them to quadrays and queries exact stored world keys. It returns a hit position and the previous sample as the placement position.

This is not exact ray/tetrahedron intersection or a guarantee that every visible face can be selected: floating samples need not match the sparse element-center keys. Native camera motion does not integrate gravity or resolve contact against blocks. `Block::solid` is metadata, not proof of a collision solver.

No native physics directory/API, `PhysicsWorld`, `RigidBody`, tetrahedral SAT/GJK solver, contact manifold, constraint system, fluid solver or stable timestep integrator is implemented. The old solver recipes and class diagrams were proposals, not runnable C++.

## Specialized browser-game kernels

| Source | Implemented scope |
|---|---|
| [`asteroids_board.js`](../../games/4d_asteroids/js/asteroids_board.js) | Seeded game state, periodic physical distances and swept collision ordering for its moving entities |
| [`doom_physics.js`](../../games/4d_doom/js/doom_physics.js), [`doom_game.js`](../../games/4d_doom/js/doom_game.js) | Doom-specific movement/collision/shooting, a 60 Hz controller clock and input-time settlement |
| [`entity_system.js`](../../games/4d_generic/entity_system.js) | Basic raw-coordinate integration/wrapping and raw-distance radius overlap; not a universal swept physical collision library |
| [`simant_board.js`](../../games/4d_simant/js/simant_board.js) | Discrete ants, excavation and graph field transport, not continuum mechanics |

Each kernel defines its own topology and units. In particular, raw four-dimensional component distance is not the physical quadray norm. Periodic raw coefficient wrapping also does not imply that independently minimizing four coefficient deltas computes the nearest physical image. Asteroids explicitly handles its physical periodic geometry; do not replace it with the generic helper's raw overlap rule.

## Historical rolling-ball experiment

[`src/browser/index.html`](../../src/browser/index.html) has a separate experimental rolling-ball path: `doGameLogic`, `potenOfRollball`, `CCPBallGrid::potenOfRollball` and `forAllCollidingBallPairs`. Balls live in the Var tree; finite-difference potential gradients and configured acceleration/repulsion terms drive motion. Physics cycles subdivide the page's clamped variable frame delta.

The CCP collision search includes a source restriction that its local neighborhood assumes the rolling ball is no larger than a CCP ball. Source comments/debug colors also track deep overlap and penetration issues. This is exploratory ball dynamics, not proof of general tetrahedral rigid-body support, stable contact, conservation or arbitrary-radius collision correctness.

## Field transport is not physical heat by default

[`ConservativeGraphField`](../../games/4d_generic/graph_field.js) applies synchronous equal-and-opposite edge flux with coefficient `alpha / maxDegree`. It conserves a uniform-site sum up to floating-point error; masks remove incident edges without erasing stored values. It is not symmetric-normalized heat or a finite-volume material model. SimAnt applies sources/saturation, separate evaporation and Float32 storage rounding outside this transport step.

## Retained design context

A future native collision system would need a declared physical embedding, canonical cell identity, exact geometry ownership and explicit seconds/radius/mass units. Broad-phase bounds, a convex narrow phase and response integration are possible design categories, not available classes. Validate degenerate contacts, boundary crossings and time partitioning before claiming robustness. Use the [actual test boundaries](testing_guide.md), not a proposed diagram, to decide what has been exercised.
