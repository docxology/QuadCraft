# Quadray Chess documentation — rules, geometry and implementation boundaries

This guide describes the development checkout’s local chess-inspired game, not full orthodox chess or a four-independent-axis physical space. Start with the [game entrypoint guide](../README.md).

## Core Documentation

| Guide | Scope |
| --- | --- |
| [Game rules](game-rules.md) | Actual turn flow, controls and rule limitations |
| [Piece movement](piece-movement.md) | Directed generated destinations, blockers and pawns |
| [Quadray mathematics](quadray-math.md) | Common-offset gauge, shared embedding and physical metric |
| [Notation](notation.md) | Human-readable move annotation versus actual record/save formats |

## Strategy and context

- [Strategy and metrics](chess-theory.md): useful exploratory questions and the readouts actually computed, not solved opening/endgame theory.
- [Chess-variant context](chess-history.md): distinguish this implementation from planar, layered and independent-axis variants; research directions are not shipped features.
- [Demonstration narration](youtube-script.md): a source-bounded walkthrough without unsupported dimensional, persistence or educational claims.

## Technical reference

- [API reference](api-reference.md): current class signatures, ownership and legacy history/storage mismatches.
- [Architecture](architecture.md): HTML dependency order, state flow and runtime boundaries.
- [JavaScript modules](../js/README.md), [tests](../tests/README.md) and [contributing](../CONTRIBUTING.md).

## Getting Started

From the QuadCraft root:

```bash
python3.13 games/run_games.py --game chess
node games/4d_chess/tests/test_chess.js
```

Serve the parent `games/` tree so sibling shared assets resolve. Test commands are available workflows, not a claim they have been run. The historical browser test page has stale dependencies; see the test guide. [Documentation maintenance](AGENTS.md) · [Portfolio contracts](../../../docs/games.md).
