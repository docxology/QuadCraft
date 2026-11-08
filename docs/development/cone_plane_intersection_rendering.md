# Experimental sphere silhouettes from cone-plane conics

[Development index](README.md) · [Quaternion camera](quaternion_camera_system.md) · [CCP storage](ccp_ball_grid_system.md)

## Actual call path

[`src/browser/index.html`](../../src/browser/index.html) defines `paintBall(xyz, radius, color, isFillElseOutline, isConePlaneIntersection)`, `conePlaneIntersection(xyz, radius)` and `paintOval2d(...)`. This is a Canvas sphere-silhouette experiment using the page's quaternion camera. It is not the native OpenGL mesh pipeline or a portfolio-wide renderer API.

`paintBall` returns immediately in legacy camera mode. It rejects depth outside `drawDistanceMin`/`drawDistanceMax`, calls the conic routine, and draws either its affine ellipse or a perspective-scaled circle. If the conic routine returns null, the fallback circle is colored red as a diagnostic. Even when conic display is disabled, the current call path still computes the conic.

## Geometric construction

The camera-relative sphere center is projected onto right/up/forward basis vectors to obtain `C = (cx,cy,cz)`. With `L = ||C||`, `u = C/L`, sphere radius `r` and image plane depth `d = cubeSize`, the tangent-cone equation is

```text
(u · p)^2 - (1 - r^2/L^2) (p · p) = 0
```

Substituting `p = (x,y,d)` produces a planar conic `A x² + B xy + C y² + D x + E y + F = 0` (the conic coefficient C is distinct from the center vector). The source solves for its center, eigendecomposes the symmetric quadratic form and derives principal radii. It flips y when mapping plane coordinates to the Canvas.

`conePlaneIntersection` returns **screen pixels**:

```text
[centerX, centerY, aX, aY, bX, bY]
```

The last four values are two affine axis vectors, not scalar radii plus an angle. The ellipse is `center + a*cos(t) + b*sin(t)` for `t` in `[0,2π)`.

## Implemented edge cases

- Rejects centers behind the camera or outside depth bounds.
- Returns null for near-zero center distance, non-elliptic/invalid results and nonfinite output.
- Uses gentle determinant regularization near singular conics.
- When the camera lies within the sphere threshold, returns an enormous screen-space affine circle as a fill approximation.

These are implementation choices, not a proof of numerical robustness for every camera/sphere relation. Near-plane intersection, full-screen containment and partial clipping need more than an ellipse parameterization to become a general renderer.

## Known visual limitation

The source retains a dated 2025-08-30 observation that a `repeatD10` line of balls can produce overlong/overlapping ovals at some views. This page does not declare that issue fixed or claim physically exact occlusion. The renderer sorts Canvas drawables rather than using a per-pixel depth buffer; even a correct isolated silhouette would not prove correct inter-object visibility.

For a direct visual investigation, use the selected HTML page's own camera, ball-radius and brush controls, and inspect on-axis/off-axis, near-plane, tangent and camera-inside cases. A screenshot comparison must record which snapshot and camera mode was used. No rendering probe or benchmark is implied by this source description.

## Design context only

Caching camera bases/conic results, adaptive tessellation, WebGL sphere impostors and stricter clipping are potential approaches. The earlier `OptimizedConePlaneRenderer`/SIMD-style recipes were not implemented interfaces. Keep any future optimization subordinate to matching the actual projection and preserving honest degenerate-case behavior.
