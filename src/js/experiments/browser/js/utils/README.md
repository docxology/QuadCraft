# Experiment constants, units and configuration namespaces

[constants.js](constants.js) declares classic-script bindings `ROOT2 = Math.SQRT2`, `S3 = sqrt(9/8)`, `GAME_CONFIG`, geometry/direction tables, logging/analysis/export configuration and utilities. Consumers also use its `constants` namespace; it is not a named-export module.

`GAME_CONFIG` contains `SIDE`, `CUBE_SIZE`, `QGRID_BOOT_DEPTH`, camera defaults and `CAMERA_PAN_SPEED`; old documentation's `CAMERA_SPEED`, `GRID_SIZE`, `MAX_RENDER_DISTANCE` and CSS palette examples were not this interface. Distinguish display scaling from physical embedding units.

`LOGGING_CONFIG.LOG_INTERVAL_MS` and `AUTO_EXPORT_INTERVAL` are milliseconds. Configuration limits are intended caps, not demonstrated frame-rate or memory guarantees. Read exact consumer code before interpreting a configuration value as enforced behavior.
