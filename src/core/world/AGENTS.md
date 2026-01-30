# World System - AI Agent Guidelines

## Critical Systems

The world system is central to gameplay. Changes affect:

- Terrain appearance
- Chunk performance
- Memory usage
- Save file format

## Modification Guidelines

### World.h

Main coordination point:

- Chunk collection management
- Block access abstraction
- Loading/unloading logic

When modifying:

- Consider thread safety for async loading
- Update chunk iteration patterns
- Maintain consistent block access API

### TetraChunk

Chunk data storage:

- Sparse element storage for memory efficiency
- Dirty flag for mesh regeneration
- Boundary handling for neighbor access

When modifying:

- Test boundary conditions carefully
- Ensure dirty flag is set on changes
- Profile memory usage

### TerrainGenerator

Procedural content:

- Fractal noise for natural appearance
- Multiple feature layers

When modifying:

- Test with various seed values
- Check feature distribution
- Profile generation time

### Block Types

Adding new blocks:

1. Define in Block.h / BlockRegistry
2. Set properties (solid, transparent, etc.)
3. Add mesh generation support
4. Update terrain generator if auto-placed

## Save Format Compatibility

Changes to world structure affect save files:

- Chunk format must be versioned
- Provide migration for old saves
- Document format changes

## Performance Checklist

- [ ] Chunk loading is incremental
- [ ] Unloading frees memory properly
- [ ] Terrain generates in acceptable time
- [ ] Block access is O(1) average case
