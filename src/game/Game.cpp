#include <GL/glew.h>
#include "Game.h"
#include <iostream>
#include <cmath>
#include "../core/coordinate/Quadray.h"

namespace QuadCraft {

// Default vertex shader
const std::string DEFAULT_VERTEX_SHADER = R"(
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec3 aColor;
layout (location = 3) in vec2 aTexCoord;

out vec3 FragPos;
out vec3 Normal;
out vec3 Color;
out vec2 TexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = aNormal;
    Color = aColor;
    TexCoord = aTexCoord;
    
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
)";

// Default fragment shader
const std::string DEFAULT_FRAGMENT_SHADER = R"(
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec3 Color;
in vec2 TexCoord;

uniform vec3 lightPos;
uniform vec3 viewPos;

void main() {
    // Ambient light
    vec3 ambient = 0.2 * Color;
    
    // Diffuse light
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * Color;
    
    // Specular light
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
    vec3 specular = 0.5 * spec * vec3(1.0, 1.0, 1.0);
    
    // Final color
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}
)";

Game::Game(int width, int height, const std::string& title)
    : width(width), height(height), title(title), window(nullptr),
      deltaTime(0.0f), lastFrame(0.0f) {
}

Game::~Game() {
    cleanup();
}

bool Game::initialize() {
    // Initialize GLFW
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return false;
    }
    
    // Set OpenGL version
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    
    // Create window
    window = glfwCreateWindow(width, height, title.c_str(), nullptr, nullptr);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return false;
    }
    
    // Make the window's context current
    glfwMakeContextCurrent(window);
    
    // Initialize OpenGL
    if (!initializeGL()) {
        return false;
    }
    
    // Create game systems
    world = std::make_unique<World>();
    camera = std::make_unique<Camera>(Vector3(0.0f, 10.0f, 0.0f));
    chunkMesher = std::make_unique<ChunkMesher>(*world);
    input = std::make_unique<Input>(window, *camera, *world);
    
    // Initialize shaders
    if (!initializeShaders()) {
        return false;
    }
    
    // Initialize world
    initializeWorld();
    
    return true;
}

bool Game::initializeGL() {
    // Initialize GLEW
    glewExperimental = GL_TRUE;
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return false;
    }
    
    // Configure global OpenGL state
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_CULL_FACE);
    glCullFace(GL_BACK);
    glFrontFace(GL_CCW);
    
    // Set viewport
    glViewport(0, 0, width, height);
    
    return true;
}

bool Game::initializeShaders() {
    // Create shader
    chunkShader = std::make_unique<Shader>();
    
    // Load default shaders
    if (!chunkShader->loadFromSource(DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER)) {
        std::cerr << "Failed to load shaders" << std::endl;
        return false;
    }
    
    return true;
}

void Game::initializeWorld() {
    // Generate chunks around the player
    world->generateChunksAround(camera->position, 3);
    
    // Create initial meshes
    updateChunkMeshes();
}

void Game::run() {
    // Reset timer
    lastFrame = static_cast<float>(glfwGetTime());
    
    // Main game loop
    while (!glfwWindowShouldClose(window)) {
        // Calculate delta time
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;
        
        // Process input
        input->processInput(deltaTime);
        
        // Update game state
        update();
        
        // Render frame
        render();
        
        // Swap buffers and poll events
        glfwSwapBuffers(window);
        glfwPollEvents();
    }
}

void Game::update() {
    // Generate chunks around the player
    world->generateChunksAround(camera->position, 3);
    
    // Update chunk meshes
    updateChunkMeshes();
}

void Game::updateChunkMeshes() {
    // Get dirty chunks (those that need mesh regeneration)
    auto dirtyChunks = world->getDirtyChunks();
    
    // Update meshes for dirty chunks
    for (const auto& chunk : dirtyChunks) {
        // Create a key for the chunk
        auto coords = std::make_tuple(chunk->chunkX, chunk->chunkY, chunk->chunkZ);
        
        // Generate mesh for the chunk
        auto mesh = chunkMesher->createMeshForChunk(*chunk);
        
        // Store the mesh
        chunkMeshes[coords] = mesh;
        
        // Mark the chunk as clean
        world->markChunkAsClean(chunk);
    }
}

void Game::render() {
    // Clear the screen
    glClearColor(0.2f, 0.3f, 0.8f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // Use shader
    chunkShader->use();
    
    // Set projection matrix
    float aspect = static_cast<float>(width) / static_cast<float>(height);
    auto projection = createProjectionMatrix(camera->zoom, aspect, 0.1f, 100.0f);
    chunkShader->setMat4("projection", projection.data());
    
    // Set view matrix
    auto view = camera->getViewMatrix();
    chunkShader->setMat4("view", view.data());
    
    // Set light and camera position
    chunkShader->setVec3("lightPos", 100.0f, 100.0f, 100.0f);
    chunkShader->setVec3("viewPos", camera->position);
    
    // Set model matrix (identity matrix for now)
    std::vector<float> model = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 1.0f
    };
    chunkShader->setMat4("model", model.data());
    
    // Render all chunk meshes
    for (const auto& [coords, mesh] : chunkMeshes) {
        if (mesh && mesh->isInitialized()) {
            mesh->render();
        }
    }
}

void Game::cleanup() {
    // Clean up resources
    if (window) {
        glfwDestroyWindow(window);
        window = nullptr;
    }
    
    // Terminate GLFW
    glfwTerminate();
}

std::vector<float> Game::createProjectionMatrix(float fov, float aspect, float nearPlane, float farPlane) const {
    // Convert FOV from degrees to radians
    float radFov = fov * 0.01745329251f; // pi/180
    
    // Calculate matrix values
    float tanHalfFov = std::tan(radFov / 2.0f);
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

} // namespace QuadCraft 