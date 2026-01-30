# Entity System - AI Agent Guidelines

## Current State

The entity system currently contains only the Camera. Future expansion may include:

- Player entity
- NPCs
- Physics objects

## Camera Modification Guidelines

### Orientation

- Use quaternions for smooth rotation (see `docs/development/quaternion_camera_system.md`)
- Avoid gimbal lock in pitch constraints
- Consider controller support for rotation

### Position

- Position updates should respect world boundaries
- Coordinate with chunk loading system
- Smooth movement with delta time

### View Matrix

- Follow OpenGL conventions (right-handed)
- Update projection for aspect ratio changes
- Frustum planes for culling

## Adding New Entities

If adding new entity types:

1. Consider common base class/interface
2. Implement position in both Cartesian and Quadray
3. Add serialization for save/load
4. Integrate with physics if needed

## Performance Notes

- Camera position drives chunk loading
- Update view matrix only when changed
- Cache frustum planes between frames
