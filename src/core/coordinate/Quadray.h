#pragma once

#include <array>
#include <cmath>
#include <algorithm>
#include "Vector3.h"

namespace QuadCraft {

// Four real coefficients for a 3D point, modulo a common additive offset.
// Coefficient-unit basis vectors have Cartesian length sqrt(3/2).
class Quadray {
public:
    // Four components of quadray coordinates
    float a, b, c, d;
    
    static constexpr float ROOT2 = 1.4142135623730951f;
    
    Quadray() : a(0.0f), b(0.0f), c(0.0f), d(0.0f) {}
    Quadray(float a, float b, float c, float d) : a(a), b(b), c(c), d(d) {}
    
    // Normalize to ensure at least one coordinate is zero (zero-minimum normalization)
    Quadray normalized() const {
        float minVal = std::min({a, b, c, d});
        return Quadray(a - minVal, b - minVal, c - minVal, d - minVal);
    }
    
    // Convert from quadray to Cartesian coordinates
    Vector3 toCartesian() const {
        const float scale = 1.0f / ROOT2;
        float x = scale * ((a - b) - (c - d));
        float y = scale * ((a - b) + (c - d));
        float z = scale * ((a - c) + (b - d));
        return Vector3(x, y, z);
    }
    
    // Convert from Cartesian to quadray coordinates
    static Quadray fromCartesian(const Vector3& v) {
        const float scale = 1.0f / ROOT2;
        
        float a = scale * (std::max(0.0f, v.x) + std::max(0.0f, v.y) + std::max(0.0f, v.z));
        float b = scale * (std::max(0.0f, -v.x) + std::max(0.0f, -v.y) + std::max(0.0f, v.z));
        float c = scale * (std::max(0.0f, -v.x) + std::max(0.0f, v.y) + std::max(0.0f, -v.z));
        float d = scale * (std::max(0.0f, v.x) + std::max(0.0f, -v.y) + std::max(0.0f, -v.z));
        
        Quadray result(a, b, c, d);
        return result.normalized();
    }
    
    // Euclidean length in toCartesian() units; common offsets are gauge only.
    float length() const {
        const float ab = a - b;
        const float cd = c - d;
        return std::hypot((ab - cd) / ROOT2, (ab + cd) / ROOT2,
                          ((a - c) + (b - d)) / ROOT2);
    }
    
    // Calculate the magnitude (distance from origin) in quadray space
    // This is equivalent to length() for quadrays, but explicitly shows its purpose
    float magnitude() const {
        return length();
    }
    
    // Basic operations
    Quadray operator+(const Quadray& other) const {
        return Quadray(a + other.a, b + other.b, c + other.c, d + other.d).normalized();
    }
    
    Quadray operator*(float scalar) const {
        return Quadray(a * scalar, b * scalar, c * scalar, d * scalar);
    }
    
    // Euclidean distance, removing each gauge before differencing points.
    static float distance(const Quadray& q1, const Quadray& q2) {
        const float ab = (q1.a - q1.b) - (q2.a - q2.b);
        const float cd = (q1.c - q1.d) - (q2.c - q2.d);
        const float ac = (q1.a - q1.c) - (q2.a - q2.c);
        const float bd = (q1.b - q1.d) - (q2.b - q2.d);
        return std::hypot((ab - cd) / ROOT2, (ab + cd) / ROOT2,
                          (ac + bd) / ROOT2);
    }
    
    // Distance to another quadray coordinate (instance method)
    float distance(const Quadray& other) const {
        return Quadray::distance(*this, other);
    }
};

// The S3 constant for volume conversions between coordinate systems
constexpr float S3 = 1.0606601717798212f; // sqrt(9/8)

} // namespace QuadCraft 