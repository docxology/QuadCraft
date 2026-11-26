# Abstract

QuadCraft's native prototype represents physical positions as quadray
coefficients and locates chunks on a Cartesian grid. A local fixture
examines the interface between the two representations. Adding a common
coefficient offset preserves the sample's Cartesian position. Moving
between negative, central, and positive chunks changes the world chunk
key, while a block stored at a negative position remains accessible
through an equivalent quadray. The fixture and existing graphics-free
tests provide reproducible software evidence for the native prototype.
