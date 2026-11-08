# Coordinate logging, statistics and browser time-series charts

`logger.js` defines Logger/global logger: `startLogging`, `stopLogging`, `logCurrentState`, `clearLog` and `exportLog`. Sampling uses `setInterval` and millisecond configuration; JSON downloads are not a universal CSV API.

`analyzer.js` and `visualizer.js` are global analysis objects for collected coordinates and Canvas displays; inspect their concrete UI actions rather than using invented `calculateStatistics/findHotspots/drawHeatmap` recipes. `timeSeriesAnalyzer.js` defines tracking toggles for quadray, XYZ and movement data, records browser timestamps with `Date.now()` and draws line charts on `quadrayChart`, `xyzChart` and `movementChart` canvases.

`updateInterval` is milliseconds; the time window is seconds and movement calculations explicitly convert elapsed timestamps. These are sampled diagnostic views, not a physics integrator, exact trajectory reconstruction or evidence of measured educational/performance outcomes. Initialization requires host controls/canvases and the shared state globals; these files do not export an ES-module API.
