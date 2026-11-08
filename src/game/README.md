# Native Game loop, input and sampled block picking

[Game.h](Game.h)/[Game.cpp](Game.cpp) coordinate GLFW, world, camera, mesher, mesh cache and shaders. [../main.cpp](../main.cpp) constructs `Game(800,600,"QuadCraft")`, calls `initialize()` and then `run()`; `cleanup()` handles resources. There is no documented INIT/LOADING/PAUSED gameplay state machine.

`run()` computes variable GLFW deltas in seconds, caps at 0.05, calls private `update()` then `render()`, swaps buffers and polls events. Frame pacing uses busy waiting; this is not the portfolio fixed-step loop. `update()` calls `Input::processInput`, generates nearby chunks and budgets mesh regeneration. Camera movement can mark all chunks dirty, so dirty caching is not restricted to block edits.

[Input.h](Input.h) owns GLFW callbacks and `processInput(float,Camera&,World&)`. F1/F2 toggle wireframe/coordinate overlay through `GameInputDelegate`; left click initially captures the mouse, then captured mouse buttons request removal/placement. Read the actual key handlers for movement/capture variants rather than assuming browser bindings.

`castRayFromCamera` is a private sampled ray march using a base 0.05 Cartesian step (sometimes halved), testing `World::getBlock` at converted points. The previous sample supplies placement adjacency. It does not intersect tetrahedron faces or guarantee hitting every rendered element. Camera motion has no collision/gravity solver; browser ball physics and saves are not native Game features.
