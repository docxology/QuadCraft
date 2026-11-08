# Monolithic browser world, Var state and save/sync boundaries maintenance

Preserve snapshot-specific serialization and room selection. Check StateMap/LoadMap and sparse cursor code together before changing saves/sync. Do not treat eval as sandboxed, screenshots as current proof, or ball collision heuristics as a production physics system.

Read the adjacent [directory guide](README.md) before changing this area. Report source inspection separately from executed runtime checks.
