#include <array>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>

// Independent binary PPM consumer: a successful process alone is not capture
// evidence. Require a complete image and visible variation, not just a header
// or a uniformly cleared framebuffer.
int main(int argc, char** argv) {
    try {
        if (argc != 2) throw std::runtime_error("Expected one framebuffer path");
        std::ifstream image(argv[1], std::ios::binary);
        std::string magic;
        int width = 0, height = 0, maximum = 0;
        image >> magic >> width >> height >> maximum;
        if (!image || magic != "P6" || width <= 0 || height <= 0 || maximum != 255 ||
            image.get() != '\n') {
            throw std::runtime_error("Missing or invalid application PPM");
        }
        const auto pixels = static_cast<std::uint64_t>(width) * height;
        std::array<char, 3> first{}, pixel{};
        std::uint64_t varied = 0;
        for (std::uint64_t i = 0; i < pixels; ++i) {
            if (!image.read(pixel.data(), pixel.size())) {
                throw std::runtime_error("Truncated application framebuffer");
            }
            if (i == 0) first = pixel;
            else if (pixel != first) ++varied;
        }
        if (image.peek() != std::char_traits<char>::eof()) {
            throw std::runtime_error("Unexpected bytes after application framebuffer");
        }
        if (varied < 100) throw std::runtime_error("Application framebuffer has no visible scene");
        std::cout << "application_capture=" << argv[1] << " dimensions=" << width << 'x' << height
                  << " varied_pixels=" << varied << '\n';
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
