#pragma once

#include <GLFW/glfw3.h>
#include <functional>
#include <unordered_map>
#include <iomanip>
#include "../core/entity/Camera.h"
#include "../core/world/World.h"
#include "../core/coordinate/Quadray.h"

namespace QuadCraft {

// Interface for game functions needed by Input
class GameInputDelegate {
public:
    virtual ~GameInputDelegate() = default;
    virtual void toggleWireframe() = 0;
    virtual void toggleOverlay() = 0;
};

// Forward declaration
class Game;

class Input {
public:
    Input(GLFWwindow* window, Camera& camera, World& world, GameInputDelegate& delegate)
        : window(window), camera(camera), world(world), delegate(delegate),
          firstMouse(true), lastX(0.0f), lastY(0.0f), 
          isLeftMousePressed(false), isRightMousePressed(false),
          keyStates(512, false), mouseCaptured(false),
          showTetraDistance(false), lastPositionUpdate(0.0f),
          showPositionOverlay(false),
          arrowUp(false), arrowDown(false), arrowLeft(false), arrowRight(false) {  // Initialize key states for all GLFW keys
        
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
        
        // Set key callback
        glfwSetKeyCallback(window, [](GLFWwindow* w, int key, int scancode, int action, int mods) {
            Input* input = static_cast<Input*>(glfwGetWindowUserPointer(w));
            input->keyCallback(key, scancode, action, mods);
        });
        
        // Start with normal cursor (not captured)
        setMouseCaptured(false);
    }
    
    // Process all input
    void processInput(float deltaTime) {
        // Debug deltaTime to check if it's reasonable
        static float lastTime = 0.0f;
        float currentTime = static_cast<float>(glfwGetTime());
        if (currentTime - lastTime > 1.0f) {
            std::cout << "Current deltaTime: " << deltaTime << std::endl;
            lastTime = currentTime;
        }
        
        // Track position and report distance to nearest tetrahedra
        // Don't update every frame to avoid console spam
        if (showTetraDistance && currentTime - lastPositionUpdate > 0.3f) {
            reportTetrahedralDistances();
            lastPositionUpdate = currentTime;
        }
        
        // Check for escape key to exit
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
            if (mouseCaptured) {
                // If mouse is captured, release it instead of closing the window
                setMouseCaptured(false);
            } else {
                glfwSetWindowShouldClose(window, true);
            }
        }
        
        // Toggle mouse capture with Tab key
        if (glfwGetKey(window, GLFW_KEY_TAB) == GLFW_PRESS && !keyStates[GLFW_KEY_TAB]) {
            keyStates[GLFW_KEY_TAB] = true;
            setMouseCaptured(!mouseCaptured);
        } else if (glfwGetKey(window, GLFW_KEY_TAB) == GLFW_RELEASE) {
            keyStates[GLFW_KEY_TAB] = false;
        }
        
        // Toggle tetrahedral distance reporting with F4
        if (glfwGetKey(window, GLFW_KEY_F4) == GLFW_PRESS && !keyStates[GLFW_KEY_F4]) {
            keyStates[GLFW_KEY_F4] = true;
            showTetraDistance = !showTetraDistance;
            std::cout << "Tetrahedral distance reporting: " << (showTetraDistance ? "ON" : "OFF") << std::endl;
        } else if (glfwGetKey(window, GLFW_KEY_F4) == GLFW_RELEASE) {
            keyStates[GLFW_KEY_F4] = false;
        }
        
        // Toggle position overlay with F4
        if (glfwGetKey(window, GLFW_KEY_F4) == GLFW_PRESS && !keyStates[GLFW_KEY_F4]) {
            keyStates[GLFW_KEY_F4] = true;
            showPositionOverlay = !showPositionOverlay;
            std::cout << "Position overlay " << (showPositionOverlay ? "enabled" : "disabled") << std::endl;
            
            // Display position immediately when enabled
            if (showPositionOverlay) {
                displayCameraPosition();
            }
        } else if (glfwGetKey(window, GLFW_KEY_F4) == GLFW_RELEASE) {
            keyStates[GLFW_KEY_F4] = false;
        }
        
        // Handle arrow keys with debug info
        arrowUp = glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS;
        arrowDown = glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS;
        arrowLeft = glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS;
        arrowRight = glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS;
        
