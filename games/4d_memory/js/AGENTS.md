# 4D Memory JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Preserve raw card keys and the third-flip hide behavior. Do not describe matching as FCC adjacency or claim that visible overlap gives a unique card.

Only click handlers mutate card state; the inherited update hook is empty. No movement or twelve-neighbor rule is used by matching.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
