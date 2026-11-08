# Maintaining shared-script metadata

Read [metadata interfaces](../../doc/python_infrastructure.md) and `__init__.py`. Keep filename dependencies aligned with actual browser consumers; declared topological order is not runtime adoption. This Python directory contains metadata, not Quadray/InputController JS implementations.

Check config lists and real HTML when adding a script; core policy, optional policy, registry definitions and disk assets are distinct sets. `JSModule.path`/exists and path resolution currently use flawed default roots; do not interpret missing reports as proof a real file is absent. Link [canonical browser APIs](../../doc/shared_modules_reference.md) instead of duplicating invented signatures here.
