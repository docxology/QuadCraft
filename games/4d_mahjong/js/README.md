# 4D Mahjong JavaScript — State, projection and controller ownership

Plain scripts loaded by [the browser entrypoint](../index.html); shared dependencies come from `../../4d_generic/`, not a local Quadray copy. Preserve the entrypoint's actual load order. Board modules expose CommonJS exports for Node logic tests; this does not make the browser controller DOM-free.

| Module | Principal interface | Responsibility |
| --- | --- | --- |
| [`mahjong_board.js`](mahjong_board.js) | `MahjongBoard` | Board state and game rules |
| [`mahjong_renderer.js`](mahjong_renderer.js) | `MahjongRenderer` | Canvas projection and drawing |
| [`mahjong_game.js`](mahjong_game.js) | `MahjongGame` | Input, lifecycle and HUD |

## Game-specific interfaces

`MahjongTile`, `TILE_SUITS` and `TILE_COLORS` are exported by the board module. `select(tile)`, `isExposed(tile)` and `getHint()` own matching legality; `hitTest(mx,my)` only identifies a painted face.

## Projection and interaction

`MahjongRenderer` projects unmatched tiles, paints in stable ascending logical-layer order, and picks the last painted rectangular face containing the pointer. Shadows and outlines do not enlarge hit areas. A picked covered tile still fails the board exposure rule.

Keep logical layer ordering separate from camera depth and exposure. Do not replace array tile identity with normalized occupancy keys.

See [model/timing and controls](../README.md), [local regression scope](../tests/README.md) and [shared portfolio contracts](../../../docs/games.md). Screen overlap is not proof that two gameplay slots are identical.
