#pragma once

#include <memory>
#include <unordered_map>
#include <array>
#include <GLFW/glfw3.h>
#include "../core/world/World.h"
#include "../core/entity/Camera.h"
#include "../render/mesh/ChunkMesher.h"
#include "../render/shader/Shader.h"
#include "Input.h"

namespace QuadCraft {

class Game : public GameInputDelegate {
public:
    Game(int width, int height, const std::string& title);
    ~Game();
    
    // Initialize game systems
    bool initialize();
    
    // Run the game loop
    void run();
    
    // Clean up resources
    void cleanup();
    
    // GameInputDelegate interface implementation
    void toggleWireframe() override { showWireframe = !showWireframe; }
    void toggleOverlay() override { showOverlay = !showOverlay; }
    
    // Get current wireframe state
    bool isWireframeEnabled() const { return showWireframe; }
    
    // Get current overlay state
    bool isOverlayEnabled() const { return showOverlay; }
    
    // Check if a chunk is in the view frustum
    bool isChunkInFrustum(const Vector3& center, float size);
    
    // Process input (in addition to the Input class processing)
    void processInput(float deltaTime);
    
private:
    // Window dimensions and title
    int width;
    int height;
    std::string title;
    
    // GLFW window
    GLFWwindow* window;
    
    // Game systems
    std::unique_ptr<World> world;
    std::unique_ptr<Camera> camera;
    std::unique_ptr<ChunkMesher> chunkMesher;
    std::unique_ptr<Input> input;
    
    // Shader for rendering chunks
    std::unique_ptr<Shader> chunkShader;
    
    // Chunk meshes
    std::unordered_map<std::tuple<int, int, int>, std::shared_ptr<Mesh>, ChunkCoordHash> chunkMeshes;
    
    // Delta time for frame rate independence
    float deltaTime;
    float lastFrame;
    
    // Rendering options
    bool showWireframe;
    bool showOverlay;
    bool showDebugInfo;
    
    // Performance tracking
    int lastRenderedChunks = 0;
    
    // Initialize OpenGL
    bool initializeGL();
    
    // Initialize shaders
    bool initializeShaders();
    
    // Initialize world
    void initializeWorld();
    
    // Render the scene
    void render();
    
    // Update game state
    void update();
    
    // Update chunk meshes with a limit on updates per frame
    void updateChunkMeshes(int maxUpdatesPerFrame = 10);
    
    // Draw coordinate overlay
    void drawCoordinateOverlay();
    
    // Create a perspective projection matrix
    std::vector<float> createProjectionMatrix(float fov, float aspect, float nearPlane, float farPlane) const;
    
    // Frustum culling
    struct Frustum {
        std::array<std::array<float, 4>, 6> planes; // Left, right, bottom, top, near, far
    };
    
    Frustum calculateViewFrustum(const float* view, const float* projection);
    
    // Performance reporting
    void reportFrameTime(float deltaTime);
    
    // Method to update FPS counter in window title
    void updateFPS();
};

} // namespace QuadCraft 