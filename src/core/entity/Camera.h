#pragma once

#include <iostream>
#include "../coordinate/Vector3.h"
#include "../coordinate/Quadray.h"

namespace QuadCraft {

// Frustum class for view frustum culling
class Frustum {
public:
    // Six planes of the frustum
    // Order: Left, Right, Bottom, Top, Near, Far
    Vector4 planes[6];
    
    // Default constructor
    Frustum() = default;
    
    // Update the frustum planes based on view parameters
    void update(const Vector3& position, const Vector3& front, const Vector3& up, 
                const Vector3& right, float fov, float aspectRatio, float nearDist, float farDist) {
        // Calculate frustum corners
        float tanHalfFov = std::tan(fov * 0.5f * 3.14159f / 180.0f);
        float nearHeight = 2.0f * tanHalfFov * nearDist;
        float nearWidth = nearHeight * aspectRatio;
        float farHeight = 2.0f * tanHalfFov * farDist;
        float farWidth = farHeight * aspectRatio;
        
        // Calculate the centers of the near and far planes
        Vector3 nearCenter = position + front * nearDist;
        Vector3 farCenter = position + front * farDist;
        
        // Calculate the corners of the near plane
        Vector3 nearTopLeft = nearCenter + up * (nearHeight * 0.5f) - right * (nearWidth * 0.5f);
        Vector3 nearTopRight = nearCenter + up * (nearHeight * 0.5f) + right * (nearWidth * 0.5f);
        Vector3 nearBottomLeft = nearCenter - up * (nearHeight * 0.5f) - right * (nearWidth * 0.5f);
        Vector3 nearBottomRight = nearCenter - up * (nearHeight * 0.5f) + right * (nearWidth * 0.5f);
        
        // Calculate the corners of the far plane
        Vector3 farTopLeft = farCenter + up * (farHeight * 0.5f) - right * (farWidth * 0.5f);
        Vector3 farTopRight = farCenter + up * (farHeight * 0.5f) + right * (farWidth * 0.5f);
        Vector3 farBottomLeft = farCenter - up * (farHeight * 0.5f) - right * (farWidth * 0.5f);
        Vector3 farBottomRight = farCenter - up * (farHeight * 0.5f) + right * (farWidth * 0.5f);
        
        // Calculate the planes
        // Left plane
        planes[0] = calculatePlane(nearTopLeft, nearBottomLeft, farBottomLeft);
        
        // Right plane
        planes[1] = calculatePlane(nearBottomRight, nearTopRight, farTopRight);
        
        // Bottom plane
        planes[2] = calculatePlane(nearBottomLeft, nearBottomRight, farBottomRight);
        
        // Top plane
        planes[3] = calculatePlane(nearTopRight, nearTopLeft, farTopLeft);
        
        // Near plane
        planes[4] = calculatePlane(nearTopLeft, nearTopRight, nearBottomRight);
        
        // Far plane
        planes[5] = calculatePlane(farTopRight, farTopLeft, farBottomLeft);
        
        // Normalize all planes
        for (int i = 0; i < 6; i++) {
            normalizePlane(planes[i]);
        }
    }
    
    // Test if a sphere is inside or intersecting the frustum
    bool sphereInFrustum(const Vector3& center, float radius) const {
        for (int i = 0; i < 6; i++) {
            // Calculate the distance from the center of the sphere to the plane
            float distance = planes[i].x * center.x + 
                            planes[i].y * center.y + 
                            planes[i].z * center.z + 
                            planes[i].w;
            
            // If the distance is less than -radius, the sphere is completely outside the frustum
            if (distance < -radius) {
                return false;
            }
        }
        
        // The sphere is either inside or intersecting the frustum
        return true;
    }
    
private:
    // Calculate a plane from three points
    Vector4 calculatePlane(const Vector3& p1, const Vector3& p2, const Vector3& p3) {
        // Calculate two vectors in the plane
        Vector3 v1 = p2 - p1;
        Vector3 v2 = p3 - p1;
        
        // Calculate the normal (cross product of the two vectors)
        Vector3 normal = v1.cross(v2).normalized();
        
        // Calculate the plane equation (Ax + By + Cz + D = 0)
        // where (A, B, C) is the normal and D is the negative dot product of the normal and a point on the plane
        float d = -normal.dot(p1);
        
        return Vector4(normal.x, normal.y, normal.z, d);
    }
    
