# QuadCraft browser-game portfolio

Thirty browser games share selected helpers under [`4d_generic/`](4d_generic/); they are not the native C++ engine or one common gameplay runtime. No JavaScript build step is required. HTTP is recommended and required for ES-module loading such as Doom. Keep the shared directory alongside the games when copying or deploying them.

## Launch from the QuadCraft repository root

```sh
python3.13 games/run_games.py --list
python3.13 games/run_games.py --game chess doom life
python3.13 games/run_games.py --all --no-browser
```

Each game gets a loopback HTTP listener at `8100 + port_offset`. The document root is `games/`, not the individual game directory. Stop the launcher with Ctrl+C. See [launch operations](doc/launch_operations.md) and [configuration](doc/configuration.md) for mode precedence and JSON overrides.

## Find a game or subsystem

- [Thirty-game inventory and ports](GAMES_INDEX.md)
- [Documentation hub](doc/README.md)
- [Shared browser APIs](doc/shared_modules_reference.md)
- [Python infrastructure](doc/python_infrastructure.md)
- [Logic, structure and real-browser verification](doc/testing_guide.md)
- [Adding a game](doc/contributing.md)

“4D” is the portfolio's naming convention, not four independent physical axes. Use the [canonical portfolio contracts](../docs/games.md) for physical coordinates versus raw board labels, units, graph operators, clocks and RNG ownership. Individual game rules and controllers remain authoritative.
