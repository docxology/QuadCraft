# Experiment state, Canvas rendering and local save boundaries

`gameState.js` defines GameState plus its global instance. State includes `selq`, `QGridDots`, `QDots`, triangle maps and `grid` shape sets. Implemented operations include `addDot`, shape toggles, `moveSelectedQuadray`, `updateCamera`, `clearShapes`, `toJSON`, `getStateJson` and `loadFromJson`; callers also use `viewChanged/gridChanged`.

`gameController.js` maps navigation/placement and UI controls. `camera.js` implements Canvas camera pan/rotation/zoom, `rotate/inverseRotate/project`, `getCameraState` and `updateCamera`; it is not the native Camera or a collision-controlled player. `renderer.js` initializes a Canvas 2D context, projects and depth-sorts triangles; painter ordering does not guarantee correct occlusion for intersecting geometry.

`saveLoadController.quicksave(name)`/`quickload(name)` use `quadcraft.quicksave.<name>` in localStorage. `saveFile/openFile` serialize through GameState; `toJSON()` uses type `quadcraft_quadraygrid2_state`, selection, camera, display settings, code text and grid arrays. This is not current grid5 Var-tree serialization, a native world save or server persistence. Shared localStorage prefixes can cause different snapshots on one origin to overwrite slots.

`codeExecutor.evalCode()` calls `executeInContext(code)`, which constructs a `new Function` with game helpers. Its context argument list does not sandbox global browser access. Run only trusted code. See [startup limitations](../README.md) before treating these files as a runnable integrated app.
