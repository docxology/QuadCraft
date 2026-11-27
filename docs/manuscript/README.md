# Physical Quadrays and Cartesian Chunk Routing in QuadCraft

Start with the [abstract](00_abstract.md), [methods](02_methods.md),
[results](03_results.md), and [discussion](04_discussion.md). The
[probe source](chunk_probe.cpp) uses the native [coordinate contract](../quadray_coordinates.md)
and [chunk implementation](../../src/core/world/TetraChunk.cpp). The
[earlier scope audit](../archive/manuscript-scope-audit.md) records what
was available before this manuscript.

## Build the manuscript

Run from a committed QuadCraft checkout with Git, a C++17 compiler
available as `c++`, Python 3, uv, Graphviz, Pandoc 3.14, XeLaTeX,
BibTeX and Poppler. This procedure generates the figure from the
native probe, independently of the checked-in documentation preview.
It does not require graphics libraries, a browser or a game server.

```bash
set -e
source_checkout=$(pwd -P)
commit=$(git rev-parse HEAD)
scratch=$(mktemp -d)
renderer="$scratch/template"
git clone https://github.com/docxology/template.git "$renderer"
git -C "$renderer" checkout --detach 87704feae0a4490ef7dad9c931d268e8c30273c2
mkdir -p "$renderer/projects/working"
git clone "$source_checkout" "$renderer/projects/working/QuadCraft"
cd "$renderer/projects/working/QuadCraft"
git checkout --detach "$commit"
printf '\n/output/\n' >> .git/info/exclude

mkdir -p output/data output/figures
c++ -std=c++17 -I . docs/manuscript/chunk_probe.cpp src/core/world/TetraChunk.cpp -o "$scratch/chunk-probe"
"$scratch/chunk-probe" > output/data/native-chunk-routing.tsv
python3 - <<'PYTHON'
import json
import subprocess
from pathlib import Path

data = Path("output/data/native-chunk-routing.tsv")
samples = []
for row in data.read_text().splitlines():
    x, y, z, cx, cy, cz = map(int, row.split())
    samples.append({"cartesian": [x, y, z], "chunk_key": [cx, cy, cz]})
receipt = {"samples": samples}
data.with_suffix(".json").write_text(json.dumps(receipt, indent=2) + "\n")
lines = [
    "digraph routing {",
    'graph [rankdir=TB, dpi=180, bgcolor="white", nodesep=0.55];',
    'node [shape=box, style="filled,rounded", fillcolor="#E6EEF6", fontname="DejaVu Sans"];',
    '{rank=same; sample0; sample1; sample2;}',
    '{rank=same; chunk0; chunk1; chunk2;}',
    'sample0 -> sample1 -> sample2 [style=invis];',
    'chunk0 -> chunk1 -> chunk2 [style=invis];',
]
for i, sample in enumerate(samples):
    position = json.dumps(f"World point\n{tuple(sample['cartesian'])}")
    key = json.dumps(f"Chunk key\n{tuple(sample['chunk_key'])}")
    lines.extend([
        f"sample{i} [label={position}];",
        f'chunk{i} [label={key}, fillcolor="#F2E6D4"];',
        f"sample{i} -> chunk{i};",
    ])
lines.append("}")
subprocess.run(["dot", "-Tpng", "-o", "output/figures/native-chunk-routing.png"],
               input="\n".join(lines), text=True, check=True)
PYTHON
cp docs/manuscript/figure_registry.json output/figures/figure_registry.json

cd "$renderer"
uv sync --locked
uv run --no-sync python scripts/pipeline/stage_03_render.py --project working/QuadCraft
uv run --no-sync python scripts/pipeline/stage_04_validate.py --project working/QuadCraft
printf '%s\n' "$renderer/projects/working/QuadCraft/output"
```

The output contains the probe rows and JSON under `data/`, the generated
diagram under `figures/`, PDF and HTML editions under `pdf/` and `web/`,
and validation and provenance under `reports/`. See the
[testing guide](../development/testing_guide.md) for other native checks.
