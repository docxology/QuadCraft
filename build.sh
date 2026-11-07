#!/bin/bash
set -e

# Flags:
#   --no-run   build (and optionally test) but do not launch the game (used by CI)
#   --test     enable native tests and run a nonempty CTest inventory after building

NO_RUN=0
RUN_TESTS=0
for arg in "$@"; do
    case "$arg" in
        --no-run) NO_RUN=1 ;;
        --test)   RUN_TESTS=1 ;;
        *) echo "Unknown option: $arg" >&2; exit 2 ;;
    esac
done

# Anchor all paths to the repository, including when called from another cwd.
REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$REPO_DIR/build"
CONFIGURE_ARGS=()
if [ "$RUN_TESTS" -eq 1 ]; then
    CONFIGURE_ARGS+=("-DBUILD_TESTING=ON")
fi

# Preserve cached options such as QUADCRAFT_BUILD_GAME=OFF.
cmake -S "$REPO_DIR" -B "$BUILD_DIR" "${CONFIGURE_ARGS[@]}"
cmake --build "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Build successful!"

# Run tests if requested
if [ "$RUN_TESTS" -eq 1 ]; then
    # Portable discovery enforcement for the documented CMake 3.16 minimum.
    TEST_INVENTORY="$(ctest -N)"
    if [[ ! "$TEST_INVENTORY" =~ Total[[:space:]]Tests:[[:space:]]+([0-9]+) ]] || [ "${BASH_REMATCH[1]:-0}" -eq 0 ]; then
        echo "$TEST_INVENTORY"
        echo "CTest did not discover any native tests." >&2
        exit 1
    fi
    ctest --output-on-failure
fi

# Run the game unless --no-run was given (or running in CI)
if [ "$NO_RUN" -eq 0 ] && [ -z "$CI" ]; then
    BUILD_CONFIGURATION="$(cmake -LA -N .)"
    if [[ "$BUILD_CONFIGURATION" == *"QUADCRAFT_BUILD_GAME:BOOL=ON"* ]]; then
        echo "Running QuadCraft..."
        ./bin/QuadCraft
    else
        echo "Game executable disabled (QUADCRAFT_BUILD_GAME=OFF)."
    fi
fi
