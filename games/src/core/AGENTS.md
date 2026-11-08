# Maintaining game registration and config policy

Read [configuration](../../doc/configuration.md). Keep `GAMES` keys, directory names and unique offsets synchronized with callers, master shell key lists, explicit launch JSON and the game index. `load_config` is JSON loading, not schema validation.

Do not claim CLI flags always override JSON: current launcher JSON base_port/open_browser override them. Module lists describe validation policy, not universal use or the complete disk inventory. Source path constants currently resolve games/games; do not conceal that defect in examples. Inspect actual consumers before changing these shared constants.
