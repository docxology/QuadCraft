# Shared browser helpers: actual APIs and dependencies

Source lives in [`4d_generic/`](../4d_generic/). This reference documents the current browser implementations, not the historical monolithic/native interfaces or a claim that every game uses every module. The [canonical portfolio contracts](../../docs/games.md) own mathematical units, raw identity, clocks and RNG distinctions.

## Load Order

Classic-script consumers must load dependencies before use. A working order is quadray, synergetics, grid utilities, camera, projection, zoom, input, game loop, HUD, scoring, renderer, game, then optional board/entity/turn/pathfinding scripts and game scripts. Load `graph_field.js` explicitly if used. Doom's actual HTML/ES-module bridge is a different entrypoint; do not substitute this list for it.

The Python `ModuleRegistry.load_order()` returns metadata in its declared order; it does not load JavaScript. Its definitions omit graph-field/CSS and its path-presence methods inherit the [tooling default-path limitation](configuration.md).

## Quadray and GridUtils

| Source | Actual API |
|---|---|
| `quadray.js` | `new Quadray(a=0,b=0,c=0,d=0)`, `clone()`, `normalized()`, `toCartesian()`, `Quadray.fromCartesian(x,y,z)` |
| Arithmetic | `add(other)` normalizes; `subtract(other)` and `scale(s)` retain raw components |
| Geometry | `length()`, `distanceTo(other)`, static `Quadray.distance(q1,q2)` use embedded XYZ Euclidean units; static distance accepts structural records |
| Identity/snapping | `equals(other,epsilon=0.0001)` compares normalized coefficients; `toKey()` normalizes then rounds; static `toIVM(q)` uses `Math.round` on minimum-zero coefficients, not nearest-point FCC search |
| Metadata | `Quadray.BASIS`, `A/B/C/D`, `ORIGIN`; `cellVolume()` returns the game's 0.375 convention, `cellType(a,b,c,d)` a rounded-sum parity label, not a tessellation constructor |
| `grid_utils.js` | `GridUtils.generateGrid(size)` enumerates raw `size**4` slots; `generateCanonicalGrid(size)` retains minimum-zero representatives |
| Keys and bounds | `key(a,b,c,d)` preserves raw identity; `parseKey(k)` returns a record; `inBounds(a,b,c,d,size)` checks raw component bounds |
| Graph | `neighbors(a,b,c,d)` normalizes twelve moves from `DIRECTIONS`; `boundedNeighbors(...,size)` bounds the normalized result |
| Metrics | `manhattan(p1,p2)` and `euclidean(p1,p2)` are raw four-coefficient metrics, not embedded physical distances |
| Utilities | `depthSort(cells,projectFn)` returns projected copies sorted by `pScale`; `randomCoord(size)` uses `Math.random`; `createSeededRng(seed)` gives an independent Mulberry32 stream; `shuffle(arr,rngFn=Math.random)` mutates and returns the array |

`Quadray.IVM_DIRECTIONS` is the separate eight signed coefficient-axis steps, not the twelve FCC moves. Raw `GridUtils.key` is intentionally different from normalized `Quadray.toKey`. Never merge board occupancy aliases as a generic cleanup.

`synergetics.js` exports `SYNERGETICS` (ROOT2, S3, TETRAHEDRAL_ANGLE, BASIS_LENGTH, TETRA_VOL, OCTA_VOL, CUBO_VOL), `angleBetweenQuadrays(q1,q2)` in degrees, `verifyRoundTrip(q,tolerance=0.01)` and `verifyGeometricIdentities()`. It does not expose the Python-only Jitterbug/PHI/icosahedron interface. Numerical identity checks do not prove game rules or physical tiling.

## Camera, projection and renderer

```javascript
const q = new Quadray(1, 0, 0, 0);
const opts = { rotX: 0.5, rotY: 0.7, scale: 35,
               cameraDist: 5, centerX: 300, centerY: 300 };
const point = projectQuadray(q, opts);
```

