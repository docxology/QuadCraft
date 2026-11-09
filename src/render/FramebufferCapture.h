#pragma once

#include <GL/glew.h>
#include <fstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace QuadCraft {

// Write the current context's actual RGB framebuffer as a top-down binary PPM.
inline void captureFramebuffer(const std::string& path, int width, int height,
                               GLenum buffer = GL_BACK) {
    if (width <= 0 || height <= 0) throw std::runtime_error("Empty framebuffer");
    std::vector<unsigned char> pixels(static_cast<std::size_t>(width) * height * 3);
    GLint alignment = 0;
    GLint previousBuffer = 0;
    glGetIntegerv(GL_PACK_ALIGNMENT, &alignment);
    glGetIntegerv(GL_READ_BUFFER, &previousBuffer);
    glPixelStorei(GL_PACK_ALIGNMENT, 1);
    glReadBuffer(buffer);
    glReadPixels(0, 0, width, height, GL_RGB, GL_UNSIGNED_BYTE, pixels.data());
    glReadBuffer(static_cast<GLenum>(previousBuffer));
    glPixelStorei(GL_PACK_ALIGNMENT, alignment);
    if (glGetError() != GL_NO_ERROR) throw std::runtime_error("Framebuffer read failed");
    std::ofstream out(path, std::ios::binary);
    out << "P6\n" << width << ' ' << height << "\n255\n";
    const auto stride = static_cast<std::size_t>(width) * 3;
    for (int y = height - 1; y >= 0; --y) {
        out.write(reinterpret_cast<const char*>(pixels.data() + y * stride), stride);
    }
    out.close();
    if (!out) throw std::runtime_error("Cannot write framebuffer: " + path);
}

} // namespace QuadCraft
