# QuadrayGrid snapshots and focused geometry experiments

`QuadrayGrid.html`, `QuadrayGrid2.html`, `QuadrayGrid3.html`, `QuadrayGrid4.html` and dated HTML preserve different stages of the experiment. The numeric suffix is a snapshot identity, not a production-support promise. `MergedTwoGrids.html`/`MergingTwoGrids.html` explore grid merging; `CrystalDefectCCPBalls.html` explores packing defects; `octahedronAutomata.html` and `simpleGrid.html` are separate demonstrations.

[Split browser scripts](browser/README.md) and its standalone HTML are another branch of the experiment. [Saved examples](saves/README.md) belong to historical grid4 serialization. Associated images document historical observations, not current runtime verification.

Serve the checkout with `python3.13 -m http.server 8080` when HTTP loading is needed, then navigate to the exact file under `/src/js/experiments/`. Static HTTP serving does not enable JSP synchronization. Inspect each page's dependencies and controls before using it.
