"""
games.src.space.quadrays — Quadray 4D Tetrahedral Coordinate System.

Python port of quadray.js.  Quadray coordinates (a, b, c, d) represent
positions in tetrahedral space using four basis vectors emanating from
the centre of a regular tetrahedron.

All arithmetic returns **normalised** results (min-component zeroed)
unless noted otherwise.  Immutable-style API: every operation returns
a new Quadray instance.
"""

from __future__ import annotations

import logging
import math
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

ROOT2: float = math.sqrt(2)          # 1.4142135623730951
S3: float = math.sqrt(9 / 8)         # 1.0606601717798212


class Quadray:
    """4D tetrahedral coordinate (a, b, c, d)."""

    __slots__ = ("a", "b", "c", "d")

    # ── Construction ─────────────────────────────────────────────────────

    def __init__(self, a: float = 0, b: float = 0,
                 c: float = 0, d: float = 0) -> None:
        self.a = float(a)
        self.b = float(b)
        self.c = float(c)
        self.d = float(d)

    def clone(self) -> Quadray:
        """Return an independent copy."""
        return Quadray(self.a, self.b, self.c, self.d)

    # ── Normalisation ────────────────────────────────────────────────────

    def normalized(self) -> Quadray:
        """Zero-minimum normalisation: subtract the minimum component
        from all four so that at least one component is zero."""
        m = min(self.a, self.b, self.c, self.d)
        return Quadray(self.a - m, self.b - m, self.c - m, self.d - m)

    # ── Cartesian / XYZ conversion ───────────────────────────────────────

    def to_xyz(self) -> Tuple[float, float, float]:
        """Convert Quadray → Cartesian (x, y, z).

        Uses the standard tetrahedron-vertex mapping scaled by 1/√2.
        """
        s = 1.0 / ROOT2
        x = s * (self.a - self.b - self.c + self.d)
        y = s * (self.a - self.b + self.c - self.d)
        z = s * (self.a + self.b - self.c - self.d)
        return (x, y, z)

    @classmethod
    def from_xyz(cls, x: float, y: float, z: float) -> Quadray:
        """Create a normalised Quadray from Cartesian coordinates."""
        s = 1.0 / ROOT2
        a = s * (max(0, x) + max(0, y) + max(0, z))
        b = s * (max(0, -x) + max(0, -y) + max(0, z))
        c = s * (max(0, -x) + max(0, y) + max(0, -z))
        d = s * (max(0, x) + max(0, -y) + max(0, -z))
        return cls(a, b, c, d).normalized()

    # ── Arithmetic ───────────────────────────────────────────────────────

    def __add__(self, other: Quadray) -> Quadray:
        return Quadray(
            self.a + other.a, self.b + other.b,
            self.c + other.c, self.d + other.d,
        ).normalized()

    def __sub__(self, other: Quadray) -> Quadray:
        """Subtraction (NOT normalised — preserves sign for distance calc)."""
        return Quadray(
            self.a - other.a, self.b - other.b,
            self.c - other.c, self.d - other.d,
        )

    def __mul__(self, scalar: float) -> Quadray:
        return Quadray(
            self.a * scalar, self.b * scalar,
            self.c * scalar, self.d * scalar,
        )

    def __rmul__(self, scalar: float) -> Quadray:
        return self.__mul__(scalar)

    def __neg__(self) -> Quadray:
        return Quadray(-self.a, -self.b, -self.c, -self.d)

    # ── Metrics ──────────────────────────────────────────────────────────

    def length(self) -> float:
        """Quadray vector length: √((a² + b² + c² + d²) / 2)."""
        return math.sqrt(
            (self.a**2 + self.b**2 + self.c**2 + self.d**2) / 2
        )

    def distance_to(self, other: Quadray) -> float:
        """Euclidean distance via subtraction → length."""
        return (self - other).length()

    # ── Equality / Hashing ───────────────────────────────────────────────

    def equals(self, other: Quadray, epsilon: float = 1e-4) -> bool:
        """Check equality after normalisation (within tolerance)."""
        n1 = self.normalized()
        n2 = other.normalized()
        return (
            abs(n1.a - n2.a) < epsilon
            and abs(n1.b - n2.b) < epsilon
            and abs(n1.c - n2.c) < epsilon
            and abs(n1.d - n2.d) < epsilon
        )

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Quadray):
            return NotImplemented
        return self.equals(other)

    def __hash__(self) -> int:
        n = self.normalized()
        return hash((round(n.a, 4), round(n.b, 4),
                      round(n.c, 4), round(n.d, 4)))

    # ── Key / String ─────────────────────────────────────────────────────

    def to_key(self) -> str:
        """Integer-rounded normalised key for Maps/Sets."""
        n = self.normalized()
        return f"{round(n.a)},{round(n.b)},{round(n.c)},{round(n.d)}"

    def __repr__(self) -> str:
        return (f"Quadray({self.a:.4f}, {self.b:.4f}, "
                f"{self.c:.4f}, {self.d:.4f})")

    def __str__(self) -> str:
        return (f"({self.a:.2f}, {self.b:.2f}, "
                f"{self.c:.2f}, {self.d:.2f})")

    # ── Tuple / Sequence interface ───────────────────────────────────────

    def as_tuple(self) -> Tuple[float, float, float, float]:
        return (self.a, self.b, self.c, self.d)

    def __iter__(self):
        return iter(self.as_tuple())

    def __getitem__(self, idx: int) -> float:
        return self.as_tuple()[idx]

    def __len__(self) -> int:
        return 4


# ═══════════════════════════════════════════════════════════════════════════
# Basis Vectors  (unit steps in 4D Quadray space)
# ═══════════════════════════════════════════════════════════════════════════

Quadray.A = Quadray(1, 0, 0, 0)  # type: ignore[attr-defined]
Quadray.B = Quadray(0, 1, 0, 0)  # type: ignore[attr-defined]
Quadray.C = Quadray(0, 0, 1, 0)  # type: ignore[attr-defined]
Quadray.D = Quadray(0, 0, 0, 1)  # type: ignore[attr-defined]

Quadray.BASIS = [Quadray.A, Quadray.B, Quadray.C, Quadray.D]  # type: ignore[attr-defined]
Quadray.ORIGIN = Quadray(0, 0, 0, 0)  # type: ignore[attr-defined]

logger.debug("[Quadray] Module loaded – ROOT2=%.6f, S3=%.6f", ROOT2, S3)
