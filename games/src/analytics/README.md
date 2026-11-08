# File/text completeness metrics for game directories

`__init__.py` exposes `GameAnalytics`, `GameMetrics` and `SuiteReport`. `scan_game(Path)` inspects direct JS files and HTML text; `full_report()` scans 4d_* directories rather than registry selection. `summary()` and `to_json()` format the results.

Use explicit games/generic roots to avoid [default-path problems](../../doc/configuration.md). [Analytics reference](../../doc/analytics_reporting.md) explains the seven-check score, substring heuristics and partial JSON representation. These reports measure neither runtime health, gameplay quality, test coverage nor player telemetry.
