# 4D Pac-Man CSS — Presentation maintenance boundaries

[index.html](../index.html) loads [style.css](style.css) after the shared HUD stylesheet. It styles the page layout, canvas element, controls, buttons, HUD and status region.

Canvas entity drawing and projected picking belong to the [JavaScript renderer](../js/README.md), not CSS. Do not change board coordinates, mine rules or movement to address page styling. Keep the actual HTML linkage explicit when moving styles; a directory's presence does not imply it is loaded.

See the [game guide](../README.md) for controls and runtime ownership.
