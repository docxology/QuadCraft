#pragma once

#include <memory>
#include <unordered_map>
#include <GLFW/glfw3.h>
#include "../core/world/World.h"
#include "../core/entity/Camera.h"
#include "../render/mesh/ChunkMesher.h"
#include "../render/shader/Shader.h"
#include "Input.h"

namespace QuadCraft {

class Game {
public:
    Game(int width, int height, const std::string& title);
    ~Game();
    
    // Initialize game systems
    bool initialize();
    
    // Run the game loop
    void run();
    
    // Clean up resources
    void cleanup();
    
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
    
    // Update chunk meshes
    void updateChunkMeshes();
    
    // Create a perspective projection matrix
    std::vector<float> createProjectionMatrix(float fov, float aspect, float nearPlane, float farPlane) const;
};

} // namespace QuadCraft 