# Classic-script globals, initialization and integration gaps

These JavaScript files declare top-level classes, objects and initialization helpers, not ES `export` APIs. `main.js` coordinates `gameState`, renderer, camera and analysis globals; file ordering and host DOM are required.

- [core](core/README.md): GameState, input/controller, Canvas renderer, camera, save/load and code evaluation.
- [math](math/README.md): Quadray, Q/T helpers, direction initialization and shape corners/triangles.
- [analysis](analysis/README.md): Logger, analyzer, visualizer and TimeSeriesAnalyzer.
- [utils](utils/README.md): constants/configuration and helper namespace.

The split startup has integration gaps: `initializeModules()` initializes directions after other setup, while GameState/controller constructors already depend on direction globals; `update()` calls `camera.update(deltaTime)`, while Camera exposes other methods rather than that update interface. These files therefore require integration work, not just an HTML module tag. No runtime repair is implied by this documentation.

Do not infer standalone functionality from a class appearing here. Timestamp/interval clocks use browser milliseconds unless a calculation explicitly converts to seconds.
