"""
games.src.space — Quadray / IVM / XYZ geometric math.

Python counterpart of the shared JavaScript geometry modules
(quadray.js, synergetics.js, projection.js, grid_utils.js).

Sub-modules:
    quadrays     — Quadray coordinate class with arithmetic + conversion
    ivm          — Isotropic Vector Matrix constants, volume ratios, Jitterbug
    xyz          — Cartesian ↔ Quadray transforms, projection, rotation
    geometry     — Angles, distances, verification suites, grid generation

Usage:
    from games.src.space import Quadray, IVM, xyz_to_quadray, quadray_to_xyz
    q = Quadray(1, 0, 0, 0)
    cart = q.to_xyz()
    print(q, cart, IVM.TETRA_VOL)
"""

from .quadrays import Quadray
from .ivm import IVM, SYNERGETICS, IVMGrid, Jitterbug
from .xyz import (
    quadray_to_xyz, xyz_to_quadray,
    project_quadray, rotate_xyz,
    ScreenPoint, project_basis_axes,
)
from .geometry import (
    angle_between, distance, manhattan_4d, euclidean_4d,
    verify_round_trip, verify_geometric_identities,
    generate_grid, neighbors, bounded_neighbors,
    in_bounds, depth_sort, random_coord,
    CheckResult, VerificationReport,
)

__all__ = [
    # Quadray
    "Quadray",
    # IVM
    "IVM", "SYNERGETICS", "IVMGrid", "Jitterbug",
    # XYZ
    "quadray_to_xyz", "xyz_to_quadray",
    "project_quadray", "rotate_xyz",
    "ScreenPoint", "project_basis_axes",
    # Geometry
    "angle_between", "distance", "manhattan_4d", "euclidean_4d",
    "verify_round_trip", "verify_geometric_identities",
    "CheckResult", "VerificationReport",
    "generate_grid", "neighbors", "bounded_neighbors",
    "in_bounds", "depth_sort", "random_coord",
]
