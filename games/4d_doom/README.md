# 4D DOOM — Synergetics Hyperdimensional FPS

A Wolfenstein-3D-style raycasting FPS operating in **4D Quadray tetrahedral coordinates** on an **IVM (Isotropic Vector Matrix) grid** — Fuller's Synergetics geometry brought to life as a playable first-person shooter.

## Architecture

| Module | Role |
|--------|------|
| `doom_config.js` | IVM constants, cell types, weapons, rendering config |
| `doom_map.js` | IVM sparse map (Map-based), room generation, 4D slice extraction |
| `doom_entities.js` | Player/Enemy/Projectile with Quadray helpers |
| `doom_physics.js` | IVM 8-connected collision, Quadray distance, enemy AI |
| `doom_render_fps.js` | DDA raycaster with Synergetics wall textures (tetra/octa patterns) |
| `doom_hud_synergetics.js` | Synergetics analysis panel, Quadray compass, IVM floor grid |
| `doom_synergetics.js` | Tetravolumes, IVM grid, coordination, polyhedra (T:O:C=1:4:20), 8 geometric identity checks |
| `doom_main.js` | Game controller wiring modules + Synergetics HUD |
| `quadray.js` | Quadray coordinate class with IVM utilities |

## Synergetics Features

- **IVM World Model**: Integer Quadray coordinates ARE IVM vertices — no cubic approximation
- **Tetravolume Metrics**: Live volume calculation using Fuller's unit (regular tetra = 1 tetravolume)
- **Polyhedra Detection**: Real-time T:O:C (1:4:20) identification in wall structure
- **8 Geometric Identity Checks**: Verified on startup (basis lengths, tetrahedral angles, round-trip conversion, S3 constant, etc.)
- **Synergetics HUD**: Tetravolumes · IVM fill · Coordination numbers · Polyhedra counts · Center of mass · Cell parity
- **Quadray Compass**: 4 color-coded tetrahedral axes (A=Red, B=Green, C=Blue, D=Yellow)
- **IVM Minimap**: Diagonal grid overlay showing tetrahedral structure

## Controls

| Key | Action |
|-----|--------|
| WASD | Move/Strafe |
| Mouse | Look |
| Click | Shoot |
| Q/E | Keyboard Turn |
| Z/X | Hyper-Strafe (D-axis) |
| Space/Shift | Elevate (C-axis) |
| 1/2/3 | Switch Weapon |
| R | Respawn (when dead) |

## Testing

Open `tests/test_doom.html` in a browser. **69/69 tests** across 7 sections:
Config · Quadray · Map · Entities · Physics · Synergetics Analysis · Geometric Identity
