# Shared portfolio module maintenance — source contracts and consumer ownership

Read the [library map](README.md), [repository instructions](../../AGENTS.md) and [portfolio contracts](../../docs/games.md). This is shared browser/Node helper code, not a playable game, the native runtime or proof that every consumer uses every subsystem.

## Preserve boundaries

- Follow each HTML entrypoint for classic-script dependency order. Doom imports ES modules and adapts the canonical Quadray class; do not invent local math copies or convert every script to one module style.
- Distinguish raw `GridUtils.key`/`generateGrid` state from normalized/rounded `Quadray.toKey` and canonical graph traversal. Audit callers before changing either identity contract.
- Shared physical XYZ is rank three, scale `1/sqrt(2)` with Y/Z swapped relative to scale-one Python. Preserve floating-point distance/offset invariance and scalar shared inverse arguments.
- `BaseGame` invokes `_setupGameInput` during construction and expects `{text,color}` from `_getHUDState`. A base class is not an automatic implementation of world physics, saved games or networking.
- `GameLoop.tickRate` is milliseconds; update dt is fixed seconds. Logical-tick consumers may ignore dt. Stop/pause do not automatically detach keys, reject commands or cancel game-owned timers.
- `TurnManager` wraps moves with player/turn metadata. Undoing its history is not sufficient to undo board state; persistence code must match the actual record schema.
- `ScoreManager` takes `storageKey` and maximizes high scores. Do not promise unsupported generic `key` or low-score mode options.
- Graph transport must retain equal/opposite edge flux and mask semantics; do not call it symmetric-normalized heat or remove masked field mass.

## Change and verification routing

Use [source/API links](README.md) instead of maintaining duplicate method inventories here. Preserve browser globals and CommonJS exports only where the actual file exposes them; DOM/Canvas modules are not pure math.

[Local tests](tests/README.md) cover Quadray and synergetics helpers; broader `games/tests/` suites cover other shared behaviors. Changes need focused consumer regressions and the [repository’s integrated testing/browser gates](../../docs/development/testing_guide.md). A helper-only check cannot establish an actual controller, Canvas, network or resource lifecycle. Report commands and observed results, not permanent test/coverage counts.
