# UI Documentation - AI Agent Guidelines

## Purpose

Maintain source-bound documentation for distinct browser experiments, native rendering/input and game-specific interfaces. Start with the [canonical quadray contract](../quadray_coordinates.md), [UI index](README.md) and parent [documentation guidance](../AGENTS.md).

## Documents

- [user_interface.md](user_interface.md): implemented surfaces, controls and limitations.
- [interface_design.md](interface_design.md): actual module/layout boundaries and explicitly labeled design discussion.

## Source Boundaries

- [`src/browser/index.html`](../../src/browser/index.html) owns its HTML controls, Canvas renderer, event handlers and gamepad polling.
- [`QuadCraft_Complete_Standalone.html`](../../src/js/experiments/browser/QuadCraft_Complete_Standalone.html) owns a different panel/controller experiment. Do not transfer mouse mappings between pages.
- [`Input.h`](../../src/game/Input.h) and [`Game.cpp`](../../src/game/Game.cpp) define native input and rendering; console diagnostics are not an on-screen HUD.
- [`games/4d_generic/`](../../games/4d_generic/) supplies reusable game helpers; each game's HTML/controller/renderer determines its own UI. [`4d_minecraft/index.html`](../../games/4d_minecraft/index.html) is one concrete example, not a suite-wide component specification.

## Guidelines

1. Trace controls through handlers and callers, not labels/docstrings alone; identify focus, capture, pause and competing status-update behavior.
2. Name source-defined versus exercised behavior. Do not claim a runtime check that was not performed.
3. Describe implemented layout/CSS per entry point. There is no universal `styles/main.css`, native UI component tree or shared theme/localization framework implied by these docs.
4. Mark proposals individually. Do not retain invented APIs, accessibility features or player instructions behind a superficial scope disclaimer.
5. Distinguish rank-three physical quadrays, raw game keys and projected graphics. Do not infer a fixed sum, Euclidean 4D or a solid boundary from four labels.
6. Keep navigation links and useful heading anchors stable. Link coordinate details to the canonical page rather than duplicating incompatible conventions.

[Documentation index](../README.md) · [Reference glossary](../reference/glossary.md)
