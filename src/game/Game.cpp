#include <GL/glew.h>
#include "Game.h"
#include <iostream>
#include <cmath>
#include <array>
#include <string>
#include <stdexcept>
#include <algorithm>  // For std::sort and other algorithms
#include "../core/coordinate/Quadray.h"
#include "../render/FramebufferCapture.h"

namespace QuadCraft {

// Improved vertex shader with wireframe support
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
out vec3 BarycentricCoords;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = mat3(transpose(inverse(model))) * aNormal; // Correctly transform normal
    Color = aColor;
    TexCoord = aTexCoord;
    
    // Pass barycentric coordinates for wireframe rendering
    // This gives each vertex a unique coordinate that we can use for edge detection
    if (gl_VertexID % 3 == 0) {
        BarycentricCoords = vec3(1.0, 0.0, 0.0);
    } else if (gl_VertexID % 3 == 1) {
        BarycentricCoords = vec3(0.0, 1.0, 0.0);
    } else {
        BarycentricCoords = vec3(0.0, 0.0, 1.0);
    }
    
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
)";

// Improved fragment shader with better lighting and wireframe edges
const std::string DEFAULT_FRAGMENT_SHADER = R"(
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec3 Color;
in vec2 TexCoord;
in vec3 BarycentricCoords;

uniform vec3 lightPos;
uniform vec3 viewPos;
uniform bool showWireframe;
uniform bool showOverlay;

void main() {
    // Edge detection using barycentric coordinates
    float minBary = min(min(BarycentricCoords.x, BarycentricCoords.y), BarycentricCoords.z);
    bool isEdge = minBary < 0.03; // 0.03 controls edge thickness
    
    // Ambient light
    vec3 ambient = 0.3 * Color; // Increased ambient for better visibility
    
    // Diffuse light
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * Color;
    
    // Specular light
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16); // Reduced shininess for a more matte look
    vec3 specular = 0.2 * spec * vec3(1.0, 1.0, 1.0); // Reduced specular intensity
    
    // Final color
    vec3 result = ambient + diffuse + specular;
    
    // Apply edge highlighting if wireframe is enabled
    if (showWireframe && isEdge) {
        result = vec3(0.0, 0.0, 0.0); // Black edges
    }
    
    // Apply overlay visualization if enabled
    if (showOverlay) {
        // Color coding based on quadrants/directions
        // This will be used for showing coordinate overlays
        if (isEdge) {
            result = vec3(1.0, 1.0, 1.0); // White edges for overlay
        }
    }
    
    FragColor = vec4(result, 1.0);
}
)";

