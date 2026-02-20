import unittest
from src.space.geometry import verify_geometric_identities, Quadray, angle_between

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

if __name__ == '__main__':
    unittest.main()
