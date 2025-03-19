# Tetrahedral Geometry in QuadCraft

## Introduction

Tetrahedral geometry forms the foundation of QuadCraft's world. Unlike traditional voxel games that use cubic elements, QuadCraft builds its world from tetrahedra - three-dimensional shapes with four triangular faces. This document explains the mathematical properties of tetrahedra and their implementation in QuadCraft.

## Basic Properties of a Tetrahedron

A tetrahedron is a polyhedron with four triangular faces, six edges, and four vertices.

```mermaid
graph TD
    subgraph "Tetrahedron Components"
        V["4 Vertices"]
        E["6 Edges"]
        F["4 Triangular Faces"]
        V --- E
        E --- F
    end
```

### Regular Tetrahedron

A regular tetrahedron has equilateral triangular faces and equal dihedral angles.

```mermaid
graph TD
    A((A)) --- B((B))
    A --- C((C))
    A --- D((D))
    B --- C
    B --- D
    C --- D
    
    style A fill:#ff9,stroke:#333,stroke-width:2px
    style B fill:#ff9,stroke:#333,stroke-width:2px
    style C fill:#ff9,stroke:#333,stroke-width:2px
    style D fill:#ff9,stroke:#333,stroke-width:2px
```

### Mathematical Properties

- **Volume**: For a regular tetrahedron with edge length a, the volume is:
  V = (a³)/(6√2) ≈ 0.1179a³

- **Surface Area**: For a regular tetrahedron with edge length a, the surface area is:
  A = √3 × a² ≈ 1.732a²

- **Dihedral Angle**: The angle between any two faces is approximately 70.53°

## Tetrahedral Grid System

QuadCraft uses a tetrahedral grid system to position blocks. This grid is based on a space-filling arrangement of tetrahedra.

```mermaid
graph TD
    subgraph "Space-Filling Arrangement"
        T1["Tetrahedron 1"]
        T2["Tetrahedron 2"]
        T3["Tetrahedron 3"]
        T4["Tetrahedron 4"]
        T5["Tetrahedron 5"]
        T6["Tetrahedron 6"]
        
        T1 --- T2
        T1 --- T3
        T1 --- T4
        T2 --- T5
        T3 --- T5
        T4 --- T6
        T5 --- T6
    end
```

### Space-Filling Properties

The regular tetrahedral grid is not space-filling on its own. To fill space completely, QuadCraft uses a combination of tetrahedra in a repeating pattern:

```mermaid
graph TD
    subgraph "Space-Filling Pattern"
        A["Type A Tetrahedron"]
        B["Type B Tetrahedron"]
        A -->|Repeating Pattern| B
        B -->|Repeating Pattern| A
    end
```

## Implementation in QuadCraft

### Tetrahedral Element Class

The `TetrahedralElement` class represents a single tetrahedral building block:

```cpp
class TetrahedralElement {
public:
    // Constants
    static const float sqrt2 = 1.414213562f; // √2
    
    // Position in quadray coordinates
    Quadray position;
    
    // Block type
    uint8_t blockType;
    
    // Orientation (0-23)
    uint8_t orientation;
    
    // Constructor
    TetrahedralElement(const Quadray& pos, uint8_t type, uint8_t orient = 0);
    
    // Get vertices in Cartesian coordinates
    std::array<Vector3, 4> getVertices() const;
    
    // Check if point is inside this tetrahedron
    bool containsPoint(const Vector3& point) const;
};
```

### Tetrahedral Mesh Generation

Converting tetrahedral elements into renderable meshes involves triangulating their surfaces:

```mermaid
graph TD
    Elements["Tetrahedral Elements"] --> ExtractFaces["Extract Visible Faces"]
    ExtractFaces --> Triangulate["Triangulate Faces"]
    Triangulate --> GenMesh["Generate Mesh Data"]
    GenMesh --> Render["Render Mesh"]
```

### Vertex Positions

For a regular tetrahedron centered at origin with edge length 2, the vertices in Cartesian coordinates are:

