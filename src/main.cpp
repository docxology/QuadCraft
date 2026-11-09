#include "game/Game.h"
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>

int main(int argc, char** argv) {
    try {
        unsigned int frames = 0;
        std::string capturePath;
        for (int i = 1; i < argc; ++i) {
            const std::string argument = argv[i];
            if (argument == "--frames" && i + 1 < argc) {
                const std::string value = argv[++i];
                if (value.empty() || value.find_first_not_of("0123456789") != std::string::npos) {
                    throw std::invalid_argument("--frames requires a positive integer");
                }
                const auto parsed = std::stoull(value);
                if (parsed == 0 || parsed > std::numeric_limits<unsigned int>::max()) {
                    throw std::invalid_argument("--frames out of range");
                }
                frames = static_cast<unsigned int>(parsed);
            } else if (argument == "--capture" && i + 1 < argc) {
                capturePath = argv[++i];
                if (capturePath.empty()) throw std::invalid_argument("--capture requires a path");
            } else {
                throw std::invalid_argument("Usage: QuadCraft [--frames N] [--capture output.ppm]");
            }
        }
        if (!capturePath.empty() && frames == 0) {
            throw std::invalid_argument("--capture requires --frames");
        }
        // Create game with 800x600 window
        QuadCraft::Game game(800, 600, "QuadCraft");
        
        // Initialize game
        if (!game.initialize()) {
            std::cerr << "Failed to initialize game" << std::endl;
            return -1;
        }
        
        // Run game loop
        game.run(frames, capturePath);
        
        return 0;
    }
    catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return -1;
    }
    catch (...) {
        std::cerr << "Unknown exception" << std::endl;
        return -1;
    }
} 