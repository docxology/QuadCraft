# Entity System

This directory contains entity components for the game world.

## Files

| File | Purpose |
|------|---------|
| `Camera.h` | Player camera with view management |

## Camera System

The camera provides the player's view into the tetrahedral world.

### Features

- **Position**: 3D location in world space
- **Orientation**: Yaw, pitch for look direction
- **View Matrix**: Transformation for rendering
- **Frustum**: View volume for culling

### Key Functions

```cpp
// View matrix for rendering
Matrix4 getViewMatrix() const;

// Update camera based on input
void processKeyboard(Direction direction, float deltaTime);
void processMouseMovement(float xoffset, float yoffset);
void processMouseScroll(float yoffset);
```

### Movement Modes

1. **Drone-like**: Arrow keys always active
2. **FPS-like**: WASD when mouse captured
3. **Vertical**: Page Up/Down or Space/Shift

### Integration

The camera integrates with:

- **Input System**: Receives movement commands
- **Rendering**: Provides view/projection matrices
- **World**: Position determines chunk loading
