# Source Code - AI Agent Guidelines

## Overview

This directory contains three parallel implementations of QuadCraft. Each approach has different strengths and varying levels of completeness.

## Implementation Status

| Implementation | Status | Primary Use |
|----------------|--------|-------------|
| C++ Native | Foundation | High-performance rendering |
| Browser Standalone | Active | Quick testing and play |
| JS Modular | Active | Development and analysis |
| Server Backend | Experimental | Multiplayer sync |

## Development Priorities

### Browser/JS Priority

The browser implementations (`browser/` and `js/experiments/browser/`) are the most actively developed:

- Most features implemented here first
- Better for rapid prototyping
- Includes analysis and visualization tools

### When to Modify C++

- Performance-critical features
- OpenGL-specific rendering
- Native application requirements

### When to Modify Server

- Save synchronization between clients
- Multiplayer features
- Persistent storage

## Key Patterns

### Coordinate Handling

```text
All implementations must handle quadray ↔ Cartesian conversion:
- C++: src/core/coordinate/Quadray.h
- JS:  src/js/experiments/browser/js/math/quadray.js
```

### State Management

```text
Centralized game state:
- C++: src/game/Game.cpp
- JS:  gameState.js
```

### Mesh Generation

```text
Chunk-based tetrahedral meshing:
- C++: src/render/mesh/ChunkMesher.cpp
- JS:  renderer.js (triangle sorting)
```

## Cross-Implementation Changes

When modifying core game mechanics:

1. Consider if change applies to all implementations
2. Update browser version first (fastest iteration)
3. Port to C++ if performance-critical
4. Ensure save format compatibility

## File Organization

- Keep related files in appropriate subdirectories
- C++ follows `PascalCase` naming
- JavaScript follows `camelCase` naming
- Each subdirectory should have README.md and AGENTS.md
