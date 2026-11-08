# Registry and infrastructure configuration

`registry.py` defines `GAMES` metadata (`dir`, `name`, `port_offset`), `get_port(key, base_port=None)` and JSON `load_config(path)`. `config.py` supplies module-policy lists, required-file patterns and default port/path constants.

The [game inventory](../../GAMES_INDEX.md) maps all thirty keys/ports. [Configuration](../../doc/configuration.md) documents actual JSON precedence and the current nested games/games path-default defect. The CLI resolves its own correct root; library callers should not assume `GAMES_DIR` is correct.
