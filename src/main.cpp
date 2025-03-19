#include "game/Game.h"
#include <iostream>

int main() {
    try {
        // Create game with 800x600 window
        QuadCraft::Game game(800, 600, "QuadCraft");
        
        // Initialize game
        if (!game.initialize()) {
            std::cerr << "Failed to initialize game" << std::endl;
            return -1;
        }
        
        // Run game loop
        game.run();
        
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