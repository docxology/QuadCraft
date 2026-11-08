# Var.js provenance and browser state-tree integration

[Var.js](Var.js) is the Ben F Rayfield Varjs library, copied from jsutils on 2026-08-26 and modified locally, as recorded in its header. Preserve the upstream attribution/license text and detailed source overview rather than replacing it with game-specific API claims.

`../index.html` loads it as a classic script. Vars form a mutable named tree with scalar `.p`/`.v`, timestamps `.t`, logical `.j`, `.pu` children and application fields. The page binds a room subtree and serializes selected maps; proxy child lookup and touch/load behavior matter to consumers.

Timestamp and logical-j winner rules are different. The bundled JSP currently merges by `.t`, not every newer Var.js capability. The library is neither an ES-module import package here nor a sandbox/complete networking backend. Read its source header for the vendored contract and [server guide](../../server/README.md) for integration limits.
