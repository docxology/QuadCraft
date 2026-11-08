# Static loopback game server and browser launcher

`launcher.py` exports `GameServer(game_key, base_port, games_dir, open_browser=True)`, `GameHTTPServer`, `QuietHTTPHandler` and `open_url(url)`. `start()` returns success and `stop()` closes the listener. Each handler serves the actual games root without changing cwd; request threads are daemonized.

Use `python3.13 games/run_games.py --game chess --no-browser` from the QuadCraft repository root. This static server is not multiplayer or a save backend. [Launch operations](../../doc/launch_operations.md) covers lifecycle, paths and ports.