Game::Game(int width, int height, const std::string& title)
    : width(width), height(height), title(title), window(nullptr),
      deltaTime(0.0f), lastFrame(0.0f), showWireframe(true), showOverlay(false) {
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
    
    glfwInitialized = true;
    // Set OpenGL version
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif
    
    // Create window
    window = glfwCreateWindow(width, height, title.c_str(), nullptr, nullptr);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        cleanup();
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
    input = std::make_unique<Input>(window, *camera, *world, *this);
    
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
    // GLEW can leave GL_INVALID_ENUM after extension discovery in a core context.
    const GLenum loaderError = glGetError();
    if (loaderError != GL_NO_ERROR && loaderError != GL_INVALID_ENUM) {
        std::cerr << "OpenGL error during GLEW initialization: " << loaderError << std::endl;
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
    Quadray cameraQuadray = camera->getPositionQuadray();
    world->generateChunksAround(cameraQuadray, 3);
    
    // Create initial meshes
    updateChunkMeshes();
}

void Game::run(unsigned int maxFrames, const std::string& capturePath) {
    if (!capturePath.empty() && maxFrames == 0) {
        throw std::invalid_argument("Framebuffer capture requires a bounded frame count");
    }
    // Reset timer
    lastFrame = static_cast<float>(glfwGetTime());
    
    // Time values for limiting frame rate
    float frameStart;
    const float maxDelta = 0.05f;  // Maximum delta time (20 FPS minimum)
    const float targetDelta = 0.016f;  // Target 60 FPS
    
    unsigned int frames = 0;
    // Main game loop
    while (!glfwWindowShouldClose(window) && (maxFrames == 0 || frames < maxFrames)) {
        // Record frame start time
        frameStart = static_cast<float>(glfwGetTime());
        
        // Calculate delta time
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;
        
        // Limit delta time to prevent huge jumps after freezes
        if (deltaTime > maxDelta) {
            deltaTime = maxDelta;
        }
        
        // Update game state
        update();
        
        // Render frame
        render();
        ++frames;
        if (!capturePath.empty() && maxFrames != 0 && frames == maxFrames) {
            captureFramebuffer(capturePath, width, height);
        }
        
        // Swap buffers and poll events
        glfwSwapBuffers(window);
        glfwPollEvents();
        
        // Report frame time
        reportFrameTime(deltaTime);
        
        // Calculate how long this frame took
        float frameTime = static_cast<float>(glfwGetTime()) - frameStart;
        
        // Sleep to maintain target frame rate if we're running too fast
        if (frameTime < targetDelta) {
            // This is just a basic approach since glfw doesn't have a sleep function
            // For more precise frame limiting, platform-specific sleep would be better
            double sleepTime = targetDelta - frameTime;
            
            // Do a simple busy-wait (not ideal but functional enough)
            double endWaitTime = glfwGetTime() + sleepTime * 0.8;  // Sleep for 80% of the needed time
            while (glfwGetTime() < endWaitTime) {
                // Just a quick busy-wait loop
            }
        }
        
        // Interactive pacing may stop after a slow frame. Bounded runs must
        // finish their requested work even when synchronous chunk loading is slow.
        if (maxFrames == 0 && static_cast<float>(glfwGetTime()) - frameStart > 1.0f) {
            break;
        }
    }
    if (maxFrames != 0 && frames != maxFrames) {
        throw std::runtime_error("Window closed before completing requested frames");
    }
}

void Game::update() {
    // Process input
    input->processInput(deltaTime, *camera, *world);
    
    // Meshes are world-space: camera motion changes visibility, not geometry.
    // Loading marks new chunks dirty; block edits retain their own invalidation.
    const Quadray cameraQuadray = camera->getPositionQuadray();
    world->updateChunks(cameraQuadray);
    for (auto it = chunkMeshes.begin(); it != chunkMeshes.end();) {
        if (world->getChunks().find(it->first) == world->getChunks().end()) {
            it = chunkMeshes.erase(it);
        } else {
            ++it;
        }
    }
    updateChunkMeshes(15);
}

void Game::updateChunkMeshes(int maxChunksToProcess) {
    int processedChunks = 0;
    
    // Iterate through all chunks that need mesh updates
    for (auto& chunkPair : world->getDirtyChunks()) {
        TetraChunk* chunk = chunkPair;
        
        // Skip if we've processed enough chunks this frame
        if (processedChunks >= maxChunksToProcess) {
            break;
        }
        
        // Generate the mesh for this chunk
        try {
            auto mesh = chunkMesher->createMeshForChunk(*chunk);
            
            // Store the mesh
            auto chunkCoord = std::make_tuple(chunk->chunkX, chunk->chunkY, chunk->chunkZ);
            chunkMeshes[chunkCoord] = mesh;
            
            // Mark the chunk as updated
            chunk->isDirty = false;
            processedChunks++;
        } catch (const std::exception& e) {
            std::cerr << "Error generating mesh for chunk " << chunk->chunkX << "," 
                      << chunk->chunkY << "," << chunk->chunkZ << ": " << e.what() << std::endl;
            
            // Create a simplified mesh to indicate an error
            auto chunkCoord = std::make_tuple(chunk->chunkX, chunk->chunkY, chunk->chunkZ);
            auto simpleMesh = std::make_shared<Mesh>();
            chunkMesher->createSimplifiedMesh(simpleMesh);
            chunkMeshes[chunkCoord] = simpleMesh;
            
            // Don't try to update this chunk again immediately
            chunk->isDirty = false;
            processedChunks++;
        }
    }
}

void Game::render() {
    // GLFW window size is not framebuffer size on HiDPI displays.
    glfwGetFramebufferSize(window, &width, &height);
    if (width <= 0 || height <= 0) return;
    glViewport(0, 0, width, height);
    // Clear the color and depth buffer
    glClearColor(0.2f, 0.6f, 0.9f, 1.0f);  // Sky blue color
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // Use the shader program
    chunkShader->use();
    
    // Set the projection and view matrices
    auto projMatrix = camera->getProjectionMatrix(static_cast<float>(width) / static_cast<float>(height), 0.1f, 500.0f);
    chunkShader->setMat4("projection", projMatrix.data());
    
    auto viewMatrix = camera->getViewMatrix();
    chunkShader->setMat4("view", viewMatrix.data());
    
    // Set light properties - make light follow camera for better visibility
    Vector3 lightPos = camera->position + Vector3(10.0f, 20.0f, 10.0f);
    chunkShader->setVec3("lightPos", lightPos);
    chunkShader->setVec3("viewPos", camera->position);
    chunkShader->setBool("showWireframe", showWireframe);
    chunkShader->setBool("showOverlay", showOverlay);
    // Start timing the rendering process
    float startTime = static_cast<float>(glfwGetTime());
    float maxRenderTime = 0.35f;  // Allow more time for rendering to ensure consistency
    
    // Keep track of rendered chunks
    int renderedChunks = 0;
    int maxRenderedChunks = 500;  // Increased to allow for more complete scene
    
    // Cache the camera position for distance calculations
    Vector3 cameraPos = camera->position;
    
    // Sort chunk keys by distance to camera for better LOD management
    std::vector<std::pair<std::tuple<int, int, int>, float>> chunkDistances;
    chunkDistances.reserve(world->getChunks().size());
    
    for (const auto& [coords, chunk] : world->getChunks()) {
        // Get the chunk's center position
        Vector3 chunkCenter = chunk->getCenter();
        
        // Calculate squared distance to avoid costly square root operations
        float distSq = (chunkCenter - cameraPos).lengthSquared();
        
        // Store the chunk key and its distance
        chunkDistances.push_back({coords, distSq});
    }
    
    // Sort chunks by distance to camera (closest first)
    std::sort(chunkDistances.begin(), chunkDistances.end(),
              [](const auto& a, const auto& b) {
                  return a.second < b.second;
              });
    
    // World loading/unloading belongs to update(), never to rendering.
    
    // Reset all chunk visibility flags
    for (auto& [key, chunk] : world->getChunks()) {
        chunk->isVisible = false;
    }
    
    // Render chunks in order of distance
    for (const auto& [coords, distSq] : chunkDistances) {
        // Check if we should stop rendering (time or count limit)
        float currentTime = static_cast<float>(glfwGetTime());
        if (currentTime - startTime > maxRenderTime || renderedChunks >= maxRenderedChunks) {
            break;
        }
        
        // Get the chunk
        auto it = world->getChunks().find(coords);
        if (it == world->getChunks().end()) {
            continue;
        }
        const auto& chunk = it->second;
        
        // Get the chunk's center position
        Vector3 chunkCenter = chunk->getCenter();
        
        // Skip chunks outside the view frustum (frustum culling)
        if (!isChunkInFrustum(chunkCenter, TetraChunk::CHUNK_SIZE)) {
            continue;
        }
        
        // Get or create the mesh for the chunk
        auto mesh = chunkMeshes[coords];
        if (!mesh || !mesh->isInitialized()) {
            continue;
        }
        
        // Mark the chunk as visible
        chunk->isVisible = true;
        
        // Calculate model matrix for the chunk (identity matrix, as the vertices are already in world space)
        constexpr std::array<float, 16> model = {
            1.0f, 0.0f, 0.0f, 0.0f,
            0.0f, 1.0f, 0.0f, 0.0f,
            0.0f, 0.0f, 1.0f, 0.0f,
            0.0f, 0.0f, 0.0f, 1.0f
        };
        chunkShader->setMat4("model", model.data());
        
        // Render the chunk's mesh
        mesh->render();
        
        // Count the rendered chunk
        renderedChunks++;
    }
    
    // Track the rendered chunk count for the 1-second title report (reportFrameTime)
    lastRenderedChunks = renderedChunks;

    // Draw the quadray coordinate axis overlay when enabled (F2)
    if (showOverlay) {
        drawCoordinateOverlay();
    }
}

void Game::drawCoordinateOverlay() {
    // Skip if no shader is available
    if (!chunkShader || !chunkShader->isInitialized()) {
        return;
    }
    
    // Create simple line vertices representing the quadray coordinate system
    std::vector<Vertex> vertices;
    std::vector<unsigned int> indices;
    
    const float axisLength = 5.0f; // Length of the coordinate axes
    const Vector3 origin = camera->position + camera->front * 2.0f; // Place in front of camera
    
    // Define colors for each axis
    Vector3 colorA(1.0f, 0.0f, 0.0f); // Red for A axis
    Vector3 colorB(0.0f, 1.0f, 0.0f); // Green for B axis
    Vector3 colorC(0.0f, 0.0f, 1.0f); // Blue for C axis
    Vector3 colorD(1.0f, 1.0f, 0.0f); // Yellow for D axis
    
    // Get the quadray basis vectors
    std::array<Vector3, 4> basisVectors;
    
    // These represent the four directions from center to vertices of a tetrahedron
    // A axis - direction of (1,0,0,0) in quadray coordinates
    basisVectors[0] = Quadray(1.0f, 0.0f, 0.0f, 0.0f).toCartesian().normalized() * axisLength;
    
    // B axis - direction of (0,1,0,0) in quadray coordinates
    basisVectors[1] = Quadray(0.0f, 1.0f, 0.0f, 0.0f).toCartesian().normalized() * axisLength;
    
    // C axis - direction of (0,0,1,0) in quadray coordinates
    basisVectors[2] = Quadray(0.0f, 0.0f, 1.0f, 0.0f).toCartesian().normalized() * axisLength;
    
    // D axis - direction of (0,0,0,1) in quadray coordinates
    basisVectors[3] = Quadray(0.0f, 0.0f, 0.0f, 1.0f).toCartesian().normalized() * axisLength;
    
    // Create vertices for the four axes
    // Origin vertex
    vertices.push_back(Vertex(origin, Vector3(0, 1, 0), Vector3(1, 1, 1), 0, 0));
    
    // Endpoint vertices for each axis
    vertices.push_back(Vertex(origin + basisVectors[0], Vector3(0, 1, 0), colorA, 0, 0));
    vertices.push_back(Vertex(origin + basisVectors[1], Vector3(0, 1, 0), colorB, 0, 0));
    vertices.push_back(Vertex(origin + basisVectors[2], Vector3(0, 1, 0), colorC, 0, 0));
    vertices.push_back(Vertex(origin + basisVectors[3], Vector3(0, 1, 0), colorD, 0, 0));
    
    // Create indices for the four lines
    indices.push_back(0); indices.push_back(1); // A axis
    indices.push_back(0); indices.push_back(2); // B axis
    indices.push_back(0); indices.push_back(3); // C axis
    indices.push_back(0); indices.push_back(4); // D axis
    
    // Create a temporary mesh for the coordinate axes
    Mesh axesMesh;
    axesMesh.create(vertices, indices);
    
    // Use the standard shader
    chunkShader->use();
    
    // Disable wireframe for cleaner lines
    chunkShader->setBool("showWireframe", false);
    chunkShader->setBool("showOverlay", true);
    
    // Set up matrices
    auto view = camera->getViewMatrix();
    chunkShader->setMat4("view", view.data());
    
    auto projection = camera->getProjectionMatrix(
        static_cast<float>(width) / static_cast<float>(height), 0.1f, 500.0f);
    chunkShader->setMat4("projection", projection.data());
    
    // Identity model matrix
    constexpr std::array<float, 16> model = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 1.0f
    };
    chunkShader->setMat4("model", model.data());
    
    // Draw the axis lines with thicker lines for visibility
    glLineWidth(3.0f);
    
    // Use explicit line mode
    axesMesh.render(GL_LINES);
    
    // Reset wireframe state
    chunkShader->setBool("showWireframe", showWireframe);
    
    // Reset line width
    glLineWidth(1.0f);
}