`projectQuadray(q,{rotX,rotY,scale,cameraDist,centerX,centerY,target})` takes a Quadray object, not four numbers. `target` is an optional physical XYZ record. Rotation angles are radians; camera distance is embedded XYZ units and output x/y are pixels. The returned `scale` is a perspective multiplier. `drawQuadrayAxes(ctx,opts,axisLen=2)` takes the same options. Projection does not clip points at/behind the camera.

`new CameraController(canvas,{mode='shift-drag',sensitivity=0.005,clampX=null}={})` installs canvas mouse listeners and exposes `rotX`, `rotY`, `isDragging`. `left-drag` selects plain-left rotation; shift-drag mode accepts shift or right-button. There is no `getRotation()` method.

`setupZoom(canvas,renderer,{min=10,max=120,zoomIn=1.08,zoomOut=0.92}={})` installs a wheel listener and mutates `renderer.scale`; it returns no zoom controller.

`new BaseRenderer(canvas,board,opts={})` stores canvas/context and projection properties; no automatic resize is installed. Options include scale, cameraDist, rotX/rotY, bgColor and fontFamily. Subclasses override `render()` and can use `_project(a,b,c,d)`, `_drawAxes()`, `_clearCanvas(color)`, `_drawHUD(lines,opts)`, `_drawCircle(x,y,radius,color)`, `_drawDiamond(x,y,size,fillColor,strokeColor)`.

`fitToPoints(points,padding=32)` fits physical extents with a bounding sphere, changing target/camera distance/scale, not board labels or physical units. Empty/nonfinite points or insufficient canvas padding can raise `RangeError`. A renderer does not automatically depth-sort or fit a game's board.

## GameLoop and BaseGame

`new GameLoop({update,render,tickRate=1000/60})` accumulates browser milliseconds; `tickRate` is **milliseconds per update**, not Hz. It calls `update(tickRate/1000)` with fixed **seconds** and `render(accumulator/tickRate)` with a fraction. A frame contributes at most 250 ms. Lifecycle: `start()`, `stop()`, `togglePause()`; state includes `paused`, `animationId`, `accumulator`. Stop/start establishes a fresh wall clock but does not itself clear the accumulator.

`new BaseGame(canvas,hudElement,board,renderer,opts={})` composes existing objects. Options include `tickRate` (default 16 ms), name, zoomOpts, cameraMode. `init()` attaches input and starts the loop. Hooks are `update(dtSeconds)`, `_setupGameInput()` and `_getHUDState()` returning `{text,color}`; input setup runs during base construction. Rendering calls the supplied `renderer.render()` after camera rotation synchronization. `togglePause()` updates HUD; `reset()` stops, clears the accumulator, calls board reset if available, then starts. There is no universal `this.options` API or controller `render()` hook.

Each actual controller owns its integration policy. Discrete boards may ignore dt; entity velocity units must agree with the supplied dt. Default Minecraft controller updates analysis, not its board's physics/time. Doom owns a separate fixed-60-Hz controller.

## Input, HUD and scoring

- `new InputController()` does not attach listeners. `bind(keys,callback,actionName=null)` accepts a string/array using `KeyboardEvent.key` spelling (space is `' '`). `attach()`/`detach()` use `document`, even though attach declares a target parameter. `isDown(key)` reads held state. No universal mouse/replay/reset subsystem is implied.
- `new HUD(element)` takes an element, not an element ID. Methods: `set(text,color)`, `playing(text)`, `paused(text)`, `gameOver(text,won=false)`, `warning(text)`; static `livesString(count,emoji)`. No `update(state)` or `setStatus` API.
- `new ScoreManager({lives=3,level=1,levelThreshold=500,storageKey=null}={})` exposes score/level/lives/highScore/linesCleared fields. `addScore(points)` returns `{leveled}`, `nextLevel()`, `loseLife()` returns game-over boolean (initial zero means unlimited), `addLife()`, `reset()`, `toJSON()`. High-score storage is optional and attempted only with a key; there are no get/set-score/level getters or public save method.
- `hud-style.css` is styling, not a JS module or game-state manager.

