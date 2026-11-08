# 4D Memory JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`memory_board.js`](memory_board.js) | `MemoryBoard` | Board state and game rules |
| [`memory_renderer.js`](memory_renderer.js) | `MemoryRenderer` | Canvas projection and drawing |
| [`memory_game.js`](memory_game.js) | `MemoryGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`flip(pos)`, `getValue(pos)`, `isRevealed(pos)` and `isMatched(pos)` use raw keys. The board owns `TurnManager`; no adjacency traversal is needed to match two cards.

## Projection and interaction

`MemoryRenderer._proj` uses the shared renderer projection for both drawing and picking. Drawing is depth-sorted; `hitTest` chooses the nearest raw cell center within 25 pixels, not the last painted card. Model checks reject matched, already revealed and zero-value slots.

Preserve raw card keys and the third-flip hide behavior. Do not describe matching as FCC adjacency or claim that visible overlap gives a unique card.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
