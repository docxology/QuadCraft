# Shared browser-helper and Python infrastructure suites

Nested directories contain shared JavaScript checks and Python infrastructure/space checks. Per-game logic suites live under each 4d_<key>/tests; real Chromium scenarios live in the separate [browser package](browser/README.md).

From the QuadCraft repository root, `python3.13 games/run_games.py --test` recursively includes shared JS/Python tests and all registered game JS suites. A filtered `--game chess` run normally omits shared suites. See [testing guide](../doc/testing_guide.md) for discovery, subprocess failures, direct-file commands and evidence requirements. Totals must come from an actual recorded run, not this guide.
