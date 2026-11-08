# Python metadata registry for shared JavaScript files

`__init__.py` defines `JSModule`, `ModuleRegistry` and `resolve_module_path(filename)`. The registry returns metadata/dependency ordering and file-presence reports; it does not execute JavaScript, inject script tags or provide game state.

See [Python interfaces](../../doc/python_infrastructure.md) for methods and [browser APIs](../../doc/shared_modules_reference.md) for actual JS signatures. The registry has sixteen JS definitions, omits graph_field/CSS, and inherits the [default-path defect](../../doc/configuration.md); “coverage” here means configured-file presence, not test coverage.
