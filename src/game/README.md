# Native Game loop, input and sampled block picking

[Game.h](Game.h)/[Game.cpp](Game.cpp) coordinate GLFW, world, camera, mesher, mesh cache and shaders. [../main.cpp](../main.cpp) constructs `Game(800,600,"QuadCraft")`, calls `initialize()` and then `run()`; `cleanup()` handles resources. There is no documented INIT/LOADING/PAUSED gameplay state machine.

`run(unsigned int maxFrames=0,const std::string& capturePath="")` computes variable GLFW deltas in seconds, caps at 0.05, calls private `update()` then `render()`, swaps buffers and polls events. Frame pacing uses busy waiting; this is not the portfolio fixed-step loop. `update()` processes input, loads/unloads chunks, evicts unloaded meshes with a live context and budgets fifteen dirty mesh rebuilds. Camera-only motion does not invalidate world-space geometry. `World::setBlock` dirties only the edited chunk; neighbor boundary faces remain potentially stale until explicit invalidation or reload.

The executable accepts `--frames N --capture output.ppm`, with positive `N` and capture requiring a bound. Bounded runs complete all requested frames or throw on early closure; synchronous loading exceeding one second does not truncate them. Capture writes the final actual back buffer as a top-down P6 PPM and reports readback/write failures. The interactive default retains its slow-frame exit. [Capture gates](../../docs/development/testing_guide.md#real-opengl-rendering-and-framebuffer-artifacts) check real outputs, not synthetic scenes.

`cleanup()` restores its current GL context, releases input/mesh/shader owners (unbinding the shader) and resets systems before window destruction/GLFW termination. It is idempotent, including partial ownership. The real partial-state regression owns an uploaded mesh and compiled shader; it does not cover every injected initialization failure.

[Input.h](Input.h) owns GLFW callbacks and `processInput(float,Camera&,World&)`. F1/F2 toggle wireframe/coordinate overlay through `GameInputDelegate`; left click initially captures the mouse, then captured mouse buttons request removal/placement. Read the actual key handlers for movement/capture variants rather than assuming browser bindings.

`castRayFromCamera` is a private sampled ray march using a base 0.05 Cartesian step (sometimes halved), testing `World::getBlock` at converted points. The previous sample supplies placement adjacency. It does not intersect tetrahedron faces or guarantee hitting every rendered element. Camera motion has no collision/gravity solver; browser ball physics and saves are not native Game features.
