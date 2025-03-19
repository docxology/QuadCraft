#pragma once

#include <GLFW/glfw3.h>
#include <functional>
#include <unordered_map>
#include "../core/entity/Camera.h"
#include "../core/world/World.h"
#include "../core/coordinate/Quadray.h"

namespace QuadCraft {

class Input {
public:
    Input(GLFWwindow* window, Camera& camera, World& world)
        : window(window), camera(camera), world(world), 
          firstMouse(true), lastX(0.0f), lastY(0.0f), 
          isLeftMousePressed(false), isRightMousePressed(false) {
        // Register input callbacks with GLFW
        glfwSetWindowUserPointer(window, this);
        
        // Set mouse callback
        glfwSetCursorPosCallback(window, [](GLFWwindow* w, double xpos, double ypos) {
            Input* input = static_cast<Input*>(glfwGetWindowUserPointer(w));
            input->mouseCallback(xpos, ypos);
        });
        
        // Set mouse button callback
        glfwSetMouseButtonCallback(window, [](GLFWwindow* w, int button, int action, int mods) {
            Input* input = static_cast<Input*>(glfwGetWindowUserPointer(w));
            input->mouseButtonCallback(button, action);
        });
        
        // Set scroll callback
        glfwSetScrollCallback(window, [](GLFWwindow* w, double xoffset, double yoffset) {
            Input* input = static_cast<Input*>(glfwGetWindowUserPointer(w));
            input->scrollCallback(xoffset, yoffset);
        });
        
        // Hide cursor and capture it
        glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
    }
    
    // Process all input
    void processInput(float deltaTime) {
        // Check for escape key to exit
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
            glfwSetWindowShouldClose(window, true);
        }
        
        // Camera movement
        if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
            camera.processKeyboard(0, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
            camera.processKeyboard(1, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
            camera.processKeyboard(2, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
            camera.processKeyboard(3, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
            camera.processKeyboard(4, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
            camera.processKeyboard(5, deltaTime);
        
        // Process block placement/removal if mouse buttons are pressed
        if (isLeftMousePressed || isRightMousePressed) {
            // Cast ray to find block to interact with
            auto hitResult = castRayFromCamera(5.0f);
            
            if (hitResult.hit) {
                if (isLeftMousePressed) {
                    // Left mouse button - remove block
                    world.setBlock(hitResult.blockPosition, Block::AIR_BLOCK);
                    isLeftMousePressed = false; // Reset to prevent continuous removal
                }
                else if (isRightMousePressed) {
                    // Right mouse button - place block
                    // Place at the adjacent position
                    world.setBlock(hitResult.adjacentPosition, Block::STONE_BLOCK);
                    isRightMousePressed = false; // Reset to prevent continuous placement
                }
            }
        }
    }
    
    // Mouse movement callback
    void mouseCallback(double xpos, double ypos) {
        if (firstMouse) {
            lastX = static_cast<float>(xpos);
            lastY = static_cast<float>(ypos);
            firstMouse = false;
        }
        
        float xoffset = static_cast<float>(xpos) - lastX;
        float yoffset = lastY - static_cast<float>(ypos); // Reversed since y-coordinates go from bottom to top
        
        lastX = static_cast<float>(xpos);
        lastY = static_cast<float>(ypos);
        
        camera.processMouseMovement(xoffset, yoffset);
    }
    
    // Mouse button callback
    void mouseButtonCallback(int button, int action) {
        if (button == GLFW_MOUSE_BUTTON_LEFT) {
            isLeftMousePressed = (action == GLFW_PRESS);
        }
        else if (button == GLFW_MOUSE_BUTTON_RIGHT) {
            isRightMousePressed = (action == GLFW_PRESS);
        }
    }
    
    // Scroll callback
    void scrollCallback(double xoffset, double yoffset) {
        camera.processMouseScroll(static_cast<float>(yoffset));
    }
    
private:
    // Reference to GLFW window
    GLFWwindow* window;
    
    // Reference to camera
    Camera& camera;
    
    // Reference to world
    World& world;
    
    // Mouse tracking variables
    bool firstMouse;
    float lastX, lastY;
    bool isLeftMousePressed, isRightMousePressed;
    
    // Structure to store ray casting results
    struct RaycastHit {
        bool hit;
        Quadray blockPosition;
        Quadray adjacentPosition;
    };
    
    // Cast a ray from the camera to find blocks
    RaycastHit castRayFromCamera(float maxDistance) {
        // Start at camera position
        Vector3 rayStart = camera.position;
        Vector3 rayDirection = camera.front;
        
        // Step size for ray march
        float stepSize = 0.1f;
        
        // Previous position for calculating adjacent position
        Vector3 prevPos = rayStart;
        
        // Ray march
        for (float distance = 0.0f; distance < maxDistance; distance += stepSize) {
            Vector3 currentPos = rayStart + rayDirection * distance;
            
            // Convert to quadray
            Quadray quadPos = Quadray::fromCartesian(currentPos);
            
            // Check if this position has a block
            Block::BlockID blockId = world.getBlock(quadPos);
            
            if (blockId != Block::AIR_BLOCK) {
                // Hit a block
                // Calculate adjacent position (where we were just before hitting the block)
                Quadray adjacentQuadPos = Quadray::fromCartesian(prevPos);
                
                return {true, quadPos, adjacentQuadPos};
            }
            
            // Store current position for next iteration
            prevPos = currentPos;
        }
        
        // No hit
        return {false, Quadray(), Quadray()};
    }
};

} // namespace QuadCraft 