cmake_minimum_required(VERSION 3.16)
project(QuadCraft)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
file(GLOB_RECURSE SOURCES
    "src/*.cpp"
    "src/*.h"
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Find required packages
find_package(OpenGL REQUIRED)
find_package(GLEW REQUIRED)
find_package(glfw3 REQUIRED)

# Include directories and link libraries via imported targets
# (GLEW::GLEW / OpenGL::GL carry their own include dirs and work with both
#  module-mode FindGLEW and Homebrew's glew-config.cmake)
target_link_libraries(${PROJECT_NAME}
    OpenGL::GL
    GLEW::GLEW
    glfw
)


# Add compilation options
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
endif()

# Tests (core math + world logic; no OpenGL required)
enable_testing()
add_executable(quadray_test tests/quadray_test.cpp)
add_test(NAME quadray_test COMMAND quadray_test)
add_executable(world_chunk_test tests/world_chunk_test.cpp src/core/world/TetraChunk.cpp)
add_test(NAME world_chunk_test COMMAND world_chunk_test)

# Set output directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Print status message
message(STATUS "QuadCraft: Build configuration complete") 