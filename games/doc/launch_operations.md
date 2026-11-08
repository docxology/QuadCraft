# Serving portfolio games over loopback HTTP

All commands below run from the QuadCraft repository root. Use Python 3.13 explicitly for reproducible tooling; the launcher itself accepts Python 3.10+.

```sh
python3.13 games/run_games.py --list
python3.13 games/run_games.py --game chess doom snake
python3.13 games/run_games.py --all --no-browser
python3.13 games/run_games.py --all --base-port 9000
python3.13 games/run_games.py --config games/games_config.json
```

## CLI reference

| Option | Effect |
|---|---|
| `--game`, `-g NAME [NAME ...]` | Select registry keys |
| `--all`, `-a` | Select all thirty keys |
| `--list`, `-l` | Print names, directories and ports |
| `--base-port`, `-p N` | Base port, default 8100 |
| `--no-browser` | Suppress best-effort browser opening unless JSON overrides it |
| `--config`, `-c FILE` | Load JSON selection, port and browser settings |
| `--test`, `-t` | Run selected/full logic suites instead of serving |
| `--validate`, `-v` | Audit all registered directories; not filtered by `--game` |

See [configuration](configuration.md) for actual mode/JSON precedence. No arguments prints help; it does not launch every game. Default ports are 8100–8129; a base of 9000 gives 9000–9029. Full inventory: [GAMES_INDEX.md](../GAMES_INDEX.md).

## Document root and server lifecycle

[`GameServer`](../src/server/launcher.py) takes `(game_key, base_port, games_dir, open_browser=True)`. It serves the parent of the resolved game's directory, so `/4d_chess/index.html` and `/4d_generic/quadray.js` share a root. It never changes process cwd. The threaded loopback server uses daemon request threads and the OS listen backlog to accommodate concurrent classic-script loads; this is not a request-retry mechanism. `start()` returns a boolean and `stop()` shuts down/closes the listener and joins the serving thread. A computed port of zero requests an OS-selected port and publishes the actual port.

Ctrl+C or SIGTERM stops the CLI's started servers. A missing directory/index or occupied port makes that game's start fail; the CLI can continue with other successful games. Browser opening is best-effort (`open`, `xdg-open`, or Windows `startfile`); use the printed URL if no window appears. This is local static serving, not authenticated hosting, synchronized multiplayer or a save server.

For a single manual listener, still serve the complete games root:

```sh
python3.13 -m http.server 8080 --bind 127.0.0.1 --directory games
```

Open `http://127.0.0.1:8080/4d_chess/`. Do not serve only `games/4d_chess/`; sibling imports would 404. Do not rely on `file://` for ES modules.

## Shell wrappers

From the repository root, `./games/run.sh chess doom` delegates to the Python launcher. No wrapper arguments launches all games; `--list` uses its own shell list. Leading `--test`, `--validate`, `--all`, or `--config` forwards arguments; arbitrary Python flags are not accepted in every wrapper position. Use the direct Python entrypoint for unambiguous flag combinations/interpreter choice. Generated per-game wrappers and scaffold `run.sh` differ; see [scripts](scripts_reference.md) and [scaffold limitations](scaffold_guide.md).

## Troubleshooting without hiding failures

- Port unavailable: inspect with `lsof -i :8100`, then choose another base or stop only a process you own.
- Shared imports 404: inspect server root and the printed `/4d_<key>/` URL.
- Missing class: inspect script order and browser console/network diagnostics.
- Empty canvas: inspect projection inputs and camera bounds; successful HTTP alone does not verify rendering.
- Unknown key: use `--list`, not a display name or directory name.

[Testing](testing_guide.md) separates server availability, structural checks, logic and browser interaction evidence.
