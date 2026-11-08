# QuadCraft UI Design

This page separates implemented interface structure from possible design work. It describes the development checkout from source, not a tested visual specification. Start with the [implemented controls](user_interface.md) and [canonical coordinate contract](../quadray_coordinates.md).

## Design Philosophy

A useful interface must identify its entry point, input mode and coordinate semantics. QuadCraft's browser painting experiment, analysis experiments, native renderer and game portfolio have different controls and layouts. A consistent future design is a proposal, not an existing shared UI framework.

## UI Component Hierarchy

The actual ownership boundaries are:

- [`src/browser/index.html`](../../src/browser/index.html): DOM controls, Canvas drawing, camera/input and persistence experiment in one page.
- [`QuadCraft_Complete_Standalone.html`](../../src/js/experiments/browser/QuadCraft_Complete_Standalone.html): embedded control/analysis panels and controller; not the same mouse mapping as `src/browser/index.html`.
- [`src/game/Game.cpp`](../../src/game/Game.cpp) and [`Input.h`](../../src/game/Input.h): OpenGL rendering and GLFW input callbacks/polling, with console diagnostics.
- [`games/4d_generic/base_game.js`](../../games/4d_generic/base_game.js): shared lifecycle, camera synchronization, input and HUD updates for subclasses. Game HTML still owns its panels and buttons.

The earlier `UIElement`, `UIContainer`, `UIButton`, `UIProgressBar` and `RootUI` diagrams were not descriptions of implemented APIs. Do not write integrations against those names on the basis of this document.

## HUD Elements

### Hotbar

Native input places stone and removes blocks; its wheel changes camera zoom. It does not select nine inventory slots. The Minecraft portfolio game selects ten block IDs with number keys but displays the selection as text, not the previously specified item-count/durability hotbar. See [`minecraft_game.js`](../../games/4d_minecraft/js/minecraft_game.js).

### Player Information

There is no shared health/stamina/hunger/experience widget. Individual games supply their own status strings or panels. [`HUD`](../../games/4d_generic/hud.js) assigns `textContent` and a color for playing, paused, warning, win/loss or arbitrary text; it also provides a lives-string helper.

### Crosshair

The reviewed native render path draws meshes and optional axis lines, not a context-animated crosshair. In the sandbox, selection comes from the projected square-marker hit test, not a central ray reticle. Its tooltip reports the selected block's stored four-component label.

### Tetrahedral Compass

Native F2 enables four colored basis-direction lines in world space near the camera. Minecraft draws projected basis arrows at the origin. These are not a compass-ring widget, a four-dimensional orientation display or a pathfinding assistant.

### Coordinate Display

The painting page's `display_camQuadLabel` checkbox exposes diagnostic position/orientation labels. Native position reporting functions print to the console. Coordinate panels must distinguish **raw labels** from **physical positions**: common offsets leave the projected point unchanged, but raw game keys can remain distinct. There is no requirement for a fixed component sum. See [glossary](../reference/glossary.md#quadray-coordinates).

## Menu System

### Main Menu

The painting page starts with controls and viewport, not world-selection/achievements/credits menus. The Minecraft page has inline panels and a New World button. Do not infer an engine-wide menu from a game's HTML button.

### Pause Menu

`BaseGame` binds lowercase `p` to its game-loop pause operation and HUD message. There is no generic blurred pause-menu overlay. The Minecraft HTML has an additional status update loop that can replace that HUD text. Native Escape requests cursor release or window close, not pause.

### Inventory Menu

The Minecraft page has inventory counts for wood, sand, planks and glass. This is a small HTML statistics panel, not drag-and-drop equipment slots, item rarity sorting or a rotatable player preview.

### Crafting Interface

[`4d_minecraft/index.html`](../../games/4d_minecraft/index.html) directly calls `game.board.craft('planks')` and `game.board.craft('glass')` from two buttons. Describe those concrete model operations, not a three-dimensional recipe-grid UI or a recipe-discovery system.

### Settings Menu

The browser painting page exposes camera/render/debug checkboxes and legacy numeric camera fields. There is no common categorized settings dialog, preset manager or control-rebinding screen in the source paths above.

## Overlay Elements

### Notifications

The shared HUD can replace its text with a status/warning; it does not implement queued, prioritized, sliding notification windows. Such a system would be a separate design choice.

### Tooltips

