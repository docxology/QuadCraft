# 4D SimAnt — Professional Edition

Ant colony simulation on independent **(a,b,c,d) raw cells**, projected with Quadrays for display. Movement uses eight reversible ±unit-component neighbors, not the twelve-neighbor physical FCC/IVM lattice. Common-offset labels remain distinct gameplay sites.

## Quick Start

```bash
python3 games/run_games.py --game simant
```

## Game Mechanics

### Colony Management

- **Workers** (W, 10 food) — Forage for food, dig tunnels through dirt
- **Soldiers** (S, 50 food) — Attack enemy ants, defend territory
- **Scouts** (E, 15 food) — Explore new areas with randomized scouting
- **Queen** — Auto-spawns workers when food > 15. If she dies, you lose

### Exploration and delivery

Workers and scouts remember the raw sites they have visited. Revisiting a site costs three preference points, compared with the two-point cost of digging fresh dirt, so an empty retreat no longer permanently beats excavation when no trail is present. Food attraction, food-trail following, danger avoidance and the small tunnel preference still guide foraging. History changes scores, not graph connectivity: every move remains a reversible single-component step. Digging requires energy above five, consumes two energy, and registers the opened site in the tunnel network. Soldiers cannot dig; bedrock blocks every caste.

Any food-carrying worker, scout or soldier plans a shortest traversable raw route to within Manhattan distance **less than three** of its living queen. Route search may initially move farther from the nest to go around obstacles. Each ant consumes its own route one step at a time, validates the next step against live terrain and replans if blocked or if the queen moves. There is no cached world-distance field. An unreachable carrier waits and retries after eight further decisions rather than searching the whole world every tick. Successful delivery adds the carried amount to colony storage and collection statistics, restores energy, and clears the route. Home and food pheromone deposits continue during the return.

### Pheromone System (6 channels)

| Channel | Purpose |
|---------|---------|
| Yellow Food | Trail to food sources |
| Yellow Home | Trail back to nest |
| Red Food / Home | Enemy equivalents |
| Yellow Danger | Combat warning (workers avoid) |
| Red Danger | Enemy combat signals |

Synchronous conservative transport uses each undirected raw graph edge once every ten logical ticks, with edge coefficient `0.8 / maxDegree` (interior degree 8). Empty and food cells are permeable; dirt and bedrock block edges until dug. The mask never rescales the coefficient. Transport conserves the sum of the raw-site concentrations; these are not physical voxel-volume integrals.

Evaporation is separate: multiply by 0.98 every five logical ticks, without a cutoff sink. Ant deposits and combat danger are explicit sources, capped at 100 per channel/site; excess is recorded as saturation loss. The HUD reports food/home/danger totals and cumulative evaporated mass. Metadata also exposes sources, saturation loss, Float32 rounding delta and the most recent before/after totals per channel. The trail overlay has a display-only threshold and normalizes color against each channel group's current peak.

`new SimAntBoard(size, {seed})` and `new SimAntGame(canvas, hud, {seed})` replay the same simulation stream; omitted seeds are sampled once. Reset replays that seed. Ant decisions, food generation, AI and Fisher–Yates update order share this board-owned stream, independent of rendering particles.
The deployed shared `ConservativeGraphField(size, edges)` accepts undirected integer index pairs, deduplicates reverse/repeated edges and exposes `maxDegree`. `step(values, alpha, out=null, active=null)` accepts `alpha` in `[0,1]` and returns a distinct array (Float64 by default); optional output must not overlap input. An inactive site retains its value and all incident edges are disabled. Equal/opposite changes accumulate in a separate Float64 buffer before being added to the old state once; SimAnt then applies evaporation and stores Float32. There is no RNG, sampling, cutoff or hidden decay in this operator.


### Combat

- **Morale**: +3 damage when 3+ allies nearby
- **Home bonus**: +5 damage when attacking within distance 3 of your own nest
- **Tunnel defense**: -3 damage taken when the defender is inside your tunnel network
- **Danger pheromone** emitted at combat locations
- Queens deal 50 damage to nearby hostiles
- Combat range and home bonuses use raw Manhattan graph distance; co-located allies count, excluding only the acting ant's identity. Projected physical aliases cannot attack across the raw board.

### AI (Red Colony)

Four-phase strategy: Early (workers) → Growth (scouts) → Mid (worker+soldier mix) → Late (aggression)

### Win Condition

Defeat the Red Queen → Victory. If your Queen dies → Game Over. Simultaneous queen deaths are a draw. Ended worlds stop advancing or accepting purchases. Purchasing during tactical pause remains allowed.

## Controls

| Key | Action |
|-----|--------|
| W / S / E | Hatch Worker / Soldier / Scout |
| 1 / 2 / 3 | Speed: Slow / Normal / Fast |
| T | Toggle pheromone trail visualization |
| A | Toggle Yellow auto-assist AI |
| M | Toggle minimap |
| L | Toggle coordinate labels |
| G | Toggle projected basis axes + raw tunnel graph |
| P | Pause |
| R | Reset |
| Shift+drag | Rotate camera |

## Quadray Geometry

The default board has 12⁴ = 20,736 independent raw labels. Its four-coordinate projection is many-to-one, so raw cell counts must not be interpreted as physical IVM volume. Nests are size-aware, logically distinct, and physically separated in the display embedding.

- **Basis vectors**: color-coded **a** (orange), **b** (blue), **c** (green), **d** (pink)
- **S₃ factor**: 1.0607 (Synergetics volume conversion)
- **Volume ratios**: Tetrahedron:Octahedron:Cuboctahedron = 1:4:20
- **Verify Math** button runs 8 geometric identity checks

## Architecture

```
index.html              ← UI + premium dashboard
js/simant_board.js      ← 4D grid, pheromones, ants, simulation
js/simant_ai.js         ← Red Colony AI + Yellow Assist AI
js/simant_combat.js     ← Combat with morale + terrain
js/simant_pheromone_viz.js ← Gradient trail visualization
js/simant_renderer.js   ← Raw graph, minimap, particles, sprites
js/simant_game.js       ← Game controller, speed, win conditions
../4d_generic/*.js      ← Shared Quadray/IVM modules
tests/                  ← Board, graph-field, foraging, combat and replay regressions
```

## Tests

```bash
node tests/test_comprehensive.js
node tests/test_simant.js
node tests/test_graph_transport.js
```

Each Node entry point reports numeric executed pass/fail counts. `test_graph_transport.js` counts named transport, reachability, combat, accounting, live-mask, replay and terminal-state scenarios; `test_simant.js` counts actual-board excavation, detour delivery, live obstruction/reopening and caste-permission scenarios. Open `tests/test.html` for that same foraging/delivery entry point in a browser.
