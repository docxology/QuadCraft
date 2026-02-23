"""
games.src.space.geometry — Angles, distances, verification, grid generation.

Python port of the geometry portions of synergetics.js and grid_utils.js.
Provides:
    • angle_between           — angle (degrees) between two Quadrays
    • distance / manhattan_4d / euclidean_4d — distance metrics
    • verify_round_trip       — Quadray↔XYZ round-trip fidelity
    • verify_geometric_identities — 8-check Synergetics verification suite
    • generate_grid           — full 4D IVM grid cell generation
    • neighbors / bounded_neighbors / in_bounds — adjacency
    • depth_sort              — painter's-algorithm depth ordering
"""

from __future__ import annotations

import logging
import math
import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable

from .quadrays import Quadray, ROOT2, S3
from .ivm import SYNERGETICS

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# Angles
# ═══════════════════════════════════════════════════════════════════════════

def angle_between(q1: Quadray, q2: Quadray) -> float:
    """Angle between two Quadray vectors in **degrees**.

    Ported from synergetics.js `angleBetweenQuadrays`.
    """
    x1, y1, z1 = q1.to_xyz()
    x2, y2, z2 = q2.to_xyz()
    dot = x1 * x2 + y1 * y2 + z1 * z2
    mag1 = math.sqrt(x1**2 + y1**2 + z1**2)
    mag2 = math.sqrt(x2**2 + y2**2 + z2**2)
    if mag1 == 0 or mag2 == 0:
        return 0.0

    cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_angle))


# ═══════════════════════════════════════════════════════════════════════════
# Distance Metrics
# ═══════════════════════════════════════════════════════════════════════════

def distance(q1: Quadray, q2: Quadray) -> float:
    """Euclidean distance between two Quadrays."""
    return q1.distance_to(q2)


def manhattan_4d(q1: Quadray, q2: Quadray) -> float:
    """Manhattan distance over the four Quadray components."""
    return (abs(q1.a - q2.a) + abs(q1.b - q2.b)
            + abs(q1.c - q2.c) + abs(q1.d - q2.d))


def euclidean_4d(q1: Quadray, q2: Quadray) -> float:
    """4-component Euclidean distance (raw, not via Cartesian)."""
    return math.sqrt(
        (q1.a - q2.a)**2 + (q1.b - q2.b)**2
        + (q1.c - q2.c)**2 + (q1.d - q2.d)**2
    )


# ═══════════════════════════════════════════════════════════════════════════
# Verification Suite
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class CheckResult:
    """Result of one verification check."""
    name: str
    description: str
    expected: str
    actual: str
    passed: bool


@dataclass
class VerificationReport:
    """Full 8-check Synergetics verification report."""
    checks: List[CheckResult] = field(default_factory=list)

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.checks)

    @property
    def pass_count(self) -> int:
        return sum(1 for c in self.checks if c.passed)

    def summary(self) -> str:
        lines = ["Synergetics Verification Report", "─" * 45]
        for c in self.checks:
            icon = "✅" if c.passed else "❌"
            lines.append(f"  {icon} {c.name}")
        status = "ALL PASSED" if self.all_passed else f"{self.pass_count}/{len(self.checks)} passed"
        lines.append(f"\nResult: {status}")
        return "\n".join(lines)


def verify_round_trip(q: Quadray, tolerance: float = 0.01) -> CheckResult:
    """Verify Quadray → XYZ → Quadray round-trip fidelity."""
    xyz = q.to_xyz()
    recovered = Quadray.from_xyz(*xyz)
    error = q.normalized().distance_to(recovered.normalized())
    return CheckResult(
        name="Round-Trip",
        description=f"Quadray→XYZ→Quadray for {q}",
        expected=f"error < {tolerance}",
        actual=f"error={error:.6f}",
        passed=error < tolerance,
    )


