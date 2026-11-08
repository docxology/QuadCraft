# Game Design Documentation - AI Agent Guidelines

## Purpose

Documents distinguish source-defined gameplay from bounded design discussions. Use the [coordinate contract](../quadray_coordinates.md) and [design index](README.md); do not combine native, browser-painter and portfolio features into a nonexistent common engine.

## Audience

- Game designers
- Players wanting to understand mechanics
- Developers implementing features

## Document Purposes

### gameplay_overview.md

Core game experience:

- What players do
- Game modes
- Progression (if any)

### world_generation.md

Source-specific generation:

- Native Cartesian sampling and sine-based fields
- Minecraft raw-slot terrain initialization and bounds limitations
- Model methods versus default-loop integration

### block_system.md

Building system:

- Native elements, painter brushes and raw game slots as separate representations
- Actual placement, inventory and key policies
- Material flags and names versus unimplemented mechanical properties

### controls_and_navigation.md

Input handling:

- Key mappings
- Mouse controls
- Navigation system

### advanced_building_techniques.md

Building in tetrahedral space:

- Explicit geometric paths and symmetry exercises
- Ideal solids versus actual native meshes and game markers
- Design hypotheses, not structural stability or easier-building guarantees

## Guidelines

### Updating for Gameplay Changes

1. Trace controls and features through the actual entrypoint, controller, model and renderer.
2. Distinguish implemented model methods from methods invoked by the ordinary game loop.
3. Correct misleading body text, rather than adding a warning over invented API recipes.
4. Preserve useful navigation and describe check evidence only when exercised under the assignment's policy.

### Balancing Considerations

When documenting gameplay values:

- Identify source-defined values and their units, not assumed optimal tuning.
- Present rationale and possible changes as design hypotheses unless measured.
- Do not claim structural, learning or performance advantages from coordinates alone.

### Player Perspective

Write as if explaining to new players:

- Clear, accessible language
- Define tetrahedral/quadray concepts
- Provide context for unique mechanics
