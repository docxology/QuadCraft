import itertools
import math
import unittest

from src.space.geometry import (
    Quadray, angle_between, bounded_neighbors, euclidean_4d, generate_grid,
    manhattan_4d, neighbors, verify_geometric_identities,
)

class TestGeometry(unittest.TestCase):
    def test_geometry_verification(self):
        """Run the internal geometry verification suite."""
        report = verify_geometric_identities()
        self.assertTrue(report.all_passed, f"Geometry Verification Failed:\n{report.summary()}")
        self.assertEqual(report.pass_count, 8)

    def test_quadray_angles(self):
        """Test specific Quadray angle calculations."""
        q1 = Quadray(1, 0, 0, 0)
        q2 = Quadray(0, 1, 0, 0)
        angle = angle_between(q1, q2)
        # Tetrahedral angle is ~109.47 degrees
        self.assertAlmostEqual(angle, 109.4712, places=3)

    def test_signed_fractional_cartesian_metric(self):
        """Physical metric agrees with the published embedding, not raw labels."""
        def xyz(q):
            return (
                (q.a - q.b - q.c + q.d) / math.sqrt(2),
                (q.a - q.b + q.c - q.d) / math.sqrt(2),
                (q.a + q.b - q.c - q.d) / math.sqrt(2),
            )

        points = [
            Quadray(1, 0, 0, 0),
            Quadray(-0.25, 1.5, -2, 0.75),
            Quadray(2.5, -1, 0.5, -3),
            Quadray(9, 9, 9, 9),
        ]
        self.assertAlmostEqual(points[0].length(), math.sqrt(3 / 2))
        for q in points:
            with self.subTest(q=q):
                self.assertAlmostEqual(q.length(), math.hypot(*xyz(q)))
                for p in points:
                    self.assertAlmostEqual(q.distance_to(p), math.dist(xyz(q), xyz(p)))
                shifted = Quadray(q.a + 8, q.b + 8, q.c + 8, q.d + 8)
                self.assertAlmostEqual(q.length(), shifted.length())
                self.assertEqual(q.distance_to(shifted), 0)
        self.assertEqual(points[-1].length(), 0)

    def test_raw_coefficient_distances_keep_label_semantics(self):
        origin, shifted_origin = Quadray(0, 0, 0, 0), Quadray(1, 1, 1, 1)
        self.assertEqual(origin.distance_to(shifted_origin), 0)
        self.assertEqual(manhattan_4d(origin, shifted_origin), 4)
        self.assertEqual(euclidean_4d(origin, shifted_origin), 2)
        labels = generate_grid(2)
        self.assertEqual(len(labels), 16)
        self.assertIn((1, 1, 1, 1), {(q.a, q.b, q.c, q.d) for q in labels})

    def test_normalize_neighbors_before_bounds_matches_javascript(self):
        """Same independently listed boundary fixture as test_grid_utils.js."""
        expected = {
            (0, 0, 0, 0), (0, 0, 2, 2), (0, 1, 2, 1), (0, 2, 0, 2),
            (0, 2, 1, 1), (1, 0, 1, 2), (1, 1, 0, 2),
        }
        tuples = lambda qs: {(q.a, q.b, q.c, q.d) for q in qs}
        self.assertEqual(tuples(bounded_neighbors(0, 1, 1, 2, 3)), expected)
        self.assertEqual(tuples(bounded_neighbors(7, 8, 8, 9, 3)), expected)
        self.assertEqual(len(bounded_neighbors(0, 0, 0, 0, 3)), 12)
        self.assertEqual(bounded_neighbors(0, 0, 0, 0, 2), [])
        self.assertEqual(tuples(neighbors(0, 0, 0, 0)), tuples(neighbors(7, 7, 7, 7)))

    def test_physical_neighbors_match_independent_spatial_graph(self):
        """The induced bounded FCC graph is symmetric and preserves sum mod 4."""
        cells = [q for q in itertools.product(range(3), repeat=4) if min(q) == 0]

        def xyz(q):
            a, b, c, d = q
            return a - b - c + d, a - b + c - d, a + b - c - d

        for p in cells:
            expected = {
                n for n in cells
                if sum((x - y) ** 2 for x, y in zip(xyz(p), xyz(n))) == 8
            }
            actual = {(q.a, q.b, q.c, q.d) for q in bounded_neighbors(*p, 3)}
            with self.subTest(point=p):
                self.assertEqual(actual, expected)
                for n in actual:
                    self.assertEqual((sum(n) - sum(p)) % 4, 0)
                    self.assertIn(p, {(q.a, q.b, q.c, q.d) for q in bounded_neighbors(*n, 3)})

if __name__ == '__main__':
    unittest.main()
