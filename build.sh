#!/bin/bash

# Create build directory
mkdir -p build
cd build

# Build using CMake
cmake ..
make

# Run the game if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! Running QuadCraft..."
    ./bin/QuadCraft
else
    echo "Build failed."
    exit 1
fi 