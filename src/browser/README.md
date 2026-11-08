# Monolithic browser world, Var state and save/sync boundaries

[index.html](index.html) is the current monolithic Canvas experiment and loads [lib/Var.js](lib/README.md). `indexOld_quadraygrid4.html` preserves an older snapshot. The split scripts under `../js/experiments/browser/` and portfolio games are independent implementations.

The page contains quadray navigation/shape editing, CCP ball-grid experiments, moving-ball collision heuristics, camera modes and trusted code evaluation. Browser quaternion camera features do not imply a native quaternion camera. Render projection/sorting and collision helpers are prototype approximations, not guarantees of watertight geometry or physical accuracy.

Serve from the checkout using `python3.13 -m http.server 8080`, then visit `/src/browser/index.html`. Basic local use is distinct from the optional Tomcat endpoint. Read visible controls and handlers for the selected mode: keyboard movement and camera behavior change with options. A claim that every browser or input path works would require runtime evidence.

`StateMap/StateJson` currently produce type `quadcraft_quadraygrid5_state`: selection, legacy camera fields, `camPos/camQ`, code text, grid, checkbox/brush settings and a current-room `root` Var map. `LoadMap` checks that type. [Archived saves](saves/README.md) include older `V` fields and grid4 `ccp` storage; filenames alone do not establish compatibility. Quicksaves use localStorage keys `quadcraft.quicksave.1` through UI slot 9, not cookies, and may collide with older pages on the same origin.

Optional sparse sync sends `readWriteSparse` requests with game, room, root and `peer.main.tNetFrom`; see [server protocol](../server/README.md). This is timestamp-merged in-memory shared state, not authenticated/authoritative multiplayer or durable world storage. Executing text uses page privileges; never paste untrusted scripts. No native or browser gameplay was exercised for this documentation audit.
