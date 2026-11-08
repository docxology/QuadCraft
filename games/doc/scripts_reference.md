# Portfolio maintenance utilities and write effects

Source: [`scripts/`](../scripts/). Commands below assume the QuadCraft repository root. These utilities are not one safe “refresh everything” pipeline; inspect writes and review handcrafted content before using them.

| Script | Actual behavior | Important limitation |
|---|---|---|
| `regenerate_scripts.py` | Reads registry and `games/scripts/_run_template.sh`, writes/chmods `games/run_<key>.sh` | Relative template/output paths require repository-root cwd; does not update master run.sh key list |
| `_run_template.sh` | Template for central-launcher per-game wrappers | Distinct from the inline GameScaffold local run.sh |
| `generate_test_html.py` | Overwrites `tests/test.html` for entries in its hardcoded TEST_CONFIG | Only its original configured subset, not discovery of every suite; template references local `../js/quadray.js` and shims require/module, so it is not the current real-browser gate |
| `ensure_agents_md.py` | Creates absent AGENTS.md for registry entries | Leaves existing files alone; generic template has historical assumptions and must be source-reviewed |
| `audit_docs.py` | Prints presence/minimum-line status of README/AGENTS in configured infra and 4d_* directories | Read-only; length is not accuracy and issues do not produce a semantic documentation audit |
| `fix_docs.py` | Creates missing README/AGENTS files for hardcoded target lists | Does not repair formatting, stale links or existing content; generated stubs need real source-backed replacement |
| `generate_matrix.py` | Prints HTML filename-substring module usage table for registered games | Read-only; imported text is not runtime use/inheritance and its list omits graph_field/CSS |
| `update_tests.py` | Writes test-count replacements to selected game README/AGENTS using a hardcoded table | Not live test execution; do not use to establish current totals or reinstate timeless count claims |

Examples for separately authorized maintenance:

```sh
python3.13 games/scripts/regenerate_scripts.py
python3.13 games/scripts/generate_matrix.py
python3.13 games/scripts/audit_docs.py
```

The first command writes wrappers; the latter two print reports. Do not treat audit_docs success, a module matrix, generated test pages or historical count synchronization as verification. The [QA guide](testing_guide.md) and [Chromium instructions](../tests/browser/README.md) identify current logic/browser entrypoints. [Scaffold guide](scaffold_guide.md) describes that generator's separate write and path issues.
