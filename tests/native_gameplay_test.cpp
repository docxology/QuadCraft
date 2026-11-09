#include <GL/glew.h>
#include "../src/game/Game.h"
#include <algorithm>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <thread>

namespace QuadCraft {
namespace {
// Observe the real GLEW dispatch calls, then forward to the driver unchanged.
// No production telemetry or replacement GL implementation is involved.
struct DeletionObserver {
    static inline DeletionObserver* active = nullptr;
    GLFWwindow* context;
    PFNGLDELETEBUFFERSPROC deleteBuffers = __glewDeleteBuffers;
    PFNGLDELETEVERTEXARRAYSPROC deleteVertexArrays = __glewDeleteVertexArrays;
    PFNGLDELETEPROGRAMPROC deleteProgram = __glewDeleteProgram;
    unsigned int buffers = 0, arrays = 0, programs = 0;
    bool valid = true;

    explicit DeletionObserver(GLFWwindow* context) : context(context) {
        active = this;
        __glewDeleteBuffers = observeBuffers;
        __glewDeleteVertexArrays = observeArrays;
        __glewDeleteProgram = observeProgram;
    }
    ~DeletionObserver() {
        __glewDeleteBuffers = deleteBuffers;
        __glewDeleteVertexArrays = deleteVertexArrays;
        __glewDeleteProgram = deleteProgram;
        active = nullptr;
    }
    static void GLAPIENTRY observeBuffers(GLsizei count, const GLuint* names) {
        auto& observer = *active;
        observer.valid &= glfwGetCurrentContext() == observer.context;
        for (GLsizei i = 0; i < count; ++i) {
            observer.valid &= glIsBuffer(names[i]) == GL_TRUE;
        }
        observer.deleteBuffers(count, names);
        observer.buffers += count;
        observer.valid &= glGetError() == GL_NO_ERROR;
    }
    static void GLAPIENTRY observeArrays(GLsizei count, const GLuint* names) {
        auto& observer = *active;
        observer.valid &= glfwGetCurrentContext() == observer.context;
        for (GLsizei i = 0; i < count; ++i) {
            observer.valid &= glIsVertexArray(names[i]) == GL_TRUE;
        }
        observer.deleteVertexArrays(count, names);
        observer.arrays += count;
        observer.valid &= glGetError() == GL_NO_ERROR;
    }
    static void GLAPIENTRY observeProgram(GLuint name) {
        auto& observer = *active;
        observer.valid &= glfwGetCurrentContext() == observer.context;
        observer.valid &= glIsProgram(name) == GL_TRUE;
        observer.deleteProgram(name);
        ++observer.programs;
        observer.valid &= glGetError() == GL_NO_ERROR;
    }
};

std::shared_ptr<Mesh> uploadedTriangle(std::shared_ptr<Mesh> mesh = std::make_shared<Mesh>()) {
    const std::vector<Vertex> triangle = {
        Vertex(Vector3(0, 0, 0), Vector3(0, 0, 1), Vector3(1, 0, 0), 0, 0),
        Vertex(Vector3(1, 0, 0), Vector3(0, 0, 1), Vector3(1, 0, 0), 0, 0),
        Vertex(Vector3(0, 1, 0), Vector3(0, 0, 1), Vector3(1, 0, 0), 0, 0)};
    mesh->create(triangle, {0, 1, 2});
    return mesh;
}
}
struct NativeGameplayProbe {
    static void require(bool condition, const char* message) {
        if (!condition) throw std::runtime_error(message);
    }
    static void exercisePartialOwnership() {
        // Populate only the context/shader/mesh owners, without world, camera,
        // input or mesher. This is a real partial initialization state.
        Game partial(128, 128, "Partial initialization");
        require(glfwInit(), "Partial fixture GLFW initialization failed");
        partial.glfwInitialized = true;
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
        glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
#ifdef __APPLE__
        glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif
        partial.window = glfwCreateWindow(128, 128, "Partial initialization", nullptr, nullptr);
        require(partial.window, "Partial fixture context creation failed");
        glfwMakeContextCurrent(partial.window);
        require(partial.initializeGL(), "Partial fixture OpenGL initialization failed");
        require(partial.initializeShaders(), "Partial fixture shader initialization failed");
        auto mesh = uploadedTriangle();
        require(mesh->isInitialized(), "Partial fixture failed real GPU upload");
        partial.chunkMeshes.emplace(std::make_tuple(0, 0, 0), std::move(mesh));
        DeletionObserver observer(partial.window);
        // cleanup must restore its own live context, not depend on the caller.
        glfwMakeContextCurrent(nullptr);
        partial.cleanup();
        require(observer.valid && observer.buffers == 2 && observer.arrays == 1 &&
                observer.programs == 1, "Partial cleanup did not delete live GL resources");
        partial.cleanup();
        require(observer.buffers == 2 && observer.arrays == 1 && observer.programs == 1,
                "Repeated partial cleanup deleted resources again");
    }
    static void exercise(const std::string& slowCapture) {
        exercisePartialOwnership();
        Game game(320, 240, "Native gameplay probe");
        require(game.initialize(), "Real game initialization failed");
        // Stay away from chunk boundaries during the camera-only transition.
        game.camera->position = Vector3(8.0f, 10.0f, 8.0f);
        game.camera->updatePositionQuadray();
        game.camera->updateCameraVectors();
        // Finish loading once, before checking incremental mesh progress.
        game.deltaTime = 0.0f;
        game.update();
        auto dirty = game.world->getDirtyChunks().size();
        require(dirty > 15, "Scene must exceed a single mesh budget");
        const auto loaded = game.world->getChunks().size();
        for (int frame = 0; frame < 40 && dirty != 0; ++frame) {
            game.camera->processKeyboard(RIGHT, 0.002f);
            game.update();
            const auto remaining = game.world->getDirtyChunks().size();
            require(game.world->getChunks().size() == loaded, "Probe crossed loading boundary");
            require(remaining == (dirty > 15 ? dirty - 15 : 0),
                    "Camera movement re-invalidated or starved world-space chunk meshes");
            dirty = remaining;
        }
        require(dirty == 0, "Incremental mesh queue did not drain while moving");
        const auto key = std::make_tuple(0, 0, 0);
        auto previousMesh = game.chunkMeshes.at(key);
        game.world->setBlock(Quadray::fromCartesian(Vector3(8, 8, 8)), Block::ORE_BLOCK);
        require(!game.world->getDirtyChunks().empty(), "Block edit lost dirty invalidation");
        game.update();
        require(game.chunkMeshes.at(key) != previousMesh, "Edited chunk was not remeshed");
        previousMesh.reset();

        // Render the actual application scene and overlay through one projection.
        game.showOverlay = true;
        game.camera->processMouseScroll(5.0f);
        game.render();
        require(game.lastRenderedChunks > 0, "Actual scene rendered no chunk meshes");
        std::vector<float> depth(320 * 240);
        glReadPixels(0, 0, 320, 240, GL_DEPTH_COMPONENT, GL_FLOAT, depth.data());
        require(std::count_if(depth.begin(), depth.end(), [](float d) { return d < 1.0f; }) > 100,
                "Actual game scene did not render geometry");
        require(glGetError() == GL_NO_ERROR, "OpenGL error rendering actual game");

        // Make real first-frame resource reclamation exceed the old one-second
        // exit threshold. The GL owner is actually deleted; no clock or GL stub
        // substitutes for the production run loop.
        std::filesystem::remove(slowCapture);
        auto delayed = std::make_shared<bool>(false);
        std::shared_ptr<Mesh> slow(new Mesh, [delayed](Mesh* mesh) {
            std::this_thread::sleep_for(std::chrono::milliseconds(1100));
            *delayed = true;
            delete mesh;
        });
        slow = uploadedTriangle(std::move(slow));
        require(slow->isInitialized(), "Slow-frame fixture failed real GPU upload");
        game.chunkMeshes[std::make_tuple(1000, 1000, 1000)] = std::move(slow);
        game.run(2, slowCapture);
        require(*delayed, "Slow-frame fixture was not reclaimed during update");
        std::ifstream capture(slowCapture, std::ios::binary);
        std::string magic;
        int capturedWidth = 0, capturedHeight = 0, maximum = 0;
        capture >> magic >> capturedWidth >> capturedHeight >> maximum;
        require(capture && magic == "P6" && capturedWidth > 0 && capturedHeight > 0 &&
                maximum == 255, "Slow bounded run did not emit the requested framebuffer");

        // Closing a bounded run before its target is a failure, not a successful
        // invocation with a silently missing capture.
        glfwSetWindowShouldClose(game.window, GLFW_TRUE);
        bool interrupted = false;
        try {
            game.run(2);
        } catch (const std::runtime_error&) {
            interrupted = true;
        }
        require(interrupted, "Bounded run accepted an incomplete frame count");

        auto owned = uploadedTriangle();
        require(owned->isInitialized(), "Lifetime fixture failed real GPU upload");
        DeletionObserver observer(game.window);
        game.chunkMeshes[std::make_tuple(1000, 1000, 1000)] = std::move(owned);
        // Do not retain shared GL owners beyond cleanup.
        game.cleanup();
        require(observer.valid && observer.buffers >= 2 && observer.arrays >= 1 &&
                observer.programs == 1, "Full cleanup did not delete GL resources in context");
        require(!game.window && !game.chunkShader && game.chunkMeshes.empty(),
                "Cleanup retained graphical owners");
        game.cleanup();
        require(observer.programs == 1, "Repeated full cleanup deleted its shader again");
    }
};
}

int main(int argc, char** argv) {
    try {
        if (argc != 2) throw std::invalid_argument("Expected a slow-frame capture path");
        QuadCraft::NativeGameplayProbe::exercise(argv[1]);
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
