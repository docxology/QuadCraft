#pragma once

#include "../coordinate/Vector3.h"
#include <vector>

namespace QuadCraft {

class Camera {
public:
    // Camera attributes
    Vector3 position;
    Vector3 front;
    Vector3 up;
    Vector3 right;
    Vector3 worldUp;
    
    // Euler angles
    float yaw;
    float pitch;
    
    // Camera options
    float movementSpeed;
    float mouseSensitivity;
    float zoom;
    
    // Constructor
    Camera(Vector3 position = Vector3(0.0f, 0.0f, 0.0f), 
           Vector3 up = Vector3(0.0f, 1.0f, 0.0f),
           float yaw = -90.0f, float pitch = 0.0f)
        : front(Vector3(0.0f, 0.0f, -1.0f)), movementSpeed(5.0f), 
          mouseSensitivity(0.1f), zoom(45.0f) {
        this->position = position;
        this->worldUp = up;
        this->yaw = yaw;
        this->pitch = pitch;
        updateCameraVectors();
    }
    
    // Get the view matrix
    std::vector<float> getViewMatrix() const {
        // Target is position + front
        Vector3 target = position + front;
        
        // Apply look-at transformation (simplified version)
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
    
    // Process keyboard input
    void processKeyboard(int direction, float deltaTime) {
        float velocity = movementSpeed * deltaTime;
        
        // Forward
        if (direction == 0)
            position = position + front * velocity;
        // Backward
        else if (direction == 1)
            position = position - front * velocity;
        // Left
        else if (direction == 2)
            position = position - right * velocity;
        // Right
        else if (direction == 3)
            position = position + right * velocity;
        // Up
        else if (direction == 4)
            position = position + worldUp * velocity;
        // Down
        else if (direction == 5)
            position = position - worldUp * velocity;
    }
    
    // Process mouse movement
    void processMouseMovement(float xoffset, float yoffset, bool constrainPitch = true) {
        xoffset *= mouseSensitivity;
        yoffset *= mouseSensitivity;
        
        yaw += xoffset;
        pitch += yoffset;
        
        // Constrain pitch
        if (constrainPitch) {
            if (pitch > 89.0f)
                pitch = 89.0f;
            if (pitch < -89.0f)
                pitch = -89.0f;
        }
        
        updateCameraVectors();
    }
    
    // Process mouse scroll (zoom)
    void processMouseScroll(float yoffset) {
        zoom -= yoffset;
        if (zoom < 1.0f)
            zoom = 1.0f;
        if (zoom > 45.0f)
            zoom = 45.0f;
    }
    
private:
    // Update the camera vectors based on updated Euler angles
    void updateCameraVectors() {
        // Calculate the new front vector
        Vector3 newFront;
        newFront.x = cos(radians(yaw)) * cos(radians(pitch));
        newFront.y = sin(radians(pitch));
        newFront.z = sin(radians(yaw)) * cos(radians(pitch));
        front = newFront.normalized();
        
        // Recalculate the right and up vectors
        right = front.cross(worldUp).normalized();
        up = right.cross(front).normalized();
    }
    
    // Convert degrees to radians
    float radians(float degrees) const {
        return degrees * 0.01745329251f; // pi/180
    }
};

} // namespace QuadCraft 