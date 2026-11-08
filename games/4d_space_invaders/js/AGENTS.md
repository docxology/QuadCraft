# 4D Space Invaders JavaScript — Change boundaries

Follow [module ownership and projection](README.md) and the real [HTML imports](../index.html). Shared code is in `../../4d_generic/`; do not introduce a second local coordinate implementation.

Document `SpaceInvadersBoard`, `SpaceInvadersRenderer` and `SpaceInvadersGame` rather than invented Invaders aliases. Keep raw hit keys and logical counters distinct from physical projection.

`SpaceInvadersGame.update()` polls ship movement and calls one `board.step()` per 100 ms logical tick. Formation schedules, shooting cooldown and bullets are tick-based, not dt-integrated. Shared entity-system imports do not make these arrays an `EntityManager` world.

Update the [game guide](../README.md) when bindings or lifecycle change. [Local tests](../tests/README.md) describe actual evidence; importing shared geometry, routing or entity code does not establish its use by this game.
