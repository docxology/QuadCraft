// This probe deliberately uses the existing Camera/ChunkMesher/Mesh interfaces:
// the same consumer can exercise the previous production camera and mesher.
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include "../src/core/entity/Camera.h"
#include "../src/render/mesh/ChunkMesher.h"
#include "../src/render/shader/Shader.h"
#include "../src/render/FramebufferCapture.h"
#include <array>
#include <cmath>
#include <filesystem>
#include <iostream>
#include <stdexcept>

using namespace QuadCraft;
namespace {
void require(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}

unsigned int coveredPixels() {
    std::array<unsigned char, 128 * 128 * 3> pixels;
    glReadPixels(0, 0, 128, 128, GL_RGB, GL_UNSIGNED_BYTE, pixels.data());
    unsigned int count = 0;
    for (std::size_t i = 0; i < pixels.size(); i += 3) {
        if (pixels[i] > 100) ++count;
    }
    return count;
}

void exercise(const std::string& directory) {
    World world;
    auto chunk = world.getChunk(1, -1, 2);
    chunk->setBlock(Quadray::fromCartesian(Vector3(8.0f, 8.0f, 8.0f)), Block::STONE_BLOCK);
    ChunkMesher mesher(world);
    auto mesh = mesher.createMeshForChunk(*chunk);
    require(mesh->isInitialized(), "Actual chunk upload failed");
    require(mesh->getVertexCount() == 12 && mesh->getIndexCount() == 12,
            "Isolated tetrahedron must emit all four faces");

    // Read the real uploaded production VBO, not a duplicate meshing algorithm.
    std::array<Vertex, 12> vertices;
    GLint uploadedBytes = 0;
    glGetBufferParameteriv(GL_ARRAY_BUFFER, GL_BUFFER_SIZE, &uploadedBytes);
    require(uploadedBytes == static_cast<GLint>(sizeof(vertices)), "Unexpected VBO size");
    glGetBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(vertices), vertices.data());
    require(glGetError() == GL_NO_ERROR, "Cannot read emitted vertices");
    Vector3 center;
    for (const auto& vertex : vertices) center += vertex.position / 12.0f;
    require((center - Vector3(24.0f, -8.0f, 40.0f)).length() < 2.0f,
            "Chunk-origin translation missing");
    std::array<Vector3, 4> faceCenters;
    std::array<Vector3, 4> faceNormals;
    // Check every emitted face before camera checks, so the unchanged probe
    // distinguishes a baseline winding failure from its separate zoom failure.
    for (int face = 0; face < 4; ++face) {
        const auto& a = vertices[3 * face];
        const auto& b = vertices[3 * face + 1];
        const auto& c = vertices[3 * face + 2];
        faceCenters[face] = (a.position + b.position + c.position) / 3.0f;
        const Vector3 outward = (faceCenters[face] - center).normalized();
        faceNormals[face] = (b.position - a.position).cross(c.position - a.position).normalized();
        std::cout << "face=" << face << " winding_outward=" << faceNormals[face].dot(outward)
                  << " normal_alignment=" << faceNormals[face].dot(a.normal) << '\n';
        require(faceNormals[face].dot(outward) > 0.0f, "Emitted triangle winds inward");
        require(faceNormals[face].dot(a.normal) > 0.999f, "Lighting normal disagrees with winding");
    }

    Shader shader;
    require(shader.loadFromSource(R"(#version 330 core
layout(location=0) in vec3 position;
uniform mat4 view;
uniform mat4 projection;
void main() { gl_Position = projection * view * vec4(position, 1.0); }
)", R"(#version 330 core
out vec4 color;
void main() { color = vec4(0.9, 0.5, 0.2, 1.0); }
)"), "Render probe shader failed");
    shader.use();
    glViewport(0, 0, 128, 128);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_CULL_FACE);
    glCullFace(GL_BACK);
    glFrontFace(GL_CCW);
    for (int face = 0; face < 4; ++face) {
        // Independently checked emitted geometry supplies an exterior face-on
        // view and a known front-face depth; culling remains enabled.
        const Vector3 faceCenter = faceCenters[face];
        const Vector3 normal = faceNormals[face];
        const Vector3 direction = -normal;
        const Vector3 worldUp = std::abs(direction.y) > 0.9f ? Vector3(0, 0, 1) : Vector3(0, 1, 0);
        Camera camera(faceCenter + normal * 4.0f, worldUp,
                      std::atan2(direction.z, direction.x) * 180.0f / 3.14159265f,
                      std::asin(direction.y) * 180.0f / 3.14159265f);
        const auto view = camera.getViewMatrix();
        const auto projection = camera.getProjectionMatrix(1.0f, 0.1f, 100.0f);
        shader.setMat4("view", view.data());
        shader.setMat4("projection", projection.data());
        glClearColor(0, 0, 0, 1);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        mesh->render();
        float depth = 1.0f;
        glReadPixels(64, 64, 1, 1, GL_DEPTH_COMPONENT, GL_FLOAT, &depth);
        const float expectedDepth = ((-4.0f * projection[10] + projection[14]) / 4.0f + 1.0f) / 2.0f;
        require(std::abs(depth - expectedDepth) < 0.0001f,
                "Exterior face did not render at its geometric depth with CCW culling");
        unsigned char pixel[3] = {};
        glReadPixels(64, 64, 1, 1, GL_RGB, GL_UNSIGNED_BYTE, pixel);
        require(pixel[0] > 100 && pixel[1] > 50, "Face framebuffer is empty");
        captureFramebuffer(directory + "/face-" + std::to_string(face) + ".ppm", 128, 128);
        const auto originalCoverage = coveredPixels();
        camera.processMouseScroll(10.0f);
        const auto zoomed = camera.getProjectionMatrix(1.0f, 0.1f, 100.0f);
        require(zoomed[5] > projection[5], "Scroll did not change actual camera projection");
        shader.setMat4("projection", zoomed.data());
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        mesh->render();
        require(coveredPixels() > originalCoverage, "Zoom did not enlarge the rendered face");
    }
    require(glGetError() == GL_NO_ERROR, "OpenGL error in real mesh rendering");
} // GL owners die here while the context is current.
}

int main(int argc, char** argv) {
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif
    GLFWwindow* window = glfwCreateWindow(128, 128, "Native mesher probe", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glewExperimental = GL_TRUE;
    int status = 0;
    if (glewInit() != GLEW_OK) status = 1;
    else {
        // GLEW may query an obsolete extension enum in a core context.
        while (glGetError() != GL_NO_ERROR) {}
        try {
            const std::string directory = argc > 1 ? argv[1] : "native-artifacts";
            std::filesystem::create_directories(directory);
            exercise(directory);
        } catch (const std::exception& error) {
            std::cerr << error.what() << '\n';
            status = 1;
        }
    }
    glfwDestroyWindow(window);
    glfwTerminate();
    return status;
}
