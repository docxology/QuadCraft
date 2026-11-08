# Quadray Chess mathematics — gauge, embedding and physical distance

The coordinate implementation is shared [quadray.js](../../4d_generic/quadray.js), not a local chess copy. [Portfolio contracts](../../../docs/games.md) are canonical for cross-game units and raw-label distinctions.

## What are Quadray Coordinates?

Four coefficients `(a,b,c,d)` multiply tetrahedrally arranged basis vectors in three-dimensional space. Their sum is zero, so adding the same number to all four coefficients leaves the physical point unchanged. This rank-three representation is not four independent Euclidean axes.

## Normalization

`q.normalized()` subtracts the minimum coefficient. It selects a nonnegative zero-minimum representative, not a unit-length vector. Chess stores pieces using `position.toKey()`, which normalizes and rounds components. In contrast, raw `GridUtils.key()` does neither; some other games intentionally keep aliases distinct.

```javascript
// After the shared classic script has loaded:
const q = new Quadray(2, 3, 1, 4).normalized(); // (1,2,0,3)
```

## Conversion to Cartesian

Shared/native QuadCraft uses:

```text
x = (a-b-c+d)/sqrt(2)
y = (a-b+c-d)/sqrt(2)
z = (a+b-c-d)/sqrt(2)
```

`toCartesian()` returns `{x,y,z}`; `Quadray.fromCartesian(x,y,z)` takes three scalars. Relative to scale-one Python XYZ, this embedding swaps Y/Z and divides by `sqrt(2)`, reversing orientation. Do not import another package’s lengths, volume factors or inverse-rounding behavior without conversion.

### Basis Vectors in Cartesian

| Basis | XYZ multiplied by sqrt(2) |
| --- | --- |
| A=(1,0,0,0) | (1,1,1) |
| B=(0,1,0,0) | (−1,−1,1) |
| C=(0,0,1,0) | (−1,1,−1) |
| D=(0,0,0,1) | (1,−1,−1) |

Each basis tip is `sqrt(3/2)` from the origin, distinct tips are distance 2 apart, and their mutual angle is `acos(−1/3)` (about 109.47 degrees).

## Distance Formula

For coefficient difference Δ and component sum S, physical squared distance is:

```text
d² = 2*(Δa²+Δb²+Δc²+Δd²) − S²/2
S  = Δa+Δb+Δc+Δd
```

Equivalently, embed the difference and take its ordinary XYZ norm. `Quadray.distance(q1,q2)` implements that physical metric, including signed/fractional structural records. A common-offset difference has distance zero; `sqrt(sum(Δ²)/2)` is not this metric.

## Arithmetic Operations

`add` and `subtract` return normalized Quadrays; `scale` multiplies coefficients without automatically normalizing. `equals` compares normalized components with tolerance. `toIVM` snaps canonical components with `Math.round`; it is not an XYZ-nearest FCC search. JavaScript calculations are floating point, not an all-rational exact kernel.

## Isotropic Vector Matrix (IVM)

The shared twelve-neighbor graph uses permutations of `(0,1,1,2)` followed by normalization. Chess piece moves use their own directed basis/pair/knight offsets, not that universal neighbor list. Parity labels and volume metadata do not prove a physical tetrahedral tessellation.

[Movement rules](piece-movement.md) · [API reference](api-reference.md).

## Further Reading

- [Kirby Urner’s Quadray material](http://www.grunch.net/synergetics/quadrays.html)
- [Fuller’s Synergetics](http://www.rwgrayprojects.com/synergetics/synergetics.html)
- [Isotropic vector matrix overview](https://en.wikipedia.org/wiki/Isotropic_vector_matrix)
