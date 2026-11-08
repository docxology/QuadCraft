# Floating-point quadray, grid and projection utilities

`quadrays.py` implements Quadray arithmetic and shared/native XYZ embedding. `xyz.py` provides conversions, Y/X rotations and screen projection. `geometry.py` supplies physical/raw metrics, canonical neighbors, raw grids and numerical identity reports. `ivm.py` holds reference constants, formula helpers and approximate Jitterbug interpolation.

Use [space math reference](../../doc/space_math_reference.md) for real signatures and limitations, and [canonical portfolio contracts](../../../docs/games.md) for units/gauge/raw storage. Four coefficients have three physical degrees of freedom; these are not exact-rational or universally JS-identical APIs.
