#pragma once

#include <cmath>

namespace QuadCraft {

class Vector3 {
public:
    float x, y, z;

    Vector3() : x(0.0f), y(0.0f), z(0.0f) {}
    Vector3(float x, float y, float z) : x(x), y(y), z(z) {}
    
    // Copy constructor
    Vector3(const Vector3& other) : x(other.x), y(other.y), z(other.z) {}
    
    // Assignment operator
    Vector3& operator=(const Vector3& other) {
        if (this != &other) {
            x = other.x;
            y = other.y;
            z = other.z;
        }
        return *this;
    }
    
    // Unary negation operator (needed for movement in opposite directions)
    Vector3 operator-() const {
        return Vector3(-x, -y, -z);
    }
    
    // Basic vector operations
    Vector3 operator+(const Vector3& other) const {
        return Vector3(x + other.x, y + other.y, z + other.z);
    }
    
    Vector3 operator-(const Vector3& other) const {
        return Vector3(x - other.x, y - other.y, z - other.z);
    }
    
    Vector3 operator*(float scalar) const {
        return Vector3(x * scalar, y * scalar, z * scalar);
    }
    
    Vector3 operator/(float scalar) const {
        return Vector3(x / scalar, y / scalar, z / scalar);
    }
    
    // Compound addition
    Vector3& operator+=(const Vector3& other) {
        x += other.x;
        y += other.y;
        z += other.z;
        return *this;
    }
    
    // Compound subtraction
    Vector3& operator-=(const Vector3& other) {
        x -= other.x;
        y -= other.y;
        z -= other.z;
        return *this;
    }
    
    // Length calculations
    float lengthSquared() const {
        return x * x + y * y + z * z;
    }
    
    float length() const {
        return std::sqrt(lengthSquared());
    }
    
    // Distance to another vector
    float distance(const Vector3& other) const {
        return (*this - other).length();
    }
    
    // Squared distance to another vector (faster for comparisons)
    float distanceSquared(const Vector3& other) const {
        float dx = x - other.x;
        float dy = y - other.y;
        float dz = z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }
    
    // Normalization
    Vector3 normalized() const {
        float len = length();
        if (len > 0) {
            return *this / len;
        }
        return *this;
    }
    
    // Cross product
    Vector3 cross(const Vector3& other) const {
        return Vector3(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }
    
    // Dot product
    float dot(const Vector3& other) const {
        return x * other.x + y * other.y + z * other.z;
    }
};

// Added Vector4 class for frustum implementation
class Vector4 {
public:
    float x, y, z, w;
    
    // Default constructor
    Vector4() : x(0.0f), y(0.0f), z(0.0f), w(0.0f) {}
    
    // Constructor
    Vector4(float x, float y, float z, float w) : x(x), y(y), z(z), w(w) {}
    
    // Copy constructor
    Vector4(const Vector4& other) : x(other.x), y(other.y), z(other.z), w(other.w) {}
    
    // Assignment operator
    Vector4& operator=(const Vector4& other) {
        if (this != &other) {
            x = other.x;
            y = other.y;
            z = other.z;
            w = other.w;
        }
        return *this;
    }
    
    // Addition
    Vector4 operator+(const Vector4& other) const {
        return Vector4(x + other.x, y + other.y, z + other.z, w + other.w);
    }
    
    // Subtraction
    Vector4 operator-(const Vector4& other) const {
        return Vector4(x - other.x, y - other.y, z - other.z, w - other.w);
    }
    
    // Scalar multiplication
    Vector4 operator*(float scalar) const {
        return Vector4(x * scalar, y * scalar, z * scalar, w * scalar);
    }
    
    // Scalar division
    Vector4 operator/(float scalar) const {
        return Vector4(x / scalar, y / scalar, z / scalar, w / scalar);
    }
    
    // Length
    float length() const {
        return std::sqrt(x * x + y * y + z * z + w * w);
    }
    
    // Normalized vector
    Vector4 normalized() const {
        float len = length();
        if (len > 0.0f) {
            return Vector4(x / len, y / len, z / len, w / len);
        }
        return *this;
    }
    
    // Dot product
    float dot(const Vector4& other) const {
        return x * other.x + y * other.y + z * other.z + w * other.w;
    }
};

} // namespace QuadCraft 