def verify_geometric_identities(tolerance: float = 0.01) -> VerificationReport:
    """Run all 8 Synergetics geometry checks (mirrors verifyGeometricIdentities JS).

    Checks:
        1. Basis vector lengths         ≈ 0.7071
        2. Tetrahedral angles           ≈ 109.47°
        3. Origin identity              → (0,0,0)
        4. Round-trip conversion         (6 test points)
        5. Distance symmetry             d(A,B) = d(B,A)
        6. Triangle inequality           d(A,B)+d(B,C) ≥ d(A,C)
        7. S3 constant validation        √(9/8)
        8. Volume ratios                 1:4:20
    """
    report = VerificationReport()

    # 1. Basis vector lengths
    basis_lengths = [b.length() for b in Quadray.BASIS]
    report.checks.append(CheckResult(
        name="Basis Vector Lengths",
        description="All 4 basis vectors should have length ≈0.7071",
        expected=f"{SYNERGETICS.BASIS_LENGTH:.4f}",
        actual=str([f"{l:.4f}" for l in basis_lengths]),
        passed=all(abs(l - SYNERGETICS.BASIS_LENGTH) < tolerance for l in basis_lengths),
    ))

    # 2. Tetrahedral angles (all 6 pairs)
    labels = ["A", "B", "C", "D"]
    angles = []
    for i in range(4):
        for j in range(i + 1, 4):
            a = angle_between(Quadray.BASIS[i], Quadray.BASIS[j])
            angles.append((f"{labels[i]}-{labels[j]}", a))
    report.checks.append(CheckResult(
        name="Tetrahedral Symmetry",
        description=f"All basis pairs should form {SYNERGETICS.TETRAHEDRAL_ANGLE:.2f}° angles",
        expected=f"{SYNERGETICS.TETRAHEDRAL_ANGLE:.2f}",
        actual=str([(p, f"{a:.2f}") for p, a in angles]),
        passed=all(abs(a - SYNERGETICS.TETRAHEDRAL_ANGLE) < 1.0 for _, a in angles),
    ))

    # 3. Origin identity
    ox, oy, oz = Quadray.ORIGIN.to_xyz()
    report.checks.append(CheckResult(
        name="Origin Identity",
        description="Quadray (0,0,0,0) → Cartesian (0,0,0)",
        expected="(0, 0, 0)",
        actual=f"({ox:.4f}, {oy:.4f}, {oz:.4f})",
        passed=all(abs(v) < tolerance for v in (ox, oy, oz)),
    ))

    # 4. Round-trip conversion (6 test points)
    test_points = [
        Quadray(1, 0, 0, 0), Quadray(0, 1, 0, 0),
        Quadray(0, 0, 1, 0), Quadray(0, 0, 0, 1),
        Quadray(2, 1, 0, 1), Quadray(3, 2, 1, 0),
    ]
    rt_results = [verify_round_trip(q) for q in test_points]
    report.checks.append(CheckResult(
        name="Round-Trip Conversion",
        description="Quadray→XYZ→Quadray recovers original position",
        expected="all errors < 0.01",
        actual=str([r.actual for r in rt_results]),
        passed=all(r.passed for r in rt_results),
    ))

    # 5. Distance symmetry
    qA, qB = Quadray(1, 0, 0, 0), Quadray(0, 1, 0, 0)
    d1 = qA.distance_to(qB)
    d2 = qB.distance_to(qA)
    report.checks.append(CheckResult(
        name="Distance Symmetry",
        description="distance(A,B) == distance(B,A)",
        expected="d1 == d2",
        actual=f"d1={d1:.6f}, d2={d2:.6f}",
        passed=abs(d1 - d2) < 1e-4,
    ))

    # 6. Triangle inequality
    qC = Quadray(0, 0, 1, 0)
    dAB = qA.distance_to(qB)
    dBC = qB.distance_to(qC)
    dAC = qA.distance_to(qC)
    report.checks.append(CheckResult(
        name="Triangle Inequality",
        description="d(A,B) + d(B,C) ≥ d(A,C)",
        expected=f"{dAB:.4f} + {dBC:.4f} ≥ {dAC:.4f}",
        actual=f"{dAB + dBC:.4f} ≥ {dAC:.4f}",
        passed=(dAB + dBC) >= dAC - tolerance,
    ))

    # 7. S3 constant
    expected_s3 = math.sqrt(9 / 8)
    report.checks.append(CheckResult(
        name="S3 Constant Validation",
        description="S3 = √(9/8) ≈ 1.0607",
        expected=f"{expected_s3:.6f}",
        actual=f"{S3:.6f}",
        passed=abs(S3 - expected_s3) < 1e-4,
    ))

    # 8. Volume ratios
    report.checks.append(CheckResult(
        name="Synergetics Volume Ratios",
        description="Tetra:Octa:Cubo = 1:4:20",
        expected="1:4:20",
        actual=f"{SYNERGETICS.TETRA_VOL}:{SYNERGETICS.OCTA_VOL}:{SYNERGETICS.CUBO_VOL}",
        passed=(SYNERGETICS.OCTA_VOL // SYNERGETICS.TETRA_VOL == 4
                and SYNERGETICS.CUBO_VOL // SYNERGETICS.TETRA_VOL == 20),
    ))

    logger.info("[Geometry] Verification: %d/%d passed",
                report.pass_count, len(report.checks))
    return report


# ═══════════════════════════════════════════════════════════════════════════
# IVM Grid Generation (mirrors grid_utils.js)
# ═══════════════════════════════════════════════════════════════════════════

# The 12 face-touching IVM direction vectors
DIRECTIONS = [
    (0, 1, 1, 2), (0, 1, 2, 1), (0, 2, 1, 1),
    (1, 0, 1, 2), (1, 0, 2, 1), (1, 1, 0, 2),
    (1, 1, 2, 0), (1, 2, 0, 1), (1, 2, 1, 0),
    (2, 0, 1, 1), (2, 1, 0, 1), (2, 1, 1, 0)
]


def generate_grid(size: int) -> List[Quadray]:
    """Generate all cells in a size⁴ Quadray integer grid.

    Returns size⁴ Quadray instances with integer components ∈ [0, size).
    """
    cells = []
    for a in range(size):
        for b in range(size):
            for c in range(size):
                for d in range(size):
                    cells.append(Quadray(a, b, c, d))
    return cells


def in_bounds(a: int, b: int, c: int, d: int, size: int) -> bool:
    """Check if (a,b,c,d) is within a size⁴ grid."""
    return 0 <= a < size and 0 <= b < size and 0 <= c < size and 0 <= d < size


def neighbors(a: int, b: int, c: int, d: int) -> List[Quadray]:
    """Return the 12 kissing neighbours (unbounded)."""
    return [
        Quadray(a + da, b + db, c + dc, d + dd)
        for da, db, dc, dd in DIRECTIONS
    ]


def bounded_neighbors(a: int, b: int, c: int, d: int, size: int) -> List[Quadray]:
    """Return only in-bounds face-touching neighbours."""
    return [
        Quadray(a + da, b + db, c + dc, d + dd)
        for da, db, dc, dd in DIRECTIONS
        if in_bounds(a + da, b + db, c + dc, d + dd, size)
    ]


def depth_sort(
    cells: List[Quadray],
    project_fn: Optional[Callable] = None,
) -> List[dict]:
    """Sort cells by projected depth (painter's algorithm).

    If project_fn is provided, it should accept (a, b, c, d) and return
    a dict with at least 'scale' key.  Otherwise a simple sum heuristic
    is used.

    Returns list of dicts: {'quadray': Quadray, 'px': x, 'py': y, 'pscale': scale}.
    """
    results = []
    for q in cells:
        if project_fn:
            p = project_fn(q.a, q.b, q.c, q.d)
            results.append({
                "quadray": q,
                "px": p.get("x", 0),
                "py": p.get("y", 0),
                "pscale": p.get("scale", q.a + q.b + q.c + q.d),
            })
        else:
            results.append({
                "quadray": q,
                "px": q.a - q.b,
                "py": q.c - q.d,
                "pscale": q.a + q.b + q.c + q.d,
            })
    results.sort(key=lambda r: r["pscale"])
    return results


def random_coord(size: int) -> Quadray:
    """Return a random Quadray with integer components ∈ [0, size)."""
    return Quadray(
        random.randint(0, size - 1),
        random.randint(0, size - 1),
        random.randint(0, size - 1),
        random.randint(0, size - 1),
    )


logger.debug("[Geometry] Module loaded – %d directions defined", len(DIRECTIONS))
