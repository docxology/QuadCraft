# Documentation - AI Agent Guidelines

## Overview

This directory contains comprehensive documentation for QuadCraft. See README.md for the full documentation index.

## Structure

```text
docs/
├── README.md                # Documentation index (central hub)
├── architecture.md          # System architecture overview (summary)
├── quadray_coordinates.md   # Quadray implementation in QuadCraft
├── games.md                 # 12-game portfolio overview
├── development/             # Technical implementation guides (17 docs)
│   ├── architecture.md      # Detailed technical architecture (846 lines)
│   ├── chunk_system.md      # Tetrahedral chunk management
│   ├── entity_system.md     # ECS architecture
│   ├── physics_system.md    # Physics & collision
│   ├── javascript_implementation.md
│   ├── setup_guide.md       # Dev environment setup
│   ├── testing_guide.md     # Test infrastructure (C++ & JS)
│   └── ...                  # 10 more guides
├── game_design/             # Gameplay documentation (5 docs)
├── mathematics/             # Mathematical foundations (3 docs)
│   ├── quadray_coordinates.md  # Detailed quadray math
│   ├── tetrahedral_geometry.md # Geometry & barycentrics
│   └── ivm_synergetics.md     # IVM & Synergetics volume ratios
├── other/                   # Reference papers (4 papers)
├── reference/               # Glossary and terminology
└── ui/                      # UI/UX documentation
```

## Key Relationships

| Docs Area | Source Code | Games |
|-----------|-----------|-------|
| `mathematics/` | `src/core/coordinate/` | All 12 games (`games/*/js/quadray.js`) |
| `development/architecture.md` | `src/core/`, `src/render/`, `src/game/` | — |
| `development/javascript_implementation.md` | `src/browser/`, `src/js/` | Browser games |
| `game_design/` | `src/game/`, `src/browser/` | `games/4d_minecraft/` |

## Guidelines

### Updating Documentation

1. Keep synchronized with code changes in both `src/` and `games/`
2. Use consistent formatting
3. Include Mermaid diagrams where helpful
4. Cross-reference related documents
5. Update `docs/README.md` index when adding new docs

### Adding New Documents

1. Place in appropriate subdirectory
2. Add to `docs/README.md` index **and** the subdirectory's `README.md`
3. Link from related documents
4. Follow existing style

### Document Format

- Use Markdown with GitHub extensions
- Mermaid for diagrams
- Code blocks with language tags
- Consistent heading hierarchy

## Content Standards

### Technical Accuracy

- Verify code examples work against actual source
- Update when implementations change
- Note version-specific details
- Distinguish implemented (✅) from planned (🚧) features

### Accessibility

- Clear, concise writing
- Define technical terms (link to [glossary](reference/glossary.md))
- Provide examples
- Link to prerequisites
