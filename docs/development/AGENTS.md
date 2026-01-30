# Development Documentation - AI Agent Guidelines

## Purpose

Technical guides for developers working on QuadCraft.

## Document Categories

### Core Systems (Most Critical)

- `architecture.md` - Overall design
- `chunk_system.md` - World partitioning
- `entity_system.md` - Game objects

Changes to these affect fundamental architecture.

### JavaScript Implementation

- `javascript_implementation.md` - Browser version
- `javascript_performance_optimization.md` - Speed tuning
- `realtime_code_evaluation.md` - Dynamic code

Most actively used for browser development.

### Advanced Features

Specialized systems with complex implementations:

- Cone-plane intersection for rendering
- CCP ball grid for physics
- Paintbrush for creation tools

## Guidelines

### Updating Documents

1. Keep synchronized with code
2. Update code examples when implementations change
3. Note deprecated approaches
4. Version-tag significant changes

### Adding Documents

1. Follow existing naming conventions (snake_case)
2. Add to README.md index
3. Cross-reference related docs
4. Include practical examples

### Quality Standards

- Accurate code examples
- Clear explanations
- Diagrams for complex concepts
- Step-by-step instructions for setup
