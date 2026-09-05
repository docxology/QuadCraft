#!/bin/bash
set -e

# Flags:
#   --no-run   build (and optionally test) but do not launch the game (used by CI)
#   --test     run CTest after building (quadray math tests)

NO_RUN=0
RUN_TESTS=0
for arg in "$@"; do
    case "$arg" in
        --no-run) NO_RUN=1 ;;
        --test)   RUN_TESTS=1 ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done

# Create build directory
mkdir -p build
cd build

# Configure and build using CMake
cmake ..
cmake --build .

echo "Build successful!"

# Run tests if requested
if [ "$RUN_TESTS" -eq 1 ]; then
    ctest --output-on-failure
fi

# Run the game unless --no-run was given (or running in CI)
if [ "$NO_RUN" -eq 0 ] && [ -z "$CI" ]; then
    echo "Running QuadCraft..."
    ./bin/QuadCraft
fi
