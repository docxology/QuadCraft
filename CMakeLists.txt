cmake_minimum_required(VERSION 3.16)
project(QuadCraft VERSION 0.6.0 LANGUAGES CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(QUADCRAFT_BUILD_GAME "Build the OpenGL game executable" ON)

if(QUADCRAFT_BUILD_GAME)
    add_library(QuadCraftNative STATIC
        src/game/Game.cpp
        src/core/world/TetraChunk.cpp
        src/render/mesh/ChunkMesher.cpp
        src/render/mesh/Mesh.cpp
        src/render/shader/Shader.cpp
    )
    add_executable(${PROJECT_NAME} src/main.cpp)
    target_link_libraries(${PROJECT_NAME} PRIVATE QuadCraftNative)

    find_package(OpenGL REQUIRED)
    find_package(GLEW REQUIRED)
    find_package(glfw3 REQUIRED)
    # Imported targets carry the include paths for module/config package modes.
    target_link_libraries(QuadCraftNative PUBLIC
        OpenGL::GL
        GLEW::GLEW
        glfw
    )

    if(MSVC)
        target_compile_options(QuadCraftNative PRIVATE /W4)
    else()
        target_compile_options(QuadCraftNative PRIVATE -Wall -Wextra -pedantic)
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
    add_executable(camera_test tests/camera_test.cpp)
    add_test(NAME camera_test COMMAND camera_test)
    if(QUADCRAFT_BUILD_GAME)
        add_executable(native_render_test tests/native_render_test.cpp)
        target_link_libraries(native_render_test PRIVATE QuadCraftNative)
        add_executable(native_gameplay_test tests/native_gameplay_test.cpp)
        target_link_libraries(native_gameplay_test PRIVATE QuadCraftNative)
        add_executable(native_capture_check tests/native_capture_check.cpp)
        file(MAKE_DIRECTORY "${CMAKE_BINARY_DIR}/native-artifacts")
        add_test(NAME native_render_test COMMAND native_render_test
            "${CMAKE_BINARY_DIR}/native-artifacts")
        add_test(NAME native_gameplay_test COMMAND native_gameplay_test
            "${CMAKE_BINARY_DIR}/native-artifacts/slow-frame.ppm")
        add_test(NAME native_application_smoke COMMAND "${CMAKE_COMMAND}"
            "-DAPPLICATION=$<TARGET_FILE:QuadCraft>"
            "-DCAPTURE_CHECK=$<TARGET_FILE:native_capture_check>"
            "-DCAPTURE=${CMAKE_BINARY_DIR}/native-artifacts/application.ppm"
            -P "${CMAKE_CURRENT_SOURCE_DIR}/tests/native_application_smoke.cmake")
        set_tests_properties(native_render_test native_gameplay_test native_application_smoke
            PROPERTIES LABELS "real-gl" TIMEOUT 180)
    endif()
    # These executables use assert(), including in Release/RelWithDebInfo.
    foreach(test_target quadray_test world_chunk_test camera_test)
        if(MSVC)
            target_compile_options(${test_target} PRIVATE /UNDEBUG)
        else()
            target_compile_options(${test_target} PRIVATE -UNDEBUG)
        endif()
    endforeach()
endif()

# Print status message
message(STATUS "QuadCraft: Build configuration complete") 