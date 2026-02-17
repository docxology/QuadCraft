"""
games.src.space.xyz — Cartesian ↔ Quadray transforms, projection, rotation.

Python port of projection.js.  Provides:
    • quadray_to_xyz / xyz_to_quadray  — coordinate conversions
    • project_quadray                  — 3D → 2D perspective projection
    • rotate_xyz                       — Euler-style X/Y rotation
"""

from __future__ import annotations

import logging
import math
from typing import Tuple, NamedTuple

from .quadrays import Quadray, ROOT2

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# Coordinate Conversion
# ═══════════════════════════════════════════════════════════════════════════

def quadray_to_xyz(q: Quadray) -> Tuple[float, float, float]:
    """Convert a Quadray to Cartesian (x, y, z).

    Delegates to Quadray.to_xyz() for consistency.
    """
    return q.to_xyz()


def xyz_to_quadray(x: float, y: float, z: float) -> Quadray:
    """Convert Cartesian (x, y, z) to a normalised Quadray.

    Delegates to Quadray.from_xyz() for consistency.
    """
    return Quadray.from_xyz(x, y, z)


# ═══════════════════════════════════════════════════════════════════════════
# 3D Rotation (matches projection.js rotation logic)
# ═══════════════════════════════════════════════════════════════════════════

def rotate_xyz(
    x: float, y: float, z: float,
    rot_x: float = 0.0, rot_y: float = 0.0,
) -> Tuple[float, float, float]:
    """Apply Y-then-X Euler rotation to (x, y, z).

    Matches the rotation convention in projection.js:
    1. Rotate around Y-axis by rot_y
    2. Rotate around X-axis by rot_x

    Args:
        x, y, z:  Cartesian coordinates
        rot_x:    X rotation angle in radians
        rot_y:    Y rotation angle in radians

    Returns:
        Rotated (x', y', z')
    """
    cos_y, sin_y = math.cos(rot_y), math.sin(rot_y)
    cos_x, sin_x = math.cos(rot_x), math.sin(rot_x)

    # Step 1: Y rotation
    x1 = x * cos_y - z * sin_y
    z1 = x * sin_y + z * cos_y
    y1 = y

    # Step 2: X rotation
    y2 = y1 * cos_x - z1 * sin_x
    z2 = y1 * sin_x + z1 * cos_x

    return (x1, y2, z2)


# ═══════════════════════════════════════════════════════════════════════════
# 2D Screen Projection
# ═══════════════════════════════════════════════════════════════════════════

class ScreenPoint(NamedTuple):
    """Result of projecting a 3D point to 2D screen space."""
    x: float
    y: float
    scale: float  # perspective scaling factor


def project_quadray(
    q: Quadray, *,
    rot_x: float = 0.0,
    rot_y: float = 0.0,
    scale: float = 35.0,
    camera_dist: float = 5.0,
    center_x: float = 300.0,
    center_y: float = 300.0,
) -> ScreenPoint:
    """Project a Quadray position to 2D screen coordinates.

    Mirrors projectQuadray() from projection.js exactly:
    1. Convert Quadray → Cartesian
    2. Apply Y/X rotation
    3. Apply perspective divide

    Args:
        q:           The Quadray to project
        rot_x:       X rotation angle (radians)
        rot_y:       Y rotation angle (radians)
        scale:       Rendering scale factor
        camera_dist: Camera distance for perspective
        center_x:    Screen center X
        center_y:    Screen center Y

    Returns:
        ScreenPoint(x, y, scale)
    """
    # Quadray → Cartesian
    cx, cy, cz = q.to_xyz()

    # Rotate
    rx, ry, rz = rotate_xyz(cx, cy, cz, rot_x, rot_y)

    # Perspective divide
    perspective = camera_dist / (camera_dist + rz) if (camera_dist + rz) != 0 else 1.0

    return ScreenPoint(
        x=center_x + rx * scale * perspective,
        y=center_y - ry * scale * perspective,
        scale=perspective,
    )


def project_basis_axes(
    *,
    rot_x: float = 0.0,
    rot_y: float = 0.0,
    scale: float = 35.0,
    camera_dist: float = 5.0,
    center_x: float = 300.0,
    center_y: float = 300.0,
    axis_len: float = 2.0,
) -> list:
    """Project all four Quadray basis axes for overlay drawing.

    Returns a list of dicts with keys:
        label, color, origin (ScreenPoint), tip (ScreenPoint)

    Matches drawQuadrayAxes() from projection.js.
    """
    proj_kwargs = dict(
        rot_x=rot_x, rot_y=rot_y, scale=scale,
        camera_dist=camera_dist, center_x=center_x, center_y=center_y,
    )
    origin = project_quadray(Quadray.ORIGIN, **proj_kwargs)

    axes_defs = [
        {"label": "A", "color": "#ff4444", "q": Quadray(axis_len, 0, 0, 0)},
        {"label": "B", "color": "#44ff44", "q": Quadray(0, axis_len, 0, 0)},
        {"label": "C", "color": "#4444ff", "q": Quadray(0, 0, axis_len, 0)},
        {"label": "D", "color": "#ffaa00", "q": Quadray(0, 0, 0, axis_len)},
    ]
    result = []
    for ax in axes_defs:
        tip = project_quadray(ax["q"], **proj_kwargs)
        result.append({
            "label": ax["label"],
            "color": ax["color"],
            "origin": origin,
            "tip": tip,
        })
    return result


logger.debug("[XYZ] Module loaded")
