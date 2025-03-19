# QuadCraft Glossary

This document provides definitions for the specialized terminology used throughout the QuadCraft documentation. It serves as a quick reference for developers and players to understand the unique concepts related to tetrahedral geometry, coordinate systems, and gameplay mechanics.

## A

### Adjacent Tetrahedra
Tetrahedra that share a triangular face with each other. In QuadCraft, players and entities can move between adjacent tetrahedra through their shared faces.

### Ambient Occlusion
A shading technique used to calculate how exposed each point in a scene is to ambient lighting, creating more realistic shadows in corners and crevices of tetrahedral structures.

## B

### Block
The fundamental building unit in QuadCraft, shaped as a tetrahedron rather than a cube. Blocks form the basis of the game world and can be placed, modified, and removed by players.

### Broad Phase Collision
The first step in collision detection that quickly eliminates pairs of objects that cannot possibly collide, optimized in QuadCraft for tetrahedral space.

## C

### Cartesian Coordinates
The conventional (x, y, z) coordinate system used as an intermediary in QuadCraft's rendering and physics calculations. Quadray coordinates are often converted to Cartesian coordinates for compatibility with standard 3D libraries.

### Chunk
A volumetric section of the game world containing multiple tetrahedral blocks. The world is divided into chunks for efficient memory management, loading, and rendering.

### Coordinate Conversion
The process of translating between different coordinate systems in QuadCraft, particularly between Quadray and Cartesian coordinates.

## F

### Face (Tetrahedral)
One of the four triangular faces that form a tetrahedral block. Each face connects to another tetrahedral block in the game world, or forms part of the visible surface.

## G

### Global Coordinates
The coordinate system used to specify absolute positions in the QuadCraft world, combining aspects of both Quadray and Cartesian coordinates.

### Greedy Meshing
An optimization technique for generating 3D meshes that combines adjacent faces with identical properties, adapted in QuadCraft for tetrahedral geometry.

## L

### Level of Detail (LOD)
A technique used to decrease the complexity of 3D models as they move away from the camera. In QuadCraft, this is specially adapted for tetrahedral structures.

### Local Coordinates
Coordinates relative to a specific chunk, used to locate blocks within that chunk's boundaries.

## N

### Narrow Phase Collision
The detailed collision detection process that accurately determines if and how objects interact, specialized in QuadCraft for tetrahedral shapes.

### Non-Euclidean Geometry
Geometry that does not follow the principles of Euclidean geometry. QuadCraft's tetrahedral space can exhibit non-Euclidean properties in certain configurations.

## O

### Orientation (Tetrahedral)
The specific arrangement of a tetrahedron in space, defined by the positions of its four vertices. In QuadCraft, there are several possible orientations for tetrahedral blocks.

## P

### Pathfinding
The process of finding a route between two points in the game world, made more complex in QuadCraft due to the tetrahedral structure of the environment.

### Procedural Generation
The algorithmic creation of game content, adapted in QuadCraft to generate tetrahedral landscapes, structures, and features.

## Q

### Quadray Coordinates
The four-component coordinate system (a, b, c, d) used in QuadCraft to represent positions in tetrahedral space. Each component corresponds to the distance from one of the four vertices of a reference tetrahedron.

## R

### Raycasting
A technique used to determine what objects intersect with a straight line (ray) in 3D space. In QuadCraft, raycasting is adapted for tetrahedral geometry for block selection, line-of-sight calculations, and other purposes.

### Regular Tetrahedron
A tetrahedron with four congruent equilateral triangular faces. The standard block in QuadCraft is based on a regular tetrahedron.

## S

### Space-Filling Tetrahedra
A special arrangement of tetrahedra that completely fills three-dimensional space without gaps or overlaps. QuadCraft uses space-filling tetrahedra for its world structure.

### Spatial Partitioning
A technique used to divide the game world into regions for efficient collision detection and rendering, specialized in QuadCraft for tetrahedral space.

## T

### Tetrahedron
A polyhedron with four triangular faces, four vertices, and six edges. The fundamental geometric shape used in QuadCraft instead of the cubes found in traditional voxel games.

### Tetrahedral Grid
The three-dimensional lattice formed by regularly arranged tetrahedra, serving as the structural framework for the QuadCraft world.

### Tetrahedral Meshing
The process of generating 3D triangular meshes for rendering tetrahedral blocks, optimized for the unique geometry of QuadCraft.

## V

### Vertex (Tetrahedral)
One of the four corner points of a tetrahedral block. Each vertex is shared by multiple adjacent tetrahedra in the game world.

### Voxel
A 3D pixel, typically cubic in most voxel games, but in QuadCraft, the fundamental volumetric unit is a tetrahedral voxel.

## W

### World Generation
The process of creating the game environment using procedural algorithms, adapted in QuadCraft for tetrahedral terrain, structures, and biomes.

## Technical Concepts

### Entity Component System (ECS)
The architectural pattern used in QuadCraft where game objects (entities) are composed of data components and processed by systems. This is adapted to handle the unique requirements of tetrahedral space.

### Frustum Culling
A rendering optimization technique that avoids drawing objects that are not currently visible to the camera, adapted in QuadCraft for tetrahedral chunks.

### Marching Tetrahedra
A specialized version of the marching cubes algorithm used for generating surfaces from volumetric data, adapted for QuadCraft's tetrahedral geometry.

### Octree
A tree data structure where each internal node has exactly eight children, used in QuadCraft (with modifications) for spatial partitioning of tetrahedral blocks.

### Quaternion
A mathematical notation used to represent orientations and rotations in 3D space, particularly important in QuadCraft for handling rotations in tetrahedral space.

### SIMD (Single Instruction, Multiple Data)
A class of parallel processing instructions that perform the same operation on multiple data points simultaneously, used in QuadCraft to optimize physics and rendering calculations.

## Game-Specific Terms

### Biome
A distinct region in the game world with specific environmental characteristics, adapted in QuadCraft to fit the tetrahedral landscape.

### Crafting
The game mechanic of combining materials to create new items or blocks, with unique patterns reflecting tetrahedral geometry in QuadCraft.

### Tetrahedral Compass
A specialized navigation tool in QuadCraft that helps players orient themselves in tetrahedral space, displaying directions relative to the tetrahedral grid.

### Tetrahedral Portal
A special structure that allows players to teleport between different locations or dimensions in the QuadCraft world, designed with tetrahedral geometry.

### Tetraforming
The QuadCraft equivalent of "terraforming" - reshaping the environment by placing and removing tetrahedral blocks to create structures and landscapes. 