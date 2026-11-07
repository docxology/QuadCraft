// Quadray coordinate math tests.
// Defends the core invariants documented in docs/mathematics/quadray_coordinates.md:
//   - quadray <-> cartesian roundtrip (both directions)
//   - zero-minimum normalization
//   - the four basis quadrays map to the vertices of a regular tetrahedron
//   - distance/symmetry properties of the quadray metric

#include "../src/core/coordinate/Quadray.h"

#include <cmath>
#include <cstdio>

namespace {

int failures = 0;

void expectNear(float actual, float expected, float eps, const char* what) {
    if (!(std::fabs(actual - expected) <= eps)) {
        std::printf("FAIL: %s — expected %g, got %g\n", what,
                    static_cast<double>(expected), static_cast<double>(actual));
        ++failures;
    }
}

void expectTrue(bool condition, const char* what) {
    if (!condition) {
        std::printf("FAIL: %s\n", what);
        ++failures;
    }
}

bool vecNear(const QuadCraft::Vector3& v, const QuadCraft::Vector3& w, float eps) {
    return std::fabs(v.x - w.x) <= eps &&
           std::fabs(v.y - w.y) <= eps &&
           std::fabs(v.z - w.z) <= eps;
}

void testRoundtrip() {
    const QuadCraft::Vector3 samples[] = {
        {0.0f, 0.0f, 0.0f},
        {1.0f, 0.0f, 0.0f},
        {-1.0f, 0.0f, 0.0f},
        {3.5f, -2.25f, 7.75f},
        {-4.0f, -4.0f, -4.0f},
        {12.0f, 8.0f, -6.0f},
    };
    for (const auto& v : samples) {
        QuadCraft::Quadray q = QuadCraft::Quadray::fromCartesian(v);
        QuadCraft::Vector3 back = q.toCartesian();
        if (!vecNear(back, v, 1e-4f)) {
            std::printf("FAIL: roundtrip (%g, %g, %g) -> (%g, %g, %g)\n",
                        static_cast<double>(v.x), static_cast<double>(v.y), static_cast<double>(v.z),
                        static_cast<double>(back.x), static_cast<double>(back.y), static_cast<double>(back.z));
            ++failures;
        }
    }
}

void testNormalized() {
    QuadCraft::Quadray q = QuadCraft::Quadray(1.0f, 2.0f, 3.0f, 4.0f).normalized();
    expectNear(q.a, 0.0f, 1e-6f, "normalized min component is zero (a)");
    expectNear(q.b, 1.0f, 1e-6f, "normalized preserves differences (b)");
    expectNear(q.c, 2.0f, 1e-6f, "normalized preserves differences (c)");
    expectNear(q.d, 3.0f, 1e-6f, "normalized preserves differences (d)");

    // Normalization must not change the cartesian point.
    QuadCraft::Vector3 before = QuadCraft::Quadray(5.0f, 9.0f, 2.0f, 7.0f).toCartesian();
    QuadCraft::Vector3 after = QuadCraft::Quadray(5.0f, 9.0f, 2.0f, 7.0f).normalized().toCartesian();
    expectTrue(vecNear(before, after, 1e-5f), "normalization preserves cartesian position");
}

void testBasisVectors() {
    // The four basis quadrays map to the vertices of a regular tetrahedron:
    // same length, pairwise angle with cos = -1/3.
    const QuadCraft::Quadray basis[] = {
        QuadCraft::Quadray(1.0f, 0.0f, 0.0f, 0.0f),
        QuadCraft::Quadray(0.0f, 1.0f, 0.0f, 0.0f),
        QuadCraft::Quadray(0.0f, 0.0f, 1.0f, 0.0f),
        QuadCraft::Quadray(0.0f, 0.0f, 0.0f, 1.0f),
    };
    const QuadCraft::Vector3 a = basis[0].toCartesian();
    for (int i = 1; i < 4; ++i) {
        QuadCraft::Vector3 bi = basis[i].toCartesian();
        expectNear(bi.length(), a.length(), 1e-5f, "basis vectors have equal length");
        float cosAngle = a.dot(bi) / (a.length() * bi.length());
        expectNear(cosAngle, -1.0f / 3.0f, 1e-5f, "basis pair angle is tetrahedral (cos -1/3)");
    }
}

void testDistance() {
    expectNear(QuadCraft::Quadray::distance(QuadCraft::Quadray(), QuadCraft::Quadray(1, 0, 0, 0)),
               std::sqrt(1.5f), 1e-6f, "distance origin to basis vertex");

    // Symmetry and identity.
    QuadCraft::Quadray p(2.0f, 3.0f, 1.0f, 0.0f);
    QuadCraft::Quadray q(5.0f, 1.0f, 1.0f, 4.0f);
    expectNear(p.distance(p), 0.0f, 1e-6f, "distance to self is zero");
    expectNear(p.distance(q), q.distance(p), 1e-6f, "distance is symmetric");
}

void testCartesianMetric() {
    using QuadCraft::Quadray;
    const Quadray samples[] = {
        Quadray(), Quadray(1, 0, 0, 0), Quadray(8, 7, 7, 7),
        Quadray(-2.5f, 0.25f, 1.5f, -0.75f),
        Quadray(0.5f, -1.25f, 0.75f, 2.0f),
    };
    for (const auto& p : samples) {
        const auto xyz = p.toCartesian();
        expectNear(p.length(), xyz.length(), 1e-5f, "length agrees with Cartesian norm");
        expectNear(p.magnitude(), xyz.length(), 1e-5f, "magnitude agrees with Cartesian norm");
        const float shift = 1048576.0f; // Retains quarter-unit components in float.
        const Quadray shifted(p.a + shift, p.b + shift, p.c + shift, p.d + shift);
        expectNear(p.distance(shifted), 0.0f, 1e-6f, "common offset is zero distance");
        expectNear(shifted.length(), p.length(), 1e-5f, "length ignores large common offset");
        for (const auto& q : samples) {
            const auto other = q.toCartesian();
            const float expected = std::hypot(xyz.x - other.x, xyz.y - other.y, xyz.z - other.z);
            expectNear(p.distance(q), expected, 1e-5f, "distance agrees with Cartesian separation");
            expectNear(shifted.distance(q), expected, 1e-5f, "distance ignores independent gauge shifts");
        }
    }
    expectNear(Quadray(-9, -9, -9, -9).length(), 0.0f, 0.0f, "shifted origin has zero length");
    expectNear(Quadray(1, 0, 0, 0).distance(Quadray(0, 1, 0, 0)),
               2.0f, 1e-6f, "tetrahedron edge has Cartesian length two");
}

void testS3Constant() {
    expectNear(QuadCraft::S3, std::sqrt(9.0f / 8.0f), 1e-6f, "S3 equals sqrt(9/8)");
}

} // namespace

int main() {
    testRoundtrip();
    testNormalized();
    testBasisVectors();
    testDistance();
    testCartesianMetric();
    testS3Constant();

    if (failures != 0) {
        std::printf("%d check(s) failed\n", failures);
        return 1;
    }
    std::printf("quadray_test: all checks passed\n");
    return 0;
}
