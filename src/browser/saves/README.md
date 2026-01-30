# Save Files

This directory contains JSON save files for game states.

## Directory Structure

```text
saves/
├── quadraygrid4/     # Saves from QuadrayGrid4 version
└── quadraygrid5/     # Saves from QuadrayGrid5 version
```

## File Format

Save files are named with pattern:

```text
quadcraft_quadgrid{N}_{timestamp}.json
```

Example: `quadcraft_quadgrid4_1756388399.8885.json`

## JSON Structure

```json
{
  "dots": [
    {"a": 1, "b": 0, "c": 0, "d": 0, "type": "..."}
  ],
  "shapes": [
    {"position": {...}, "type": "octahedron"}
  ],
  "camera": {
    "position": {...},
    "rotation": {...}
  },
  "metadata": {
    "version": "...",
    "timestamp": "..."
  }
}
```

## Notable Saves

Some saves include specific scenarios:

- `*_poolOfManyBalls.json` - Physics testing with many balls
- `*_testVInJson.json` - Velocity data testing
- `*_bugSeeingBallsInsideCCPVolume.json` - Debug scenario

## Usage

These saves can be:

- Loaded directly in the browser application
- Shared between browser instances (via server)
- Used for testing and debugging
