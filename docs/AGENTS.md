# Documentation maintenance: runtime scope and evidence

[Documentation index](README.md) · [Development-specific rules](development/AGENTS.md)

## Structure and authority

`architecture.md` distinguishes native, historical browser/server experiments and the portfolio. `games.md` owns the local shared time/RNG/raw-versus-physical graph contracts. `development/` documents real source interfaces and explicitly bounded design ideas. Mathematics, game-design, UI, reference and technical-paper directories may discuss concepts beyond implemented functionality; do not promote those concepts to API claims.

## Updating a technical page

1. Inspect the exact source declaration, active code path and consumer, not only nearby comments or old documentation.
2. State the runtime/entry point and link its implementation. Source paths from `docs/` start `../src/` or `../games/`; from `development/` they start `../../`.
3. Preserve the distinction between physical quadray equivalence and intentionally independent raw game slots.
4. Document time units and random-stream ownership at real caller boundaries. Conservative graph transport is not symmetric-normalized heat.
5. Remove fictional working recipes rather than prefixing them with a warning. Retain useful proposals as decisions/requirements, not invented classes, imports or commands.
6. Update hub/subdirectory navigation and inbound heading fragments after renaming. Avoid saved line/test counts as structural truth.

## Verification wording

Build commands belong in [setup](development/setup_guide.md), checks in [testing](development/testing_guide.md). Graphics-free CTest, Node/Python logic, catalog validation and Chromium interaction/rendering prove different things. Report only observed outputs from exercised commands; a dated historical receipt is not a current green status. Preserve immutable tagged/released documentation and user-generated artifacts.

## Style and accessibility

Use informative topic titles, short sections, source-backed examples and descriptive relative links. Prefer a compact ownership/data-flow explanation to a huge speculative class diagram. Define mathematical scale/gauge explicitly or link the canonical contract. Do not claim complete multiplayer, modding, physics or asset support without real implementation evidence.
