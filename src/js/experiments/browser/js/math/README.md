# Experiment Quadray operations and shape construction

[quadray.js](quadray.js) defines `Quadray`, with `normalized()`, `toCartesian()` returning an array, `Quadray.fromCartesian(x,y,z)`, `length/magnitude/distance`, `abcd()`, `dedup()` and raw-coefficient `equals()`. `Add/Mul/Neg` preserve raw arithmetic; lowercase `add/mul/neg` normalize. There are no documented `subtract/scale/normalize` methods.

The embedding is `(a-b-c+d, a-b+c-d, a+b-c-d)/sqrt(2)`. Common offsets are gauge; zero-minimum normalization is not a constant-sum or unit-length constraint. Number arithmetic is floating point; raw equals/dedup do not identify every physical alias.

[geometry.js](geometry.js) declares `initializeDirections()`, six CoreDirections with opposite-key mappings, `getOctahedronCorners`, `getTetrahedronZCorners`, `getTetrahedronXCorners` and triangle-generation helpers. The C placement label uses the X-oriented tetrahedron helper; do not invent `getTetrahedronCVertices`. Directions must be initialized before geometry consumers run. These prototype constructions do not establish perfect tiling, native vertex equivalence or precision-free navigation.
