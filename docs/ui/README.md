# User Interface Documentation

UI design, components, and interaction documentation for QuadCraft.

## Contents

| Document | Description |
| --- | --- |
| [user_interface.md](user_interface.md) | UI design system, layout, and components |
| [interface_design.md](interface_design.md) | Detailed interface design specifications |

## Interface Layout

```text
┌──────────────────────────────────────────────┐
│  Crosshair (center)                          │
│  ┌──────────┐                 ┌────────────┐ │
│  │ Block    │                 │ Coordinates│ │
│  │ Selector │                 │ Display    │ │
│  │ (1-9)    │                 │ (x,y,z)   │ │
│  └──────────┘                 │ (a,b,c,d) │ │
│                               └────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ Hotbar                                   │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Design Principles

- **Clean & Minimal** — UI elements don't obstruct the 3D viewport
- **Dark Theme** — semi-transparent overlays with high contrast text
- **Information-Dense** — show both Cartesian and Quadray coordinates
- **Keyboard-Driven** — most actions accessible via keyboard shortcuts
- **Responsive** — adapts to window size changes

## Game-Specific UIs

Each of the 12 standalone browser games has its **own HTML/Canvas-based UI** independent of the core engine UI:

- Games use HTML5 Canvas for rendering (no WebGL dependency)
- Each game includes its own control panel, score display, and status indicators
- UI components are defined in `games/<name>/js/<name>_renderer.js`
- No shared UI framework across games — each is self-contained

See [Games Overview](../games.md) for the full portfolio.

## Cross-References

- [Controls & Navigation](../game_design/controls_and_navigation.md) — keyboard/mouse bindings
- [Games Portfolio](../games.md) — game-specific UI implementations
