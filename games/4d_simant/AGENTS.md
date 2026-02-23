# 4D SimAnt — Agent Reference

## Quick Commands

```bash
python3 ../../run_games.py --game simant
node tests/test_comprehensive.js  # 138 tests
node tests/test_simant.js         # 10 basic tests
```

## Directory

```
js/
  simant_board.js     — SimAntBoard: 4D grid, pheromones (6ch), ants, tunnels, food regen
  simant_ai.js        — RedColonyAI (4-phase), YellowAssistAI
  simant_combat.js    — CombatSystem: morale, terrain, danger pheromone, stats
  simant_pheromone_viz.js — PheromoneVisualizer: gradient colors, glow, danger channel
  simant_renderer.js  — SimAntRenderer: IVM grid, minimap, particles, sprites, tooltips
  simant_game.js      — SimAntGame: speed controls, win conditions, assist toggle
tests/
  test_comprehensive.js — 138 integration tests (26 groups)
  test_simant.js       — 10 unit tests
  test.html            — Browser test runner
index.html             — Premium UI with glassmorphic panels
```

## Module Dependencies

```
Quadray → GridUtils → SYNERGETICS → BaseBoard → SimAntBoard
BaseRenderer → SimAntRenderer
BaseGame → SimAntGame
CombatSystem, RedColonyAI, YellowAssistAI, PheromoneVisualizer
```

## Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| PHERO_CHANNELS | 6 | YFood, YHome, RFood, RHome, YDanger, RDanger |
| MAX_ANTS_PER_FACTION | 60 | Population cap |
| CASTE_{QUEEN,WORKER,SOLDIER,SCOUT} | 0–3 | Ant castes |
| FACTION_{YELLOW,RED} | 0–1 | Colony factions |

## Key Mechanics

- **6-channel pheromones** with IVM-neighbor diffusion (12-around-one)
- **Population cap**: 60 ants per faction
- **Food regeneration**: Every 200 ticks, 2–3 new food clusters
- **Queen auto-spawn**: Workers hatched when food > 15
- **Colony health**: Composite of queen HP, population, food, combat K/D
- **Win condition**: Game won when enemy queen dies
- **Tunnel tracking**: Set-based connectivity for terrain bonus
- **4 ant castes**: Queen (200 HP), Soldier (50 HP), Worker (20 HP), Scout (15 HP)

## Verification

- [ ] `node tests/test_comprehensive.js` → 138 pass
- [ ] `node tests/test_simant.js` → 10 pass
- [ ] Browser test: game loads, ants move, combat occurs
- [ ] Verify Math: all 8 geometric identities pass
