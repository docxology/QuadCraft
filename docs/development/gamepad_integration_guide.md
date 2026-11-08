# First-slot gamepad polling in the browser experiment

[Development index](README.md) · [Quaternion camera](quaternion_camera_system.md) · [Brush behavior](paintbrush_system.md)

## Existing implementation

[`src/browser/index.html`](../../src/browser/index.html) calls `updateFromGamepad(dt)` from `draw()`. `dt` is clamped elapsed **seconds**. The function polls `navigator.getGamepads()`, takes slot `[0]` and returns if it is absent. Connection/disconnection event handlers log events; they do not implement a device-selection UI.

This mapping belongs to that geometry experiment, not native GLFW input or a universal portfolio controller layer. It assumes a conventional four-axis/button layout and does not validate every controller's mapping.

## Hard-coded controls

| Input | Source behavior |
|---|---|
| Axes 0/1 | Left/right and up/down displacement |
| Axes 2/3 | Camera rotation; vertical axis inverted |
| Buttons 6/7 analog values | Backward/forward triggers; combined input also contributes to roll leveling |
| Buttons 4/5 | Left bumper unpaints / right bumper paints when exactly one is active |
| Button 0 | Calls `shootBallIfReady()` while held |

Both stick vectors use a radial dead zone of 0.06; triggers use their own 0.06 threshold with rescaling. The function calls `rotateCamera` and `moveCamera` with already time-scaled increments. Those camera functions do not apply dt again. Paint/shoot polling is level-triggered, not a generic pressed/released edge-state machine.

Ball unpainting is implemented; the same [brush mask](paintbrush_system.md) also exposes non-ball types whose unpaint branches are incomplete. Input support does not repair those underlying operations.

## Browser capability limits

Gamepad exposure depends on browser/platform permissions, secure-context policy and sometimes a user interaction before devices appear. Use the real browser console to inspect `navigator.getGamepads()` and the reported axes/buttons. Do not treat an empty slot as an application-connected controller, fabricate device events or promise identical mappings across devices.

The actual source has no saved calibration/remapping profiles, adaptive dead-zone algorithm, multi-controller arbitration, input recording/playback or haptic effect system. Browser vibration capabilities alone do not mean QuadCraft implements rumble.

## Native and portfolio inputs are separate

Native [`Input.h`](../../src/game/Input.h) processes GLFW keyboard/mouse state; this page's JavaScript function is not a native gamepad binding. Portfolio games use game-specific controllers plus helpers such as [`input_controller.js`](../../games/4d_generic/input_controller.js); see the selected game's controls instead of assuming this map applies.

## Design considerations retained

Controller selection, explicit mapping validation, action-edge semantics, user-configurable dead zones and accessibility remapping would be useful additions if implemented. Their ownership and compatibility need real source and consumer tests before they can become setup recipes. Current instructions intentionally describe the existing polling function rather than fictional `GamepadState` or `ControlMapper` classes.
