# 4D Minecraft JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Do not silently wire board physics into the analysis-only controller. Preserve raw block occupancy and face-based picking. External world edits must invalidate analysis with `markAnalysisDirty()`.

The board exposes `stepPhysics()`, `stepTime()`, `update()` (both steps), and `craft(recipeType)`. However, the default `MinecraftGame.update()` only refreshes cached analysis; it does not call `board.update()`, so sand/water and day/night do not advance automatically. Board physics drops sand/water along -C and uses bounded canonical neighbors for water spreading.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