```mermaid
graph LR
    subgraph "Vertex Positions"
        V1["V1: (1, 1, 1)"]
        V2["V2: (1, -1, -1)"]
        V3["V3: (-1, 1, -1)"]
        V4["V4: (-1, -1, 1)"]
    end
```

## Navigation in Tetrahedral Space

### Adjacency and Connectivity

Tetrahedra connect to each other through their triangular faces:

```mermaid
graph TD
    T1["Tetrahedron 1"] -->|Face A| T2["Tetrahedron 2"]
    T1 -->|Face B| T3["Tetrahedron 3"]
    T1 -->|Face C| T4["Tetrahedron 4"]
    T1 -->|Face D| T5["Tetrahedron 5"]
```

### Raycasting

Raycasting in tetrahedral space involves checking for ray-triangle intersections:

```mermaid
sequenceDiagram
    participant Ray
    participant Tetrahedron
    participant Face
    
    Ray->>Tetrahedron: Check intersection
    Tetrahedron->>Face: Test each face
    Face-->>Tetrahedron: Face hit + distance
    Tetrahedron-->>Ray: Closest hit face
```

## Tetrahedral Coordinates vs. Cubic Voxels

The tetrahedral approach offers several advantages and challenges compared to cubic voxels:

```mermaid
graph TD
    subgraph "Comparison"
        A["Tetrahedral System"]
        B["Cubic Voxel System"]
        
        A -->|Advantages| A1["Better approximation of diagonal surfaces"]
        A -->|Advantages| A2["More efficient representation of certain structures"]
        A -->|Advantages| A3["Natural representation of crystalline structures"]
        
        A -->|Challenges| C1["More complex navigation"]
        A -->|Challenges| C2["Higher computational complexity"]
        A -->|Challenges| C3["Less intuitive for players familiar with cubic voxels"]
        
        B -->|Advantages| B1["Simpler implementation"]
        B -->|Advantages| B2["More intuitive for most players"]
        B -->|Advantages| B3["Efficient storage and rendering"]
        
        B -->|Challenges| D1["Stair-stepping on diagonal surfaces"]
        B -->|Challenges| D2["Higher memory usage for certain structures"]
    end
```

## Special Geometric Structures

### Tetrahedral-Octahedral Honeycomb

A recurring structure in tetrahedral space is the tetrahedral-octahedral honeycomb:

```mermaid
graph TD
    subgraph "Tetrahedral-Octahedral Honeycomb"
        T["Tetrahedron"] --- O["Octahedron"]
        O --- T2["Tetrahedron"]
        T --- T3["Tetrahedron"]
        O --- O2["Octahedron"]
    end
```

This arrangement fills space efficiently and forms naturally in the tetrahedral grid system.

### Compound Structures

Complex structures can be built from tetrahedral elements:

```mermaid
graph TD
    subgraph "Compound Structures"
        P["Pyramid"] --- Prism["Triangular Prism"]
        Prism --- Dodec["Dodecahedron"]
        P --- Icosa["Icosahedron"]
    end
```

## Collision Detection

Collision detection in tetrahedral space requires specialized algorithms:

```mermaid
graph TD
    Start["Player Position"] --> Convert["Convert to Tetrahedral Space"]
    Convert --> Query["Query Surrounding Tetrahedra"]
    Query --> Test["Test for Collisions"]
    Test --> Resolve["Resolve Collisions"]
    Resolve --> Response["Apply Response"]
```

### Barycentric Coordinates

Barycentric coordinates are used for determining if a point is inside a tetrahedron:

```mermaid
graph LR
    subgraph "Barycentric Coordinates"
        P["Point (x,y,z)"] --> B["Barycentric (u,v,w,t)"]
        B --> Test["Test: u,v,w,t ≥ 0 and u+v+w+t=1"]
    end
```

## Conclusion

The tetrahedral geometry in QuadCraft provides a unique foundation for a voxel game. While more complex than traditional cubic voxels, tetrahedra offer interesting geometric properties and allow for more natural representation of certain structures.

The mathematical foundation of the tetrahedral system, combined with the Quadray coordinate system, creates a coherent and elegant framework for the game's world. 