# QuadCraft Interfaces and Controls

QuadCraft has multiple experimental interfaces and game-specific pages, not one universal HUD. These documents describe the development checkout from source; runtime usability and accessibility are not certified here. All position displays follow the [canonical coordinate contract](../quadray_coordinates.md).

## Contents

| Document | Description |
| --- | --- |
| [user_interface.md](user_interface.md) | Browser/native/game surfaces, implemented controls and source caveats |
| [interface_design.md](interface_design.md) | Actual layout/module boundaries and explicitly bounded design discussion |
| [AGENTS.md](AGENTS.md) | Guidance for maintaining this documentation |

## Interface Layout

- [Browser painting page](../../src/browser/index.html): HTML controls above a Canvas 2D viewport, with hide/show, camera, paintbrush, file/cookie and server-experiment controls.
- [Standalone analysis experiment](../../src/js/experiments/browser/QuadCraft_Complete_Standalone.html): control/analysis panels and its own Canvas/controller implementation.
- [Native experiment](../../src/game/Game.cpp): OpenGL world, optional colored basis lines, FPS/chunk window-title report and console diagnostics; no common inventory hotbar/menu framework.

Mouse mappings differ between the two browser experiments. See [surface-specific controls](user_interface.md#block-selection-interface).

## Design Principles

Documentation should identify the exact entry point, distinguish source-defined behavior from runtime evidence, and avoid treating a projected marker as a physical solid boundary. Four quadray coefficients represent rank-three Euclidean geometry modulo a common offset, not an extra physical dimension.

## Game-Specific UIs

The [game portfolio](../games.md) has game-owned HTML panels and Canvas renderers, with shared input/camera/lifecycle/HUD helpers in [`games/4d_generic/`](../../games/4d_generic/). It is inaccurate to describe every game as having no shared code or to promise a uniform control scheme.

[`4d_minecraft/index.html`](../../games/4d_minecraft/index.html), for example, provides a Canvas, sidebar analysis and inventory/crafting panels, two crafting buttons and a New World button. Its renderer paints projected square markers, not a complete tetrahedral-face mesh. Game-specific panels are not native engine UI features.

## Cross-References

- [Canonical quadrays](../quadray_coordinates.md) · [Glossary](../reference/glossary.md)
- [Controls and navigation](../game_design/controls_and_navigation.md) · [Games portfolio](../games.md)
- [Documentation index](../README.md)
