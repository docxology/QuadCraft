# Game Logic

This directory contains the main game loop, input handling, and game state management.

## Files

| File | Purpose |
|------|---------|
| `Game.cpp` | Main game loop and state management |
| `Game.h` | Game class interface |
| `Input.h` | Input handling and key mappings |

## Game Class

The Game class orchestrates all game systems:

### Responsibilities

- **Initialization**: Set up OpenGL, load resources
- **Main Loop**: Update → Render cycle
- **State Management**: Current mode, pause state
- **System Coordination**: Link input, world, rendering

### Main Loop

```cpp
while (!shouldClose) {
    processInput();
    update(deltaTime);
    render();
    swapBuffers();
}
```

## Input System

Comprehensive input handling:

### Movement Controls

| Key | Action |
|-----|--------|
| W, A, S, D | Move forward/left/back/right |
| Space | Move up |
| Left Shift | Move down |
| Arrow Keys | Drone-like movement (always active) |
| Page Up/Down | Vertical movement |

### Interaction Controls

| Key | Action |
|-----|--------|
| Left Mouse | Remove block (or capture mouse) |
| Right Mouse | Place block |
| Tab | Toggle mouse capture |
| Escape | Release mouse / exit |

### View Controls

| Key | Action |
|-----|--------|
| F1 | Toggle wireframe mode |
| F2 | Toggle quadray overlay |
| Mouse Wheel | Zoom |

## State Machine

```text
INIT → LOADING → PLAYING ↔ PAUSED
                    ↓
                  EXIT
```

## Integration Points

- **World**: Block queries and modifications
- **Camera**: View position and orientation
- **Renderer**: Draw calls and state changes
