# Maintaining floating-point spatial helper contracts

Read [space math reference](../../doc/space_math_reference.md), [canonical contracts](../../../docs/games.md) and implementing functions. Preserve shared/native scale/orientation, gauge-invariant physical metrics, and intentionally raw four-coefficient metrics and label generation. Do not normalize occupancy as a global policy.

Python normalized-key rounding is half-even, not JS Math.round. Python projection differs at a singular denominator and lacks browser target support; do not claim exact API parity. `neighbors` returns normalized Quadray objects while generate_grid retains raw labels. IVMGrid formulas and Jitterbug interpolation do not generate verified tessellations/exact transforms. Numerical spot checks are not mathematical proofs.