        // Log key states for debugging
        static bool loggedKeys = false;
        if ((arrowUp || arrowDown || arrowLeft || arrowRight) && !loggedKeys) {
            if (showTetraDistance) {
                std::cout << "Arrow keys pressed - UP: " << arrowUp 
                          << ", DOWN: " << arrowDown 
                          << ", LEFT: " << arrowLeft 
                          << ", RIGHT: " << arrowRight << std::endl;
            }
            loggedKeys = true;
        } else if (!(arrowUp || arrowDown || arrowLeft || arrowRight)) {
            loggedKeys = false;
        }
        
        // Camera movement with arrow keys (always enabled)
        if (arrowUp) {
            // std::cout << "Arrow Up pressed" << std::endl;
            camera.processKeyboard(FORWARD, deltaTime);
        }
        if (arrowDown) {
            // std::cout << "Arrow Down pressed" << std::endl;
            camera.processKeyboard(BACKWARD, deltaTime);
        }
        if (arrowLeft) {
            // std::cout << "Arrow Left pressed" << std::endl;
            camera.processKeyboard(LEFT, deltaTime);
        }
        if (arrowRight) {
            // std::cout << "Arrow Right pressed" << std::endl;
            camera.processKeyboard(RIGHT, deltaTime);
        }
        
        // Additional test keys for extreme movement
        if (glfwGetKey(window, GLFW_KEY_HOME) == GLFW_PRESS) {
            // Move a large distance forward for testing
            camera.processKeyboard(FORWARD, deltaTime * 10.0f);
            std::cout << "HOME key: Large forward movement" << std::endl;
            if (showTetraDistance) {
                reportTetrahedralDistances();
            }
        }
        
        // Vertical movement (always enabled)
        if (glfwGetKey(window, GLFW_KEY_PAGE_UP) == GLFW_PRESS)
            camera.processKeyboard(UP, deltaTime);
        if (glfwGetKey(window, GLFW_KEY_PAGE_DOWN) == GLFW_PRESS)
            camera.processKeyboard(DOWN, deltaTime);
        
        // Only process WASD movement and block placement when mouse is captured
        if (mouseCaptured) {
            // Camera movement with WASD
            if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
                camera.processKeyboard(FORWARD, deltaTime);
            if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
                camera.processKeyboard(BACKWARD, deltaTime);
            if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
                camera.processKeyboard(LEFT, deltaTime);
            if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
                camera.processKeyboard(RIGHT, deltaTime);
            
            // Additional vertical movement 
            if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
                camera.processKeyboard(UP, deltaTime);
            if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
                camera.processKeyboard(DOWN, deltaTime);
            
            // Process block placement/removal if mouse buttons are pressed
            if (isLeftMousePressed || isRightMousePressed) {
                // Cast ray to find block to interact with
                auto hitResult = castRayFromCamera(5.0f);
                
                if (hitResult.hit) {
                    if (isLeftMousePressed) {
                        // Left mouse button - remove block
                        world.setBlock(hitResult.blockPosition, Block::AIR_BLOCK);
                        isLeftMousePressed = false; // Reset to prevent continuous removal
                        
                        // Report the interaction for debugging
                        if (showTetraDistance) {
                            std::cout << "Removed block at quadray position: " 
                                      << hitResult.blockPosition.a << ", " 
                                      << hitResult.blockPosition.b << ", " 
                                      << hitResult.blockPosition.c << ", " 
                                      << hitResult.blockPosition.d << std::endl;
                        }
                    }
                    else if (isRightMousePressed) {
                        // Right mouse button - place block
                        // Place at the adjacent position
                        world.setBlock(hitResult.adjacentPosition, Block::STONE_BLOCK);
                        isRightMousePressed = false; // Reset to prevent continuous placement
                        
                        // Report the interaction for debugging
                        if (showTetraDistance) {
                            std::cout << "Placed block at quadray position: " 
                                      << hitResult.adjacentPosition.a << ", " 
                                      << hitResult.adjacentPosition.b << ", " 
                                      << hitResult.adjacentPosition.c << ", " 
                                      << hitResult.adjacentPosition.d << std::endl;
                        }
                    }
                }
            }
        }
        
