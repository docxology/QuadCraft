# Controls and Navigation by QuadCraft Entrypoint

Choose the program you are running before using a control table. Native GLFW, the browser painter and the standalone games do not share one input system. This is a source-based guide, not a claim that all hardware or every prototype shortcut was interactively exercised.

[Design index](README.md) · [UI overview](../ui/user_interface.md) · [Coordinate contract](../quadray_coordinates.md) · [Portfolio index](../../games/GAMES_INDEX.md).

## Basic Movement Controls

### Shared Portfolio Camera and Zoom

[CameraController](../../games/4d_generic/camera.js) supports two configured modes:

| Configured mode | Rotation gesture |
| --- | --- |
| `shift-drag` (default) | Shift+drag or right-button drag |
| `left-drag` | Left-button drag |

[attachZoom](../../games/4d_generic/zoom.js) multiplies renderer scale by 1.08 on wheel-up and 0.92 on wheel-down, then clamps to each game's configured bounds. This rotates/zooms a view; it is not embodied player locomotion. Per-game actions and overrides must be checked in that game's controller. BaseGame-derived games bind lowercase `p` to pause and `r` to reset; [InputController](../../games/4d_generic/input_controller.js) matches `event.key` case-sensitively. This is not a promise about every independent entrypoint.

### Portfolio 4D Minecraft

The actual handlers in [minecraft_game.js](../../games/4d_minecraft/js/minecraft_game.js), rather than its stale `1–8` comment/HUD hint, define:

| Input | Action |
| --- | --- |
| Plain left-click on a block marker | Attempt placement at raw `(a,b,c+1,d)` |
| Alt+left-click on a block marker | Remove the hovered raw slot |
| Shift+drag or right-button drag | Rotate camera |
| Scroll wheel | Zoom; scale bounded to 12–80 |
| `1`–`9`, `0` | Select block IDs 1–9, then 10 (glass) |
| lowercase `n` | Reset board to a newly randomized world, preserving score manager state |
| lowercase `r` | Reset score manager and board through base reset |
| lowercase `p` | Pause/resume the game loop |

The action handler ignores Shift and non-left buttons; right-button drag is therefore not the native right-click placement action. Picking uses last-painted square bounds, not an exact 3D raycast. Placement consumes stock and requires an empty target, but does not select an arbitrary tetrahedral face or enforce all component bounds.

The [board](../../games/4d_minecraft/js/minecraft_board.js) exposes physics/time/crafting methods, but the normal game update only refreshes analysis and binds no crafting key. The [HTML page](../../games/4d_minecraft/index.html) separately supplies Craft Planks/Glass buttons that call its recipes and a New World button that invokes `newWorld()`. Neither page nor controller advances the board's physics/time methods in the ordinary loop. See [model versus active loop](gameplay_overview.md#model-methods-versus-active-game-behavior).

### Other Portfolio Games

Board titles typically use click selection, while arcade titles have their own movement/action handlers. [Games index](../../games/GAMES_INDEX.md) identifies entrypoints and input styles. A source's use of `WASD` in an FPS does not make WASD a universal game control, and a geometry-analysis overlay does not imply a shared `F3` debug menu.

## Native Prototype Controls

The native [Input](../../src/game/Input.h) source defines a different camera and block interaction path:

| Input | Source behavior |
| --- | --- |
| Left-click while cursor is free | Capture mouse; that click is not a removal action |
| Mouse motion while captured | Camera look |
| Captured `W/A/S/D` | Forward/left/back/right camera motion |
| Arrow keys | Camera motion even without capture |
| Page Up / Page Down | Vertical camera motion even without capture |
| Space while captured | Upward camera motion, not a gravity-based jump |
| Shift / Control / both | Speed multipliers, further scaled by distance from origin |
| Home / End | Large forward/back debug movement |
| Captured left/right button | On sampled hit: remove / place stone at previous ray sample |
| Scroll wheel | Camera scroll processing |
| `F1`, `F2` | Key callback requests wireframe / overlay toggles |
| Escape | Release capture, or request close while already uncaptured |

The source also contains Tab mouse-capture and F4 console-distance polling branches. They share `keyStates` with the key callback, so this documentation does not promise that their polling edge detection works for every callback ordering. Do not infer F1–F8 menus, screenshots, jump/fall physics, a survival HUD or a reliable Shift-to-descend action: the latter's current branch combines a left-Shift press with `!shift`, while `shift` already includes left Shift.

Native block ray marching queries continuously converted storage keys, not geometric face intersections. These limitations matter when interpreting a missed click or adjacent-placement claim; see [geometry](../mathematics/tetrahedral_geometry.md#raycasting).

## Browser Painter Controls

The monolithic [src/browser/index.html](../../src/browser/index.html) has its own visible instructions and handlers:

- Arrow keys or left-button drag move left/right/up/down.
- Control/Insert or dragging both mouse buttons moves forward/backward.
- Right-button drag turns the view.
- Backtick unpaints and `1` paints with the current brush.
- The page also contains gamepad joystick/trigger/button handling and selectable tetrahedral, octahedral and ball brushes.

These are experiment-specific controls, not portfolio key bindings. Use the live page's labels for options such as quaternion camera and brush selection; those controls do not establish a common gamepad SDK, cross-platform hardware support or accessible controller navigation. The separate modular browser experiment has its own [gameController](../../src/js/experiments/browser/js/core/gameController.js); do not assume its state/API matches the monolithic page.

## Tetrahedral Coordinate Navigation

Moving along a coefficient direction changes an oblique Cartesian vector under the [rank-three embedding](../quadray_coordinates.md#coordinate-conversion). `+C` is not a universal physical vertical axis. Adding the same amount to all four coefficients produces **no physical movement**, although a raw-label game may regard the destination as a different slot.

Rotating the projected camera cannot separate physically coincident common-offset aliases. Changing tuple display, occupancy semantics or the game's rules is a different operation. Tetrahedral coordinates remain Euclidean geometry; unfamiliar angles are not non-Euclidean curvature.

## Control Customization and Accessibility Design

Rebinding, touch joysticks, controller haptics, vehicle operation, gliding, wall-climbing and guided movement tutorials are not common implemented capabilities established by these sources. A future input design would need explicit event ownership, focus handling, device support and tested accessibility requirements. No runnable shortcuts for those ideas are specified here.

For current visual feedback and layout boundaries, continue to [UI overview](../ui/user_interface.md) and [interface design](../ui/interface_design.md).