void Game::cleanup() {
    // GL owners must die before the context, including partial initialization.
    if (window) glfwMakeContextCurrent(window);
    input.reset();
    chunkMeshes.clear();
    if (chunkShader) glUseProgram(0);
    chunkShader.reset();
    chunkMesher.reset();
    camera.reset();
    world.reset();
    if (window) {
        glfwDestroyWindow(window);
        window = nullptr;
    }
    if (glfwInitialized) {
        glfwTerminate();
        glfwInitialized = false;
    }
}

bool Game::isChunkInFrustum(const Vector3& chunkCenter, float radius) {
    // For tetrahedral geometry, we need to use an increased radius for better coverage
    // Tetrahedral chunks can extend beyond their bounding sphere in certain directions
    const float tetrahedralFactor = 1.5f; // Increased from typical value of 1.2-1.3
    float adjustedRadius = radius * tetrahedralFactor;
    
    // Test if the chunk's bounding sphere intersects with the camera frustum
    return camera->getFrustum().sphereInFrustum(chunkCenter, adjustedRadius);
}

void Game::reportFrameTime(float deltaTime) {
    static float frameTimeAccumulator = 0.0f;
    static int frameCount = 0;
    static float lastReportTime = 0.0f;
    
    frameTimeAccumulator += deltaTime;
    frameCount++;
    
    float currentTime = static_cast<float>(glfwGetTime());
    
    // Report FPS every second
    if (currentTime - lastReportTime >= 1.0f) {
        float averageFrameTime = frameTimeAccumulator / frameCount;
        float fps = 1.0f / averageFrameTime;
        
        std::string title = std::string(this->title) + " | FPS: " + std::to_string(static_cast<int>(fps)) + 
                            " | Chunks: " + std::to_string(lastRenderedChunks);
        glfwSetWindowTitle(window, title.c_str());
        
        // Reset accumulators
        frameTimeAccumulator = 0.0f;
        frameCount = 0;
        lastReportTime = currentTime;
    }
}

} // namespace QuadCraft 