        // Update position display at regular intervals if enabled
        if (showPositionOverlay) {
            float currentTime = glfwGetTime();
            if (currentTime - lastPositionUpdate > 0.5f) { // Update every half second
                displayCameraPosition();
                lastPositionUpdate = currentTime;
            }
        }
    }
    
    // Overload for processInput that takes explicit camera and world references
    void processInput(float deltaTime, Camera& cam, World& worldRef) {
        // Calculate the current key state (to test if keys were just pressed)
        bool shift = glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS || 
                    glfwGetKey(window, GLFW_KEY_RIGHT_SHIFT) == GLFW_PRESS;
        
        bool control = glfwGetKey(window, GLFW_KEY_LEFT_CONTROL) == GLFW_PRESS || 
                      glfwGetKey(window, GLFW_KEY_RIGHT_CONTROL) == GLFW_PRESS;
        
        // Get current position in tetrahedral space
        Quadray cameraQuadray = cam.getPositionQuadray();
        float quadrayMagnitude = cameraQuadray.magnitude();
        
        // Movement speed multiplier based on modifiers
        float speedMultiplier = 1.0f;
        
        // Basic speed modifiers
        if (shift) speedMultiplier = 5.0f;  // 5x speed with Shift
        if (control) speedMultiplier = 20.0f; // 20x speed with Control
        if (shift && control) speedMultiplier = 50.0f; // 50x speed with Shift+Control
        
        // Adaptive speed modifier based on tetrahedral position
        // Apply a scaling factor that adjusts speed based on distance from origin in tetrahedral space
        float tetrahedralAdaptiveFactor = 1.0f;
        
        // Scale speed down when close to origin, up when far away
        // This helps navigation in tetrahedral space where distances can become very large
        if (quadrayMagnitude < 1.0f) {
            tetrahedralAdaptiveFactor = 0.8f; // Slower when close to origin for precision
        } else if (quadrayMagnitude < 10.0f) {
            tetrahedralAdaptiveFactor = 1.0f; // Base speed in normal range
        } else if (quadrayMagnitude < 100.0f) {
            tetrahedralAdaptiveFactor = 1.5f; // Faster in medium distance
        } else if (quadrayMagnitude < 1000.0f) {
            tetrahedralAdaptiveFactor = 2.5f; // Much faster in far distance
        } else {
            tetrahedralAdaptiveFactor = 5.0f; // Very fast in extreme distances
        }
        
        // Apply tetrahedral factor to speed multiplier
        speedMultiplier *= tetrahedralAdaptiveFactor;
        
        // Handle arrow keys with debug info
        arrowUp = glfwGetKey(window, GLFW_KEY_UP) == GLFW_PRESS;
        arrowDown = glfwGetKey(window, GLFW_KEY_DOWN) == GLFW_PRESS;
        arrowLeft = glfwGetKey(window, GLFW_KEY_LEFT) == GLFW_PRESS;
        arrowRight = glfwGetKey(window, GLFW_KEY_RIGHT) == GLFW_PRESS;
        
        // Process tetrahedral distance updates after movement
        bool hasMoved = false;
        
        // Camera movement with arrow keys (always enabled)
        if (arrowUp) {
            cam.processKeyboard(FORWARD, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        if (arrowDown) {
            cam.processKeyboard(BACKWARD, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        if (arrowLeft) {
            cam.processKeyboard(LEFT, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        if (arrowRight) {
            cam.processKeyboard(RIGHT, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        
        // Additional test keys for extreme movement
        if (glfwGetKey(window, GLFW_KEY_HOME) == GLFW_PRESS) {
            // Move a large distance forward for testing
            cam.processKeyboard(FORWARD, deltaTime * 50.0f * tetrahedralAdaptiveFactor);
            std::cout << "HOME key: Large forward movement" << std::endl;
            hasMoved = true;
        }
        
        if (glfwGetKey(window, GLFW_KEY_END) == GLFW_PRESS) {
            // Move a large distance backward for testing
            cam.processKeyboard(BACKWARD, deltaTime * 50.0f * tetrahedralAdaptiveFactor);
            std::cout << "END key: Large backward movement" << std::endl;
            hasMoved = true;
        }
        
        // Vertical movement (always enabled)
        if (glfwGetKey(window, GLFW_KEY_PAGE_UP) == GLFW_PRESS) {
            cam.processKeyboard(UP, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        if (glfwGetKey(window, GLFW_KEY_PAGE_DOWN) == GLFW_PRESS) {
            cam.processKeyboard(DOWN, deltaTime * speedMultiplier);
            hasMoved = true;
        }
        
        // Only process WASD movement and block placement when mouse is captured
        if (mouseCaptured) {
            // Camera movement with WASD
            if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) {
                cam.processKeyboard(FORWARD, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) {
                cam.processKeyboard(BACKWARD, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) {
                cam.processKeyboard(LEFT, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) {
                cam.processKeyboard(RIGHT, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            
            // Additional vertical movement 
            if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS) {
                cam.processKeyboard(UP, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS && !shift) {
                cam.processKeyboard(DOWN, deltaTime * speedMultiplier);
                hasMoved = true;
            }
            
            // Process block placement/removal if mouse buttons are pressed
            if (isLeftMousePressed || isRightMousePressed) {
                // Cast ray to find block to interact with
                auto hitResult = castRayFromCamera(10.0f); // Increased from 5.0f to 10.0f
                
                if (hitResult.hit) {
                    if (isLeftMousePressed) {
                        // Left mouse button - remove block
                        worldRef.setBlock(hitResult.blockPosition, Block::AIR_BLOCK);
                        isLeftMousePressed = false; // Reset to prevent continuous removal
                        
                        // Report the interaction for debugging
                        if (showTetraDistance) {
                            std::cout << "Removed block at quadray position: " 
                                    << hitResult.blockPosition.a << ", " 
                                    << hitResult.blockPosition.b << ", " 
                                    << hitResult.blockPosition.c << ", " 
                                    << hitResult.blockPosition.d << std::endl;
                        }
                    }
                    else if (isRightMousePressed) {
                        // Right mouse button - place block
                        // Place at the adjacent position
                        worldRef.setBlock(hitResult.adjacentPosition, Block::STONE_BLOCK);
                        isRightMousePressed = false; // Reset to prevent continuous placement
                        
                        // Report the interaction for debugging
                        if (showTetraDistance) {
                            std::cout << "Placed block at quadray position: " 
                                    << hitResult.adjacentPosition.a << ", " 
                                    << hitResult.adjacentPosition.b << ", " 
                                    << hitResult.adjacentPosition.c << ", " 
                                    << hitResult.adjacentPosition.d << std::endl;
                        }
                    }
                }
            }
        }
        
        // Update chunks if player has moved
        if (hasMoved) {
            // Update the world with the new camera position to ensure chunks are loaded
            Quadray newCameraQuadray = cam.getPositionQuadray();
            worldRef.generateChunksAround(newCameraQuadray, TetraChunk::CHUNK_GENERATION_RADIUS);
            
            // Periodic reporting when movement occurs
            if (showTetraDistance) {
                float currentTime = glfwGetTime();
                if (currentTime - lastPositionUpdate > 0.3f) {
                    reportTetrahedralDistances();
                    lastPositionUpdate = currentTime;
                }
            }
        }
        
        // Update position display at regular intervals if enabled
        if (showPositionOverlay) {
            float currentTime = glfwGetTime();
            if (currentTime - lastPositionUpdate > 0.25f) { // Increased from 0.5f to 0.25f for more frequent updates
                displayCameraPosition();
                lastPositionUpdate = currentTime;
            }
        }
    }
    
    // Mouse movement callback
    void mouseCallback(double xpos, double ypos) {
        // Only process mouse movement if mouse is captured
        if (!mouseCaptured) return;
        
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
        // Capture mouse on left click if not already captured
        if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS && !mouseCaptured) {
            setMouseCaptured(true);
            return;
        }
        
        // Only process mouse buttons if mouse is captured
        if (!mouseCaptured) return;
        
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
    
    // Key callback for toggle actions
    void keyCallback(int key, int scancode, int action, int mods) {
        // Only process key press events, not releases or repeats
        if (action == GLFW_PRESS) {
            // Toggle wireframe mode with F1
            if (key == GLFW_KEY_F1) {
                delegate.toggleWireframe();
            }
            
            // Toggle coordinate overlay with F2
            if (key == GLFW_KEY_F2) {
                delegate.toggleOverlay();
            }
            
            // Store key state
            if (key >= 0 && key < static_cast<int>(keyStates.size())) {
                keyStates[key] = true;
            }
        }
        else if (action == GLFW_RELEASE) {
            // Reset key state
            if (key >= 0 && key < static_cast<int>(keyStates.size())) {
                keyStates[key] = false;
            }
        }
    }
    
    // Toggle mouse capture
    void setMouseCaptured(bool captured) {
        mouseCaptured = captured;
        if (mouseCaptured) {
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
            firstMouse = true; // Reset first mouse to avoid jumps
        } else {
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
        }
    }
    
    void displayCameraPosition() {
        Vector3 pos = camera.position;
        Quadray qpos = Quadray::fromCartesian(pos);
        
        std::cout << "==== Camera Position ====" << std::endl;
        std::cout << "Cartesian: (" << pos.x << ", " << pos.y << ", " << pos.z << ")" << std::endl;
        std::cout << "Quadray: (" << qpos.a << ", " << qpos.b << ", " << qpos.c << ", " << qpos.d << ")" << std::endl;
        std::cout << "Distance from origin: " << pos.length() << std::endl;
        std::cout << "======================" << std::endl;
    }
    
private:
    // Reference to GLFW window
    GLFWwindow* window;
    
    // Reference to camera
    Camera& camera;
    
    // Reference to world
    World& world;
    
    // Reference to game delegate
    GameInputDelegate& delegate;
    
    // Mouse tracking variables
    bool firstMouse;
    float lastX, lastY;
    bool isLeftMousePressed, isRightMousePressed;
    
    // Key state tracking
    std::vector<bool> keyStates;
    
    // Mouse capture state
    bool mouseCaptured;
    
    // Show tetrahedral distance
    bool showTetraDistance;
    float lastPositionUpdate;
    
    // Show position overlay
    bool showPositionOverlay;
    
    // Arrow key states
    bool arrowUp, arrowDown, arrowLeft, arrowRight;
    
    // Structure to store ray casting results
    struct RaycastHit {
        bool hit;
        Quadray blockPosition;
        Quadray adjacentPosition;
        float distance;  // Distance to hit point
    };
    
    // Cast a ray from the camera to find blocks
    RaycastHit castRayFromCamera(float maxDistance) {
        // Start at camera position
        Vector3 rayStart = camera.position;
        Vector3 rayDirection = camera.front;
        
        // Get current position in quadray coordinates
        Quadray startQuadray = Quadray::fromCartesian(rayStart);
        
        // Use adaptive step size based on distance from origin in tetrahedral space
        // This helps with precision issues that can occur in tetrahedral space
        float baseStepSize = 0.05f; // Base step size
        float adaptiveStepSize = baseStepSize;
        
        // Previous position for calculating adjacent position
        Vector3 prevPos = rayStart;
        Quadray prevQuadPos = startQuadray;
        
        // Ray march
        for (float distance = 0.0f; distance < maxDistance; distance += adaptiveStepSize) {
            // Adjust step size based on current distance
            // Use smaller steps when close to blocks or origin
            float stepMultiplier = 1.0f;
            
            // Calculate current position
            Vector3 currentPos = rayStart + rayDirection * distance;
            
            // Convert to quadray for block checks
            Quadray quadPos = Quadray::fromCartesian(currentPos);
            
            // Compare quadray coordinates to identify when we're crossing tetrahedral boundaries
            float quadrayDifference = (quadPos.a - prevQuadPos.a) * (quadPos.a - prevQuadPos.a) +
                                      (quadPos.b - prevQuadPos.b) * (quadPos.b - prevQuadPos.b) +
                                      (quadPos.c - prevQuadPos.c) * (quadPos.c - prevQuadPos.c) +
                                      (quadPos.d - prevQuadPos.d) * (quadPos.d - prevQuadPos.d);
            
            // If large difference in quadray coordinates, we might be crossing a tetrahedral boundary
            // Use smaller steps for more precision
            if (quadrayDifference > 0.1f) {
                stepMultiplier = 0.5f;
            }
            
            // Apply adaptive step size for next iteration
            adaptiveStepSize = baseStepSize * stepMultiplier;
            
            // Check if this position has a block
            Block::BlockID blockId = world.getBlock(quadPos);
            
            if (blockId != Block::AIR_BLOCK) {
                // Hit a block
                // Calculate adjacent position (where we were just before hitting the block)
                return {true, quadPos, prevQuadPos, distance};
            }
            
            // Store current position for next iteration
            prevPos = currentPos;
            prevQuadPos = quadPos;
        }
        
        // No hit - return the last position we checked
        return {false, Quadray(), prevQuadPos, maxDistance};
    }
    
    // Report distances to nearby tetrahedra
    void reportTetrahedralDistances() {
        Quadray currentQuadPos = Quadray::fromCartesian(camera.position);
        Vector3 cartesianPos = camera.position;
        
        // Get nearest tetrahedral blocks through raycasting in multiple directions
        std::vector<Vector3> testDirections;
        testDirections.push_back(camera.front);                      // Forward
        testDirections.push_back(camera.front * -1.0f);              // Backward
        testDirections.push_back(camera.right);                      // Right
        testDirections.push_back(camera.right * -1.0f);              // Left
        testDirections.push_back(camera.up);                         // Up
        testDirections.push_back(camera.up * -1.0f);                 // Down
        testDirections.push_back(camera.front + camera.right);       // Forward-Right
        testDirections.push_back(camera.front - camera.right);       // Forward-Left
        testDirections.push_back(camera.front + camera.up);          // Forward-Up
        testDirections.push_back(camera.front - camera.up);          // Forward-Down
        
        std::cout << "\n==== TETRAHEDRAL SPACE POSITION REPORT ====" << std::endl;
        std::cout << "Camera position (Cartesian): " 
                  << std::fixed << std::setprecision(2)
                  << cartesianPos.x << ", " 
                  << cartesianPos.y << ", " 
                  << cartesianPos.z << std::endl;
                  
        std::cout << "Camera position (Quadray): " 
                  << std::fixed << std::setprecision(2)
                  << currentQuadPos.a << ", " 
                  << currentQuadPos.b << ", " 
                  << currentQuadPos.c << ", " 
                  << currentQuadPos.d << std::endl;
        
        std::cout << "Distances to nearest tetrahedra:" << std::endl;
        
        // Cast rays in different directions
        for (size_t i = 0; i < testDirections.size(); ++i) {
            Vector3 direction = testDirections[i].normalized();
            Vector3 rayStart = camera.position;
            
            // Use the ray casting function with a specific direction
            float stepSize = 0.1f;
            float maxDistance = 10.0f;
            Vector3 prevPos = rayStart;
            bool foundBlock = false;
            float hitDistance = maxDistance;
            
            for (float distance = 0.0f; distance < maxDistance; distance += stepSize) {
                Vector3 currentPos = rayStart + direction * distance;
                Quadray quadPos = Quadray::fromCartesian(currentPos);
                Block::BlockID blockId = world.getBlock(quadPos);
                
                if (blockId != Block::AIR_BLOCK) {
                    hitDistance = distance;
                    foundBlock = true;
                    break;
                }
                
                prevPos = currentPos;
            }
            
            // Direction name
            std::string dirName;
            if (i == 0) dirName = "Forward";
            else if (i == 1) dirName = "Backward";
            else if (i == 2) dirName = "Right";
            else if (i == 3) dirName = "Left";
            else if (i == 4) dirName = "Up";
            else if (i == 5) dirName = "Down";
            else if (i == 6) dirName = "Forward-Right";
            else if (i == 7) dirName = "Forward-Left";
            else if (i == 8) dirName = "Forward-Up";
            else if (i == 9) dirName = "Forward-Down";
            
            if (foundBlock) {
                std::cout << std::setw(15) << dirName << ": " 
                          << std::fixed << std::setprecision(2) << hitDistance << " units" << std::endl;
            } else {
                std::cout << std::setw(15) << dirName << ": No tetrahedron found within " 
                          << maxDistance << " units" << std::endl;
            }
        }
        
        std::cout << "==========================================" << std::endl;
    }
};

} // namespace QuadCraft 