## BaseBoard

`new BaseBoard(size=6,{lives=3,level=1,verify=true,name}={})` creates an empty raw-keyed `Map`. `getCell(q)` / `setCell(q,value)` take coordinate records; `key(a,b,c,d)` takes four numbers. Helpers: `parseKey(k)`, `inBounds(q)`, `getNeighbors(q)` (bounded canonical), `getAllNeighbors(q)`, raw `manhattanDistance`/`euclideanDistance`, physical `quadrayDistance`, `angleBetween(from,to1,to2)` (Quadray instances), `wrap(v)`, `forEachCell(fn)`, `generateGrid()`.

`getMetadata()` delegates to `_baseMetadata()` for score/lives/level/gameOver/size and available reference constants. `_verifyIntegrity()` spot-checks round trips; it does not validate topology or occupancy. `reset()` clears grid/gameOver/score, not every subclass state or life/level field. `DIRECTIONS` delegates to twelve GridUtils moves. `NAMED_DIRECTIONS` currently maps only eight name strings over twelve moves, so the last four names are undefined; do not use it as a complete movement-label contract.

## Entity, turn and path helpers

`new QuadrayEntity(posArray,velArray=null,opts={})` stores raw coefficient records. `update(dt,size)` integrates and optionally wraps; `wrapPosition(size)`, `setVelocity(array)`, `clampSpeed(max)`, `destroy()`, `toQuadray()`, `posKey()` are available. `distTo(other)` is physical, while `euclideanDistTo`, `manhattanDistTo`, radius collision (`collidesWith`) and speed clamping use raw four-component metrics. Time units come from the caller.

`EntityManager` provides `add(entity)`, `removeInactive()`, `getByType(type)`, `getActive()`, `update(dt,size)`, `checkCollisions(typeA,typeB,callback)`, `nearest(pos,type)`, `count`, `clear()`. Nearest uses the raw metric. It is not the native engine's entity manager.

`new TurnManager(players=['black','white'],{maxHistory=1000}={})` requires at least two players. Properties: currentPlayer, opponent, playerCount, moveCount. Methods: `recordMove(move)`, `nextTurn()`, `recordAndAdvance(move)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `lastMoves(n=5)`, `movesBy(player)`, `getMetadata()`, `reset()`. Undo/redo returns entries and changes turn/history only; the game must restore/reapply actual board state. Timestamps use `Date.now()` milliseconds.

`QuadrayPathfinder.bfs(start,goal,isWalkable,size)` and `shortestPath(start,goal,isWalkable,size,costFn)` return inclusive paths or null on canonical physical cells. Default A* uses the IVM hop lower bound; custom finite nonnegative entry costs use a zero heuristic (Dijkstra). `floodFill(seed,canSpread,size,maxCells=Infinity)` includes the seed. `lineOfSight(origin,{da,db,dc,dd},isBlocking,size,maxRange=Infinity)` instead advances raw coefficients without canonicalization, excluding the blocker. `cellsInRange(center,range,size)` uses raw Manhattan distance and excludes center. These are not interchangeable graph/range semantics.

## ConservativeGraphField

`new ConservativeGraphField(size,edges)` deduplicates undirected edges and ignores self-loops. `step(values,alpha,out=null,active=null)` applies synchronous `I-alpha*L/dMax` mixing; alpha is dimensionless in `[0,1]`. Output must not alias input. Masks disable incident edges but retain stored values; maxDegree remains the full graph bound. Equal/opposite edge flux conserves closed-graph mass and range up to finite floating-point roundoff. This is not symmetric-normalized heat, evaporation, sources or a physical diffusion-time calibration. SimAnt supplies its own raw adjacency and update cadence. The kernel is a separate script outside the Python core/optional registry lists.

[Python metadata](python_infrastructure.md) · [Python math differences](space_math_reference.md) · [Testing](testing_guide.md)
