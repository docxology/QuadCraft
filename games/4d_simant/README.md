# 4D SimAnt — Raw terrain, colony routing and conservative trails

Ant colony simulation on independent **(a,b,c,d) raw cells**, projected with Quadrays for display. Movement uses eight reversible ±unit-component neighbors, not the twelve-neighbor physical FCC/IVM lattice. Common-offset labels remain distinct gameplay sites.

## Quick Start

```bash
python3.13 games/run_games.py --game simant
```

Run from the QuadCraft repository root. The launcher serves the parent `games/` tree so shared modules remain reachable. [Portfolio contracts](../../docs/games.md) explain physical Quadray geometry versus raw gameplay identity.

`SimAntGame.update()` advances one logical board tick at the selected 300/150/50 ms interval. Shared loop callbacks receive seconds, but this simulation uses tick counters rather than dt-scaled motion.

## Game Mechanics

### Colony Management

- **Workers** (W, 10 food) — Forage for food, dig tunnels through dirt
- **Soldiers** (S, 50 food) — Attack enemy ants, defend territory
- **Scouts** (E, 15 food) — Explore new areas with randomized scouting
- **Queen** — Every 60 ticks, spawns a worker if stored food is at least 15 and the population cap permits it, consuming 10 food. If she dies, you lose unless both queens die together.

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

Evaporation is separate: multiply by 0.98 every five logical ticks, without a cutoff sink. Ant deposits and combat danger are explicit sources, capped at 100 per channel/site; excess is recorded as saturation loss. The HUD reports food/home/danger totals and cumulative evaporated mass. Metadata also exposes sources, saturation loss, Float32 rounding delta and the most recent before/after totals per channel. The trail overlay has a display-only threshold and divides each channel group's color intensity by its current peak, floored at one.

`new SimAntBoard(size, {seed})` and `new SimAntGame(canvas, hud, {seed})` replay the same simulation stream; omitted seeds are sampled once. Reset replays that seed. Ant decisions, food generation, AI and Fisher–Yates update order share this board-owned stream, independent of rendering particles.
The shared [`ConservativeGraphField`](../4d_generic/graph_field.js) owns the operator interface. It accumulates equal/opposite edge flux in Float64 without RNG, cutoff or hidden decay; SimAnt separately applies evaporation and stores Float32. Inactive terrain disables incident edges without deleting its stored field.


### Combat

- **Morale**: +3 damage when 3+ allies nearby
- **Home bonus**: +5 damage when attacking within distance 3 of your own nest
- **Tunnel defense**: -3 damage taken when the defender's raw site is in the board's shared tunnel set; tunnels are not faction-owned
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
| Scroll | Zoom |

## Quadray Geometry

The default board has 12⁴ = 20,736 independent raw labels. Its four-coordinate projection is many-to-one, so raw cell counts must not be interpreted as physical IVM volume. Nests are size-aware, logically distinct, and physically separated in the display embedding.

The responsive canvas repaints immediately after its bitmap dimensions change, even while the colony is paused; resizing does not advance logical ticks. This also preserves the rendered world when a full-page browser capture changes the viewport by a fractional layout pixel. Display resizing does not change raw terrain, coordinates or projection units.

- **Basis vectors**: color-coded **a** (orange), **b** (blue), **c** (green), **d** (pink)
- **S₃ factor**: shared geometry metadata; it does not turn raw cell totals into physical volume
- **Volume ratios**: Tetrahedron:Octahedron:Cuboctahedron = 1:4:20
- **Verify Math** button runs shared geometric identity checks, not a simulation or conservation proof

## Architecture

```
index.html              ← Browser entrypoint and colony dashboard
js/simant_board.js      ← 4D grid, pheromones, ants, simulation
js/simant_ai.js         ← Red Colony AI + Yellow Assist AI
js/simant_combat.js     ← Combat with morale + terrain
js/simant_pheromone_viz.js ← Gradient trail visualization
js/simant_renderer.js   ← Raw graph, minimap, particles, sprites
js/simant_game.js       ← Game controller, speed, win conditions
../4d_generic/*.js      ← Shared Quadray/IVM modules
tests/                  ← Board, graph-field, foraging, combat and replay regressions
```

See [JavaScript modules](js/README.md) for ownership and [maintenance guidance](AGENTS.md) before changing topology or simulation timing. Hover tooltips use nearest entity centers within 30 pixels; they do not issue movement orders. The minimap collapses C/D onto raw A/B.

## Tests

From this game directory:

```bash
node tests/test_comprehensive.js
node tests/test_simant.js
node tests/test_graph_transport.js
```

Each Node entry point reports numeric executed pass/fail counts. `test_graph_transport.js` counts named transport, reachability, combat, accounting, live-mask, replay and terminal-state scenarios; `test_simant.js` counts actual-board excavation, detour delivery, live obstruction/reopening and caste-permission scenarios. Open `tests/test.html` for that same foraging/delivery entry point in a browser.

See [test entrypoints and limits](tests/README.md).
