# Python infrastructure for browser-game tooling

This package provides the launcher/server, registry, QA, generators and source-analysis helpers, plus floating-point coordinate utilities. It is not the JavaScript simulation runtime or native C++ engine.

| Package | Purpose |
|---|---|
| [core](core/README.md) | Registry, config constants and default paths |
| [server](server/README.md) | Threaded static loopback HTTP serving |
| [qa](qa/README.md) | Subprocess logic suites and structural text checks |
| [scaffold](scaffold/README.md) | Starter-file generation, with documented integration limits |
| [analytics](analytics/README.md) | File/text completeness metrics, not runtime health |
| [shared](shared/README.md) | JavaScript metadata/dependency ordering, not executable game code |
| [board](board/README.md) | Heuristic board catalog/audit and textual migration |
| [space](space/README.md) | Floating-point quadray/projection/grid/reference math |

Run the CLI from the QuadCraft repository root with `python3.13 games/run_games.py --list`. Library imports use `games.src.<package>` from that root. Read [Python interfaces](../doc/python_infrastructure.md), especially the [default-path limitation](../doc/configuration.md), before interpreting a library scan. The CLI derives its correct root independently.
