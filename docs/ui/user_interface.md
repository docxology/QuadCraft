# QuadCraft User Interface

QuadCraft has several distinct interfaces, not one shared desktop-style UI. This page describes source-defined controls in the development checkout; it is not a record of a browser or native runtime test. Coordinate interpretation follows the [canonical quadray contract](../quadray_coordinates.md).

## UI Components Overview

| Surface | Entry point | Implemented structure |
| --- | --- | --- |
| Browser painting experiment | [`src/browser/index.html`](../../src/browser/index.html) | HTML controls above a Canvas 2D viewport; camera, paintbrush, persistence and debugging controls |
| Standalone analysis experiment | [`QuadCraft_Complete_Standalone.html`](../../src/js/experiments/browser/QuadCraft_Complete_Standalone.html) | Control and analysis panels plus a Canvas viewport; its own embedded controller |
| Native experiment | [`Game.cpp`](../../src/game/Game.cpp), [`Input.h`](../../src/game/Input.h) | OpenGL world, optional basis lines, window-title performance report and console diagnostics |
| Game portfolio | [`games/`](../../games/), [portfolio index](../games.md) | Game-specific HTML and Canvas interfaces with reusable modules under `games/4d_generic/` |

Do not transfer shortcuts or mouse-button meanings between these surfaces.

## Heads-Up Display (HUD)

### Crosshair

The native render path draws chunk meshes and an optional coordinate-axis overlay; it does not implement the previously described animated tetrahedral targeting reticle. The painting experiment uses a selected grid position and paintbrush operations rather than a universal first-person hotbar/crosshair UI.

### Coordinate Display

In `src/browser/index.html`, `display_camQuadLabel` enables labels containing `selq`, Cartesian `camPos`, quaternion `camQ`, and the first gamepad record. This is a diagnostic label, not a Cartesian/quadray format switch or a cell-transition animation.

