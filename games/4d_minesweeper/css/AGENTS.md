# 4D Minesweeper CSS — Presentation maintenance boundaries

[style.css](style.css) contains page, canvas, controls, button, HUD and status rules, but the current [index.html](../index.html) does not link it; that entrypoint uses inline page styles and the shared HUD stylesheet. Editing this local file alone does not change the current game page.

Canvas entity drawing and projected picking belong to the [JavaScript renderer](../js/README.md), not CSS. Do not change board coordinates, mine rules or movement to address page styling. Keep the actual HTML linkage explicit when moving styles; a directory's presence does not imply it is loaded.

See the [game guide](../README.md) for controls and runtime ownership.
