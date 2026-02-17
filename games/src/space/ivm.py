"""
games.src.space.ivm — Isotropic Vector Matrix constants & volume ratios.

Python port of synergetics.js.  Contains R. Buckminster Fuller's
Synergetics constants used throughout QuadCraft:

    • ROOT2, S3 (scaling factors)
    • Tetrahedral angle (109.4712°)
    • Volume ratios in *tetravolumes* (Tetra:Octa:Cubo = 1:4:20)
    • IVM geometry helpers (sphere packing, Jitterbug transform, etc.)
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# Core Constants
# ═══════════════════════════════════════════════════════════════════════════

ROOT2: float = math.sqrt(2)
S3: float = math.sqrt(9 / 8)  # XYZ → IVM volume conversion factor


@dataclass(frozen=True)
class SynergeticsConstants:
    """Immutable collection of Fuller's Synergetics constants."""

    # Scaling factors
    ROOT2: float = ROOT2
    S3: float = S3

    # Tetrahedral geometry
    TETRAHEDRAL_ANGLE: float = 109.4712          # degrees between any two basis vectors
    BASIS_LENGTH: float = 1.0 / ROOT2            # ~0.7071

    # Volume ratios in tetravolumes
    TETRA_VOL: int = 1
    OCTA_VOL: int = 4
    CUBO_VOL: int = 20
    ICOSA_VOL: float = 18.512296         # ~5√2 × φ²
    RHOMBIC_DODECA_VOL: int = 6          # space-filling partner

    # Sphere packing
    SPHERE_PACKING_DENSITY: float = math.pi / (3 * math.sqrt(2))  # ~0.7405 (FCC)
    KISSING_NUMBER: int = 12             # touching neighbours in FCC/HCP

    # Frequency (grid resolution)
    DEFAULT_FREQUENCY: int = 1           # unit-edge tetrahedron

    # D/R ratio — Diameter/Radius in IVM
    D_OVER_R: float = 2.0

    # Phi — golden ratio (relevant to Icosa/Pentadodeca)
    PHI: float = (1 + math.sqrt(5)) / 2  # 1.6180339887…

    def volume_xyz_to_ivm(self, xyz_volume: float) -> float:
        """Convert XYZ cubic volume → IVM tetravolume (multiply by S3)."""
        return xyz_volume * self.S3

    def volume_ivm_to_xyz(self, ivm_volume: float) -> float:
        """Convert IVM tetravolume → XYZ cubic volume (divide by S3)."""
        return ivm_volume / self.S3


# Singleton instances
SYNERGETICS = SynergeticsConstants()
IVM = SYNERGETICS  # alias


# ═══════════════════════════════════════════════════════════════════════════
# IVM Grid Geometry
# ═══════════════════════════════════════════════════════════════════════════

class IVMGrid:
    """Isotropic Vector Matrix grid utilities.

    An IVM grid of frequency *f* tiles 3-space with alternating tetrahedra
    and octahedra.  Each vertex sits at a Quadray integer coordinate.
    """

    def __init__(self, frequency: int = 1):
        self.frequency = frequency
        logger.info("[IVMGrid] Created freq=%d", frequency)

    @property
    def vertex_count(self) -> int:
        """Number of vertices in a freq-f IVM tetrahedron: (f+1)(f+2)(f+3)/6."""
        f = self.frequency
        return (f + 1) * (f + 2) * (f + 3) // 6

    @property
    def tetra_count(self) -> int:
        """Number of tetrahedra in a freq-f IVM tetrahedron: f³."""
        return self.frequency ** 3

    @property
    def octa_count(self) -> int:
        """Number of octahedra: f(f-1)(f-2)/6 for f ≥ 3."""
        f = self.frequency
        if f < 3:
            return 0
        return f * (f - 1) * (f - 2) // 6

    @property
    def edge_length(self) -> float:
        """Edge length at this frequency (D units)."""
        return 1.0 / self.frequency

    def volume_tetra(self) -> float:
        """Volume of a single tetrahedron at this frequency (tetravolumes)."""
        return (1.0 / self.frequency) ** 3

    def volume_octa(self) -> float:
        """Volume of a single octahedron at this frequency (tetravolumes)."""
        return 4.0 * self.volume_tetra()


# ═══════════════════════════════════════════════════════════════════════════
# Jitterbug Transform
# ═══════════════════════════════════════════════════════════════════════════

class Jitterbug:
    """Fuller's Jitterbug transformation: VE ↔ Icosa ↔ Octa.

    Models the continuous transformation between the vector equilibrium
    (cuboctahedron), icosahedron, and octahedron by rotating triangular
    faces through a series of angular states.

    The Jitterbug demonstrates how the cuboctahedron (VE, volume = 20)
    contracts to the octahedron (volume = 4) via the icosahedron
    (volume ≈ 18.51).
    """

    # Reference volumes in tetravolumes
    VE_VOLUME: float = 20.0
    ICOSA_VOLUME: float = 18.512296
    OCTA_VOLUME: float = 4.0

    # Angular states
    VE_ANGLE: float = 0.0               # fully open → cuboctahedron
    ICOSA_ANGLE: float = 10.8123         # icosahedral intermediate
    OCTA_ANGLE: float = 30.0             # fully closed → octahedron

    @classmethod
    def volume_at_angle(cls, theta_deg: float) -> float:
        """Approximate volume at a given Jitterbug angle.

        Linear interpolation between VE (0°) → Icosa (~10.8°) → Octa (30°).
        """
        if theta_deg <= 0:
            return cls.VE_VOLUME
        if theta_deg >= cls.OCTA_ANGLE:
            return cls.OCTA_VOLUME
        if theta_deg <= cls.ICOSA_ANGLE:
            t = theta_deg / cls.ICOSA_ANGLE
            return cls.VE_VOLUME + t * (cls.ICOSA_VOLUME - cls.VE_VOLUME)
        else:
            t = (theta_deg - cls.ICOSA_ANGLE) / (cls.OCTA_ANGLE - cls.ICOSA_ANGLE)
            return cls.ICOSA_VOLUME + t * (cls.OCTA_VOLUME - cls.ICOSA_VOLUME)

    @classmethod
    def phases(cls) -> list:
        """Return the three canonical Jitterbug phases."""
        return [
            {"name": "VE (Cuboctahedron)", "angle": cls.VE_ANGLE, "volume": cls.VE_VOLUME},
            {"name": "Icosahedron", "angle": cls.ICOSA_ANGLE, "volume": cls.ICOSA_VOLUME},
            {"name": "Octahedron", "angle": cls.OCTA_ANGLE, "volume": cls.OCTA_VOLUME},
        ]


logger.debug(
    "[IVM] Module loaded – TETRA=%d, OCTA=%d, CUBO=%d, S3=%.6f",
    SYNERGETICS.TETRA_VOL, SYNERGETICS.OCTA_VOL,
    SYNERGETICS.CUBO_VOL, SYNERGETICS.S3,
)
