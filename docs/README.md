# QuadCraft documentation: implementation, games, and design context

## Choose an implementation

QuadCraft contains a C++17 tetrahedral prototype, historical browser/server geometry experiments and a separate thirty-game browser portfolio. They share quadray ideas, not one unified engine/API. Start with [architecture boundaries](architecture.md).

| Goal | Start here |
|---|---|
| Build native or serve browser games | [Setup guide](development/setup_guide.md) |
| Run/check a game | [Portfolio and runtime contracts](games.md), [catalog](../games/GAMES_INDEX.md) |
| Work on native world/meshes | [Chunk lifecycle](development/chunk_system.md), [C++ API](development/api_reference.md), [real-GL captures and limits](development/testing_guide.md#real-opengl-rendering-and-framebuffer-artifacts) |
| Understand browser geometry snapshots | [JavaScript map](development/javascript_implementation.md) |
| Verify changes | [Testing commands and coverage limits](development/testing_guide.md) |
| Find specialized implementation topics | [Development guide index](development/README.md) |

The implementation guides replace hypothetical SDK/class recipes with actual source interfaces. Conceptual sections remain explicitly design context. In particular there is no shipped native ECS, general rigid-body physics engine, mod loader, asset importer or production multiplayer service.

The [v0.6.0 source notes](../CHANGELOG.md#v060--2026-11-09) align with QuadMath 0.7.0 and symergetics 1.4.0. The authoritative [suite guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md) owns coordinated coordinate conversion, observed interoperability and exact-ref source/package evidence; this index is not a release publication or passing CI receipt. Consult [current workflows](https://github.com/docxology/QuadCraft/actions) for executed evidence.

## Core documentation

- [Architecture: runtime families and ownership](architecture.md)
- [Quadray coordinates in the implementation](quadray_coordinates.md)
- [Games: raw slots, physical graphs, time, RNG and transport](games.md)

Physical quadrays describe three dimensions modulo a common coefficient offset. Raw four-index game slots may intentionally remain independent. Never infer physical topology or metric from a game's “4D” title alone.

## Mathematics

- [Quadray foundations](mathematics/quadray_coordinates.md)
- [Tetrahedral geometry](mathematics/tetrahedral_geometry.md)
- [IVM and Synergetics](mathematics/ivm_synergetics.md)

Use the implementation's declared scale/orientation when transferring equations. Native/shared JS use a Y/Z exchange and `1/sqrt(2)` scale relative to the suite's default mathematical embedding; see the [suite guide](https://github.com/docxology/symergetics/blob/main/docs/synergetics-suite.md).

## Game design and controls

- [Gameplay overview](game_design/gameplay_overview.md)
- [World generation](game_design/world_generation.md)
- [Block system](game_design/block_system.md)
- [Controls and navigation](game_design/controls_and_navigation.md)
- [Advanced building techniques](game_design/advanced_building_techniques.md)

Read each page's implementation/design scope. For a portfolio game's actual controls and state, use its own page and source rather than assuming native or historical experiment controls apply.

## Browser geometry experiments

- [CCP range storage](development/ccp_ball_grid_system.md)
- [Cone-plane sphere silhouettes](development/cone_plane_intersection_rendering.md)
- [Brush masks and composition](development/paintbrush_system.md)
- [Quaternion-array camera](development/quaternion_camera_system.md)
- [Gamepad polling](development/gamepad_integration_guide.md)
- [Trusted eval and its limits](development/realtime_code_evaluation.md)
- [JSP state synchronization](development/multiplayer_system.md)

These are snapshot-specific experiments, not features available in every game. Static HTTP serving does not execute JSP, and direct eval is not a sandbox.

## User interface and reference

- [UI index](ui/README.md), [user interface](ui/user_interface.md), [interface design](ui/interface_design.md)
- [Glossary](reference/glossary.md)
- [Technical papers](other/): [framework](other/QuadCraft_%20Technical%20Framework%20for%20a%20Tetrahedral-B.md), [coordinate analysis](other/Quadray%20Coordinates_%20A%20Comprehensive%20Analysis%20of%20T.md), [geometric formalization](other/Quadray%20Coordinates_%20Technical%20and%20Geometric%20Forma.md), [conversion supplement](other/Technical%20Supplement_%20Dimensional%20Conversion%20Betwe.md)

Research/design prose is not evidence that an API or gameplay subsystem exists. Follow linked implementing code before reusing a recipe.

## Contributing to documentation

Keep page titles specific, navigation modular and examples bound to actual signatures. Link shared contracts rather than copying inconsistent formulas or test totals. Label historical receipts by date/version; commands describe what to run, not a new passing result. Update indexes and inbound heading links when reorganizing a page. See [documentation maintenance rules](AGENTS.md).

## License

See [LICENSE](../LICENSE) for Apache 2.0 terms.
