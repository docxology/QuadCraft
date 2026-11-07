cmake_minimum_required(VERSION 3.16)
project(QuadCraft VERSION 0.4.0 LANGUAGES CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(QUADCRAFT_BUILD_GAME "Build the OpenGL game executable" ON)

if(QUADCRAFT_BUILD_GAME)
    file(GLOB_RECURSE SOURCES
        "src/*.cpp"
        "src/*.h"
    )
    add_executable(${PROJECT_NAME} ${SOURCES})

    find_package(OpenGL REQUIRED)
    find_package(GLEW REQUIRED)
    find_package(glfw3 REQUIRED)
    # Imported targets carry the include paths for module/config package modes.
    target_link_libraries(${PROJECT_NAME}
        OpenGL::GL
        GLEW::GLEW
        glfw
    )

    if(MSVC)
        target_compile_options(${PROJECT_NAME} PRIVATE /W4)
    else()
        target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
    endif()
    set_target_properties(${PROJECT_NAME} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
    )
endif()

# Core math and world tests also build without any graphics dependencies.
include(CTest)
if(BUILD_TESTING)
    add_executable(quadray_test tests/quadray_test.cpp)
    add_test(NAME quadray_test COMMAND quadray_test)
    add_executable(world_chunk_test tests/world_chunk_test.cpp src/core/world/TetraChunk.cpp)
    add_test(NAME world_chunk_test COMMAND world_chunk_test)
    # These executables use assert(), including in Release/RelWithDebInfo.
    foreach(test_target quadray_test world_chunk_test)
        if(MSVC)
            target_compile_options(${test_target} PRIVATE /UNDEBUG)
        else()
            target_compile_options(${test_target} PRIVATE -UNDEBUG)
        endif()
    endforeach()
endif()

# Print status message
message(STATUS "QuadCraft: Build configuration complete") 