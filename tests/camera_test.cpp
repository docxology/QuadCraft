#include "../src/core/entity/Camera.h"
#include <cassert>
#include <cmath>

using namespace QuadCraft;

int main() {
    Camera view;
    const auto before = view.getProjectionMatrix(1.5f, 0.1f, 100.0f);
    const Vector3 boundary(0.0f, 3.5f, -10.0f);
    assert(view.getFrustum().sphereInFrustum(boundary, 0.0f));
    view.processMouseScroll(10.0f);
    const auto after = view.getProjectionMatrix(1.5f, 0.1f, 100.0f);
    assert(std::abs(after[5] - 1.0f / std::tan(view.radians(17.5f))) < 1e-5f);
    assert(after[5] > before[5]);
    assert(!view.getFrustum().sphereInFrustum(boundary, 0.0f));
    assert(std::abs(after[5] / after[0] - 1.5f) < 1e-5f);
    view.getProjectionMatrix(0.5f, 0.1f, 100.0f);
    assert(!view.getFrustum().sphereInFrustum(Vector3(2.0f, 0.0f, -10.0f), 0.0f));
    view.getProjectionMatrix(2.0f, 0.1f, 100.0f);
    assert(view.getFrustum().sphereInFrustum(Vector3(2.0f, 0.0f, -10.0f), 0.0f));
    assert(!view.getFrustum().sphereInFrustum(Vector3(0.0f, 0.0f, -101.0f), 0.0f));
    assert(!view.getFrustum().sphereInFrustum(Vector3(0.0f, 0.0f, 1.0f), 0.0f));
    view.processMouseScroll(100.0f);
    assert(view.zoom == 1.0f);
    assert(!view.getFrustum().sphereInFrustum(boundary, 0.0f));
    view.processMouseScroll(-100.0f);
    assert(view.zoom == 45.0f);
    assert(view.getFrustum().sphereInFrustum(boundary, 0.0f));
    const auto matrix = view.getViewMatrix();
    assert(std::abs(matrix[0] - 1.0f) < 1e-5f);
    view.processKeyboard(RIGHT, 0.1f);
    assert((view.getPositionQuadray().toCartesian() - view.position).length() < 1e-5f);
    Camera camera(Vector3(2.0f, 3.0f, 4.0f));
    assert((camera.getPositionQuadray().toCartesian() - camera.position).length() < 1e-5f);
    return 0;
}