Four quadray coefficients represent a **three-dimensional** point modulo a common additive offset. They are not distances from four vertices, nor four independent Euclidean axes. A raw game label can retain identity even when another label projects to the same physical position; see the [glossary](../reference/glossary.md#raw-game-label).

## Menus

### Main Menu

The painting page exposes controls directly in a top panel. `displayTopStuff` and Escape hide/show that panel and resize the canvas. This is not a main-menu/world-selection system.

### Pause Menu

There is no common pause menu across implementations. Games using [`BaseGame`](../../games/4d_generic/base_game.js) bind lowercase `p` to pause and display a HUD message. Native Escape is an exit/release-cursor branch, **not** pause: while captured it requests release, otherwise it requests window close. Because it is polled while held, do not rely on Escape as a persistent menu or pause state.

### Settings Menu

The painting page has individual checkboxes and numeric inputs, not a categorized graphics/audio/accessibility settings dialog. Its quaternion-camera checkbox changes how camera controls behave; the `offsetX`, `offsetY`, `zoom`, `angleX`, and `angleY` fields describe the older camera path.

## Block Selection Interface

### Browser painting experiment

The top panel contains a multi-select paintbrush list, shape toggles, direction buttons, grid-dot toggle, code textarea, save/load controls, and diagnostic checkboxes. Its event handlers define:

| Input | Source-defined action |
| --- | --- |
| Left drag | Camera lateral/vertical movement in quaternion mode; pan in legacy mode |
| Right drag | Camera rotation |
| Both mouse buttons dragged vertically | Forward/backward camera movement |
| Wheel | Forward/backward in quaternion mode; zoom in legacy mode |
| Arrow keys | Lateral/vertical camera movement |
| Control / Insert | Forward / backward camera movement |
| Backtick / `1` | Unpaint / paint with current brush |
| `2` | Shoot a rolling ball |
| `q w e r t y`, `a s d f g h` | Twelve source-defined grid-direction commands |
| `z`, `x`, `c`, Space | Toggle Z tetrahedron, octahedron, C tetrahedron, or all three |
| Shift | Toggle grid dots |
| Escape | Hide/show top controls |

Gamepad handling polls the first device: left stick moves laterally/vertically, right stick rotates, triggers move forward/backward, LB/RB unpaint/paint, and A shoots a ball. These are hard-coded mappings, not a rebinding UI. Keyboard handling exempts the code textarea, not every editable input.

The page offers cookie quick-save slots, file controls, and Tomcat-related buttons. Their presence does not establish a deployed server or production multiplayer service. The code-execution button evaluates JavaScript in the page; use only trusted code.

### Standalone analysis experiment

The [standalone HTML](../../src/js/experiments/browser/QuadCraft_Complete_Standalone.html) has its own controls: **left drag rotates**, **right drag pans**, and the wheel zooms. Direction and shape buttons, camera numeric fields, quick-save/file controls and coordinate logging/analysis panels are defined in that file. These mouse bindings differ from the painting page. The separate [`gameController.js`](../../src/js/experiments/browser/js/core/gameController.js) belongs to the modular experiment and must not be assumed to control every HTML entry point.

### Native experiment

[`Input.h`](../../src/game/Input.h) installs GLFW callbacks and per-frame polling:

- The cursor starts uncaptured; a left click captures it without removing a block. Captured mouse motion controls view direction.
- Arrow keys move forward/back/left/right; Page Up/Page Down move vertically even without capture. Captured WASD and Space add forward/back/left/right and upward movement.
- Captured left/right clicks request block removal/stone placement using the camera ray-march result. Wheel input changes camera zoom, not an inventory slot.
- F1 toggles wireframe; F2 toggles the coordinate overlay. The overlay consists of four colored world-space lines placed in front of the camera, not a labeled screen-corner compass.
- Tab capture and F4 console distance-report toggles are present in polling branches, but the key callback also writes their shared key-state array. This source interaction prevents documenting them as runtime-proven reliable one-shot toggles.
- Shift/Control modify speed. Do not advertise Shift as working downward movement: its captured downward branch also requires `!shift`, conflicting with its own modifier state.

[`Game::reportFrameTime`](../../src/game/Game.cpp) writes FPS and rendered-chunk count into the window title. Position/distance diagnostics in `Input.h` use standard output, not an on-screen F3/F4 coordinate panel. No native inventory-selection hotbar is wired in these paths.

## Information Overlays

### Quadray Coordinate Visualizer

Native F2 draws four basis-direction lines colored red, green, blue and yellow. The sandbox game also draws projected basis arrows. Neither implies four physical dimensions or a complete navigation assistant.

### Debug Information Overlay

Diagnostics are surface-specific: browser labels and checkboxes, native console output/window title, and game-specific Canvas/HTML statistics. There is no common memory/network profiler overlay.

### Tetrahedral Grid Overlay

Grid dots and rendered geometric faces in the browser experiment are not a universal cell-boundary visualization. Projected point markers, game connectivity, native tetrahedral meshes and occupied voxel boundaries are different objects; see [model and voxel boundaries](../reference/glossary.md#model-and-voxel-boundaries).

## Game-Specific UIs

[`4d_minecraft/index.html`](../../games/4d_minecraft/index.html) is a concrete example: a 740×560 canvas beside wrapping sidebar panels for block/world information, inventory/crafting, analysis, formulas and controls. It includes Craft Planks, Craft Glass, Verify Math and New World buttons. The HTML animation loop also writes the lower status line, so it can overwrite the shared pause text.

Actual controller bindings in [`minecraft_game.js`](../../games/4d_minecraft/js/minecraft_game.js) select block IDs 1–9 with `1`–`9` and ID 10 with `0`; the page's “1–8” hint is incomplete. Ordinary left click places along +C above a hit block; Alt+click removes; Shift+drag rotates; wheel zooms; lowercase `n` creates a world, `r` resets, and `p` pauses via `BaseGame`.

[`minecraft_renderer.js`](../../games/4d_minecraft/js/minecraft_renderer.js) paints depth-sorted square markers, picks their screen-space faces, displays a raw-label hover tooltip, and draws analysis text. This is not a tetrahedral-face mesh editor. The board has callable time/physics methods, but `MinecraftGame.update()` refreshes analysis rather than advancing those methods; a displayed time value does not establish an automatically advancing day/night simulation.

## Accessibility Features

HTML buttons, labels and text are present, but these sources do not establish suite-wide screen-reader coverage, colorblind modes, text-scale settings, full keyboard navigation or remapping. Canvas-only content requires separate accessibility work; dark colors alone do not establish accessible contrast.

## Design Philosophy

Keep instructions next to the relevant entry point, distinguish camera controls from board commands, and describe the actual selectable geometry. These are design recommendations, not claims of a shared theme/component framework.

## Technical Implementation

There is no `UIManager`/`UIElement` hierarchy documented as a current API here. Portfolio games reuse [`BaseGame`](../../games/4d_generic/base_game.js), [`InputController`](../../games/4d_generic/input_controller.js), and [`HUD`](../../games/4d_generic/hud.js). `HUD` writes text and color to a supplied DOM element; it is not a window, layout, animation or localization system.

## Related Documentation

- [UI index](README.md) · [Implementation and bounded design discussion](interface_design.md)
- [Coordinate contract](../quadray_coordinates.md) · [Glossary](../reference/glossary.md)
- [Controls and navigation](../game_design/controls_and_navigation.md) · [Documentation index](../README.md)