Minecraft's Canvas tooltip draws the hovered raw coordinate label near the pointer. HTML `title` attributes explain some painting-page checkboxes. Neither provides the earlier multi-level equipment-comparison tooltip API.

### Block Selection

[`minecraft_renderer.js`](../../games/4d_minecraft/js/minecraft_renderer.js) paints square markers back-to-front and picks the last painted face containing the pointer. Click placement is relative to the hit block's stored label. A marker's screen boundary is not a geometric tetrahedral face or a measured solid boundary.

Native block interaction ray-marches sampled positions through the world API. Do not describe it as an exact triangle-face intersection test or promise a face-highlight/placement-preview overlay.

## Debug UI

### Performance Metrics

Native FPS and rendered-chunk count appear in the window title through `Game::reportFrameTime`. The painting experiment has diagnostic labels and controls. Neither is the earlier specified F3 memory/network profiler with history graphs.

### Coordinate Debug

Browser labels can show selected quadray, Cartesian camera position and quaternion orientation. Native F4 has a console distance-report branch; Tab/F4 also share key-state storage with the key callback, so source presence alone is not proof of reliable toggle behavior. See [native control caveats](user_interface.md#native-experiment).

### Entity Information

Do not advertise a common collapsible entity inspector, hitbox viewer or per-entity profiler. A game-specific diagnostic must be documented with its actual controller and render path.

## UI Technical Implementation

### Component Architecture

Portfolio code reuses small modules: [`InputController`](../../games/4d_generic/input_controller.js) maps keyboard events to callbacks and tracks pressed keys; [`BaseGame`](../../games/4d_generic/base_game.js) synchronizes camera/render/HUD state; [`HUD`](../../games/4d_generic/hud.js) updates a DOM element. These are not a retained-mode native UI tree.

### Layout System

The painting page lays out controls in HTML tables above a canvas and recomputes the visible canvas dimensions when the window/panel changes. The Minecraft page uses a wrapping flex container for a fixed-size canvas and a sidebar. The standalone analysis page has its own panel CSS. There is no shared nine-point anchoring, radial-layout or safe-area engine.

### Animation System

Game render loops and a flashing selected browser grid point are not a reusable UI tween/sequence system. Dedicated animation curves, completion events and `UIAnimation` classes from the earlier specification are not current APIs.

### Theming System

Minecraft defines page-local CSS colors and includes [`hud-style.css`](../../games/4d_generic/hud-style.css). Browser experiments have separate styles. These are not a `ThemeManager`, runtime theme files or suite-wide user-selectable palettes.

### Input Handling

Native input uses GLFW callbacks plus polling; the painting page handles DOM events and polls a gamepad; shared portfolio input handles keyboard `keydown`/`keyup` with per-game bindings. There is no common bubbling `InputEvent`/`FocusManager` API. Editable-field focus handling differs between experiments and should not be generalized.

## Accessibility Features

**Design discussion, not implemented suite-wide behavior:** preserve visible labels, provide keyboard alternatives for pointer-only actions, expose meaningful Canvas state as text, test contrast, avoid color-only distinctions and respect motion preferences. The current source does not establish screen-reader completeness, dyslexia-specific fonts, colorblind modes or a remapping dialog. HTML controls alone do not demonstrate compliance.

## Localization Support

The reviewed pages use literal strings. Translation tables, pluralization, language-specific fonts, RTL layout and `LocalizationManager` are possible future work, not a supported framework described by these sources.

## Mobile UI Adaptations

Wrapping HTML panels are not evidence of touch-complete gameplay. Virtual joysticks, pinch/swipe mappings, voice control and mobile safe-area handling are not promised here. Any mobile design must name the entry point and provide actual bindings before being documented as available.

## HUD Customization

The painting page can hide the top panel and toggle specific diagnostics. This is not a draggable HUD editor, saved layout profiles, per-widget opacity/scale system or shareable presets. Those remain optional design ideas, not player instructions.

## Conclusion

Keep source and design separate. For changes, document the actual HTML/controller/render path and the distinction between model occupancy, projected markers and physical boundaries. Use the [canonical coordinates](../quadray_coordinates.md) rather than inferring geometry from “4D” game names or UI labels.

[UI index](README.md) · [Controls and surfaces](user_interface.md) · [Reference glossary](../reference/glossary.md) · [Documentation index](../README.md)
