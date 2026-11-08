# Maintaining GameScaffold templates

This is the Python generator package, not a game; template placeholders are not its own entrypoints. Read [scaffold guide](../../doc/scaffold_guide.md) and the actual string generators in `__init__.py`.

Keep generated HTML/script order, constructor signatures, projection options, clock units and exports aligned with real shared APIs. Optional imports do not imply inheritance/adoption. `create` writes multiple files and can overwrite generated files; do not run it against existing user content without authorization. `validate` checks presence only.

Document current default-path, projection, camera-sync and local-server limitations honestly until a separately authorized source fix lands. Generated board step/default assertions are not implemented rules or completion evidence. Registry, ports, browser scenarios and meaningful game docs need explicit integration.
