# Native quadray gauge, embedding and distance

[Quadray.h](Quadray.h) defines `QuadCraft::Quadray` with public float `a,b,c,d`. `normalized()` subtracts the minimum; common offsets represent one physical point, not a constant-sum constraint or a fourth Euclidean dimension.

```text
(x,y,z) = (a-b-c+d, a-b+c-d, a+b-c-d) / sqrt(2)
```

A coefficient-unit basis vector has length `sqrt(3/2)`, not one. This is the scale-one Python suite embedding with Y/Z swapped and divided by `sqrt(2)`: orientation reverses and squared lengths halve.

`toCartesian()` returns `Vector3`; `fromCartesian(const Vector3&)` chooses a zero-minimum representative. `length()`, `magnitude()` and both static/instance `distance` measure Cartesian Euclidean length. Float round trips have roundoff, and raw labels are not uniquely invertible. Addition normalizes; `operator*(float)` preserves raw scaled coefficients. `Vector3.h` also defines `Vector4` for frustum planes. `S3` is `sqrt(9/8)`, not `sqrt(3)`.

```cpp
QuadCraft::Quadray q = QuadCraft::Quadray::fromCartesian(QuadCraft::Vector3(1, 2, 3));
QuadCraft::Vector3 xyz = q.toCartesian();
```
