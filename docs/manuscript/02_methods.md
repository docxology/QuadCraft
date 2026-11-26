# Methods

The probe builds against the native coordinate and world headers and
links the same chunk implementation used by the world regression suite.
It converts Cartesian points with a shared vertical and depth coordinate
to quadrays, then adds a common offset to each coefficient. It compares
the Cartesian round-trip coordinates within the tolerance used for
coordinate round trips by the existing tests.

For each point, the probe asks the native world for its Cartesian
chunk key. It also writes a dirt block through the first point's
unshifted quadray, reads it through the shifted quadray, and checks an
adjacent position for air. The Python build step converts the measured
rows into a JSON evidence record and draws the figure using their
world positions and actual chunk keys.