    // Normalize a plane equation
    void normalizePlane(Vector4& plane) {
        float magnitude = std::sqrt(plane.x * plane.x + plane.y * plane.y + plane.z * plane.z);
        
        if (magnitude > 0.0f) {
            plane.x /= magnitude;
            plane.y /= magnitude;
            plane.z /= magnitude;
            plane.w /= magnitude;
        }
    }
};

// These values will be used directly in the Camera class
enum CameraMovement {
    FORWARD = 0,
    BACKWARD = 1,
    LEFT = 2,
    RIGHT = 3,
    UP = 4,
    DOWN = 5
};

class Camera {
public:
    // Camera attributes
    Vector3 position;
    Vector3 front;
    Vector3 up;
    Vector3 right;
    Vector3 worldUp;
    
    // Tracking previous position for movement calculation
    Vector3 lastPosition;
    float accumulatedQuadrayDistance;
    
    // Camera options
    float movementSpeed;
    float mouseSensitivity;
    float zoom;
    
    // Euler angles
    float yaw;
    float pitch;
    float roll;  // For drone mode
    
    // Target angles for smooth rotation
    float targetYaw;
    float targetPitch;
    float targetRoll;
    
    // Drone mode
    bool isDroneMode;
    
    // Camera constants
    static constexpr float YAW = -90.0f;
    static constexpr float PITCH = 0.0f;
    static constexpr float ROLL = 0.0f;
    static constexpr float SPEED = 50.0f;
    static constexpr float SENSITIVITY = 0.2f;
    static constexpr float ZOOM = 45.0f;
    
    // Constructor with vectors
    Camera(Vector3 position = Vector3(0.0f, 0.0f, 0.0f), Vector3 up = Vector3(0.0f, 1.0f, 0.0f), float yaw = YAW, float pitch = PITCH) :
        front(Vector3(0.0f, 0.0f, -1.0f)),
        movementSpeed(SPEED),
        mouseSensitivity(SENSITIVITY),
        zoom(ZOOM),
        position(position),
        worldUp(up),
        yaw(yaw),
        pitch(pitch),
        roll(ROLL),
        targetYaw(yaw),
        targetPitch(pitch),
        targetRoll(ROLL),
        isDroneMode(false),
        lastPosition(position),
        accumulatedQuadrayDistance(0.0f)
    {
        updateCameraVectors();
        std::cout << "Camera initialized at position: " << position.x << ", " << position.y << ", " << position.z << std::endl;
        
        // Print initial quadray coordinates
        Quadray initialQuadray = Quadray::fromCartesian(position);
        std::cout << "Initial Quadray coordinates: " 
                  << initialQuadray.a << ", " 
                  << initialQuadray.b << ", " 
                  << initialQuadray.c << ", " 
                  << initialQuadray.d << std::endl;
    }
    
    // Returns the view matrix calculated using Euler angles and the LookAt matrix
    std::vector<float> getViewMatrix() {
        // Create the standard view matrix
        Vector3 target = position + front;
        Vector3 f = (target - position).normalized();
        Vector3 r = f.cross(worldUp).normalized();
        Vector3 u = r.cross(f);
        
        // Create view matrix (row-major)
        std::vector<float> view = {
            r.x, r.y, r.z, -r.dot(position),
            u.x, u.y, u.z, -u.dot(position),
            -f.x, -f.y, -f.z, f.dot(position),
            0.0f, 0.0f, 0.0f, 1.0f
        };
        
        return view;
    }
    
