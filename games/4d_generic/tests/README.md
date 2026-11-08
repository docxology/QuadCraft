# Shared geometry tests — canonical Quadray metrics and synergetics readouts

Run these actual local suites from the QuadCraft root:

```bash
node games/4d_generic/tests/test_quadray.js
node games/4d_generic/tests/test_synergetics.js
```

## Source coverage

- [test_quadray.js](test_quadray.js) imports the canonical shared class and loads the separate modular-browser Quadray implementation in a Node VM. It checks constructors, gauge normalization, arithmetic, Cartesian round trips, physical metric invariance for signed/fractional/common-offset inputs, structural coordinate records and canonical component snapping. Shared inverse arguments are scalar; the modular-browser inverse takes an array.
- [test_synergetics.js](test_synergetics.js) checks declared relative volume constants, basis radius, tetrahedral angles, round trips and identity-helper output.

These are Node math checks, not native C++ tests, real-browser rendering/input checks or proof of physical cell tessellation. Metadata values alone do not establish geometry. The remaining shared modules have additional suites under [games/tests](../../tests/); the launcher’s full test route discovers those separately.

[Library contracts](../README.md) · [Maintenance rules](AGENTS.md) · [Repository testing guide](../../../docs/development/testing_guide.md).