    // Processes input received from any keyboard-like input system
    void processKeyboard(CameraMovement direction, float deltaTime) {
        // Calculate base movement speed with delta time
        float velocity = movementSpeed * deltaTime;
        
        // Adaptive speed based on tetrahedral space dynamics
        // Increase velocity in areas with larger tetrahedral distances
        Quadray currentQuadray = Quadray::fromCartesian(position);
        float quadrayMagnitude = currentQuadray.magnitude();
        
        // Apply adaptive speed - increase velocity slightly as we move away from origin
        // But cap it to prevent excessive speed
        float adaptiveFactor = std::min(1.0f + (quadrayMagnitude * 0.01f), 2.0f);
        velocity *= adaptiveFactor;
        
        // Calculate movement vector based on direction
        Vector3 movement(0.0f, 0.0f, 0.0f);
        
        // Apply movement in the requested direction
        if (direction == FORWARD)
            movement = front * velocity;
        if (direction == BACKWARD)
            movement = -front * velocity;
        if (direction == LEFT)
            movement = -right * velocity;
        if (direction == RIGHT)
            movement = right * velocity;
        if (direction == UP)
            movement = up * velocity;
        if (direction == DOWN)
            movement = -up * velocity;
        
        // Save previous position before updating
        Vector3 previousPosition = position;
        
        // Update position
        position += movement;
        
        // Calculate movement magnitude in Cartesian space
        float movementMagnitude = movement.length();
        
        // Calculate movement in tetrahedral space
        Quadray prevQuadray = Quadray::fromCartesian(previousPosition);
        Quadray newQuadray = Quadray::fromCartesian(position);
        float quadrayDistance = prevQuadray.distance(newQuadray);
        
        // Accumulate quadray distance for tracking
        accumulatedQuadrayDistance += quadrayDistance;
        
        // Always report movement in tetrahedral space for consistent tracking
        if (movementMagnitude > 0.0f) {
            reportMovementInTetrahedralSpace(movement);
        }
        
        // Update camera vectors immediately without interpolation
        // This improves responsiveness in tetrahedral space
        updateCameraVectors();
        
        // Update position in quadray coordinates
        updatePositionQuadray();
    }
    
    // Processes input received from a mouse input system
    void processMouseMovement(float xoffset, float yoffset, bool constrainPitch = true) {
        xoffset *= mouseSensitivity;
        yoffset *= mouseSensitivity;
        
        yaw += xoffset;
        pitch += yoffset;
        
        // Normalize yaw to keep it in the range [0, 360)
        while (yaw >= 360.0f) yaw -= 360.0f;
        while (yaw < 0.0f) yaw += 360.0f;
        
        // Make sure that when pitch is out of bounds, screen doesn't get flipped
        if (constrainPitch) {
            if (pitch > 89.0f)
                pitch = 89.0f;
            if (pitch < -89.0f)
                pitch = -89.0f;
        }
        
        // Update target angles for smooth rotation
        targetYaw = yaw;
        targetPitch = pitch;
        
        // Update Front, Right and Up Vectors using the updated Euler angles
        updateCameraVectors();
        
        std::cout << "Mouse movement processed. Yaw: " << yaw << ", Pitch: " << pitch << std::endl;
    }
    
    // Process camera roll (only in drone mode)
    void processRoll(float deltaTime, bool rollLeft) {
        if (!isDroneMode) return;
        
        float rollSpeed = 90.0f; // Degrees per second
        if (rollLeft) {
            roll += rollSpeed * deltaTime;
        } else {
            roll -= rollSpeed * deltaTime;
        }
        
        // Normalize roll to keep it in the range [0, 360)
        while (roll >= 360.0f) roll -= 360.0f;
        while (roll < 0.0f) roll += 360.0f;
        
        targetRoll = roll;
    }
    
    // Toggle drone mode
    void toggleDroneMode() {
        isDroneMode = !isDroneMode;
        
        // Reset roll when disabling drone mode
        if (!isDroneMode) {
            roll = 0.0f;
            targetRoll = 0.0f;
        }
    }
    
    // Processes input received from a mouse scroll-wheel event
    void processMouseScroll(float yoffset) {
        zoom -= yoffset;
        if (zoom < 1.0f)
            zoom = 1.0f;
        if (zoom > 45.0f)
            zoom = 45.0f;
    }
    
    // Report movement in tetrahedral space
    void reportMovementInTetrahedralSpace(const Vector3& movement) {
        // Convert current position to quadray coordinates
        Quadray currentPosQuadray = Quadray::fromCartesian(position);
        
        // Convert previous position to quadray coordinates
        Quadray prevPosQuadray = Quadray::fromCartesian(position - movement);
        
        // Calculate distance moved in quadray space
        float quadrayDistance = currentPosQuadray.distance(prevPosQuadray);
        
        // Calculate cartesian distance for comparison
        float cartesianDistance = movement.length();
        
        // Always log movement details for better tracking in tetrahedral space
        std::cout << "Movement in tetrahedral space:" << std::endl;
        std::cout << "  Cartesian: " << cartesianDistance << " units"
                  << " (" << movement.x << ", " << movement.y << ", " << movement.z << ")" << std::endl;
        std::cout << "  Quadray: " << quadrayDistance << " units" 
                  << " (" << currentPosQuadray.a << ", " << currentPosQuadray.b << ", " 
                  << currentPosQuadray.c << ", " << currentPosQuadray.d << ")" << std::endl;
    }
    
    // Get current quadray position
    Quadray getQuadrayPosition() const {
        return Quadray::fromCartesian(position);
    }
    
    // Get accumulated quadray distance
    float getAccumulatedQuadrayDistance() const {
        return accumulatedQuadrayDistance;
    }
    
    // Calculates the front vector from the Camera's Euler Angles
    void updateCameraVectors() {
        // Calculate the new Front vector
        Vector3 newFront;
        newFront.x = cos(radians(yaw)) * cos(radians(pitch));
        newFront.y = sin(radians(pitch));
        newFront.z = sin(radians(yaw)) * cos(radians(pitch));
        
        // Normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
        front = newFront.normalized();
        
        // Also re-calculate the Right and Up vector
        // Normalize the vectors, because their length gets closer to 0 the more you look up or down which results in slower movement.
        right = front.cross(worldUp).normalized();
        up = right.cross(front).normalized();
        
        // Update the frustum based on the new camera vectors
        updateFrustum();
        
        // Output for debugging
        std::cout << "Camera vectors updated - Front: (" 
                  << front.x << ", " << front.y << ", " << front.z << "), Right: (" 
                  << right.x << ", " << right.y << ", " << right.z << ")" << std::endl;
    }
    
    // Utility function to convert degrees to radians
    float radians(float degrees) const {
        return degrees * 0.01745329251f; // PI/180
    }
    
    /**
     * Updates the quadray coordinates based on the current cartesian position
     */
    void updatePositionQuadray() {
        positionQuadray = Quadray::fromCartesian(position);
    }
    
    /**
     * Gets the current position in quadray coordinates
     */
    const Quadray& getPositionQuadray() const {
        return positionQuadray;
    }
    
    /**
     * Updates the view frustum for culling calculations
     */
    void updateFrustum() {
        // Build the frustum using the current camera parameters
        frustum.update(position, front, up, right, fov, aspectRatio, zNear, zFar);
    }
    
    /**
     * Gets the current view frustum
     */
    const Frustum& getFrustum() const {
        return frustum;
    }
    
    // Returns the projection matrix
    std::vector<float> getProjectionMatrix(float aspect, float nearPlane, float farPlane) const {
        // Calculate projection matrix values
        float tanHalfFov = std::tan(radians(fov / 2.0f));
        float f = 1.0f / tanHalfFov;
        float nf = 1.0f / (nearPlane - farPlane);
        
        // Create perspective projection matrix (column-major)
        std::vector<float> matrix = {
            f / aspect, 0.0f, 0.0f, 0.0f,
            0.0f, f, 0.0f, 0.0f,
            0.0f, 0.0f, (farPlane + nearPlane) * nf, -1.0f,
            0.0f, 0.0f, 2.0f * farPlane * nearPlane * nf, 0.0f
        };
        
        return matrix;
    }
    
private:
    // Camera parameters for frustum calculations
    float fov = 45.0f;
    float aspectRatio = 16.0f / 9.0f;
    float zNear = 0.1f;
    float zFar = 500.0f;
    
    // View frustum for culling
    Frustum frustum;
    
    // Position in quadray coordinates (cached for performance)
    Quadray positionQuadray;
};

} // namespace QuadCraft 