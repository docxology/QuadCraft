# QuadCraft World Generation

This document describes the procedural world generation system used in QuadCraft, focusing on the creation of tetrahedral landscapes and structures.

## Overview

QuadCraft's world generation system creates diverse tetrahedral environments using procedural generation techniques adapted for tetrahedral space. The generation process follows a multi-layered approach to create coherent, interesting, and playable worlds.

```mermaid
graph TD
    subgraph "World Generation Process"
        InitialParams["World Parameters"]
        TerrainGeneration["Terrain Generation"]
        BiomeDistribution["Biome Distribution"]
        FeatureGeneration["Feature Generation"]
        StructurePlacement["Structure Placement"]
        DetailPass["Detail Pass"]
    end
    
    InitialParams --> TerrainGeneration
    TerrainGeneration --> BiomeDistribution
    BiomeDistribution --> FeatureGeneration
    FeatureGeneration --> StructurePlacement
    StructurePlacement --> DetailPass
```

## World Parameters

Each QuadCraft world is initialized with a set of parameters that control the generation process:

```mermaid
graph TD
    subgraph "World Parameters"
        Seed["World Seed"]
        WorldType["World Type"]
        TerrainScale["Terrain Scale"]
        BiomeSettings["Biome Settings"]
        GenerationFlags["Generation Flags"]
    end
    
    Seed --> RandomGenerator["Random Number Generator"]
    WorldType --> GenerationStrategy["Generation Strategy"]
    TerrainScale --> NoiseSettings["Noise Settings"]
    BiomeSettings --> BiomeDistribution["Biome Distribution"]
    GenerationFlags --> FeatureToggle["Feature Toggle"]
```

Key world parameters include:
- **World Seed**: A numerical value that initializes the random number generator
- **World Type**: Determines the overall terrain type (e.g., floating islands, continuous terrain, caves)
- **Terrain Scale**: Controls the scale of terrain features
- **Biome Settings**: Configures the distribution and characteristics of biomes
- **Generation Flags**: Toggles specific generation features on or off

## Tetrahedral Space Representation

Unlike traditional voxel games that use cubic grids, QuadCraft uses a tetrahedral grid system for world representation:

```mermaid
graph TD
    subgraph "Tetrahedral Grid System"
        SpaceFilling["Space-Filling Approach"]
        TetrahedralMesh["Tetrahedral Mesh"]
        Coordinates["Quadray Coordinates"]
        ChunkSystem["Tetrahedral Chunks"]
    end
    
    SpaceFilling --> RegularTetrahedra["Regular Tetrahedra"]
    SpaceFilling --> Octahedra["Octahedral Gaps"]
    
    TetrahedralMesh --> VertexData["Vertex Data"]
    TetrahedralMesh --> FaceData["Face Data"]
    
    Coordinates --> QuadrayConversion["Quadray Conversion"]
    Coordinates --> WorldIndexing["World Indexing"]
    
    ChunkSystem --> ChunkBoundaries["Chunk Boundaries"]
    ChunkSystem --> ChunkLoading["Chunk Loading"]
```

The tetrahedral grid uses:
- Regular tetrahedra arranged in a space-filling pattern
- Quadray coordinates to index positions in tetrahedral space
- Custom chunk system designed for tetrahedral elements
- Specialized mesh generation for rendering tetrahedral blocks

## Noise Generation for Tetrahedral Space

Procedural noise functions are adapted for tetrahedral space to generate coherent terrain:

```mermaid
graph TD
    subgraph "Noise Functions"
        SimplexNoise["Simplex Noise"]
        FractalNoise["Fractal Noise"]
        DomainWarping["Domain Warping"]
        TetrahedralAdaptation["Tetrahedral Adaptation"]
    end
    
    SimplexNoise --> BaseNoise["Base Terrain"]
    FractalNoise --> Roughness["Terrain Roughness"]
    DomainWarping --> TerrainDistortion["Terrain Distortion"]
    TetrahedralAdaptation --> QuadrayMapping["Quadray Mapping"]
    
    subgraph "Noise Composition"
        HeightMap["Height Map"]
        DensityField["Density Field"]
        BiomeNoise["Biome Noise"]
        FeatureNoise["Feature Noise"]
    end
    
    BaseNoise --> HeightMap
    BaseNoise --> DensityField
    Roughness --> HeightMap
    Roughness --> DensityField
    TerrainDistortion --> DensityField
    QuadrayMapping --> DensityField
```

Key noise generation features:
- **Adapted Simplex Noise**: Modified for tetrahedral space
- **Fractal Brownian Motion**: Creates natural-looking terrain variations
- **Domain Warping**: Adds natural distortions to avoid regular patterns
- **Tetrahedral-Specific Noise**: Custom noise functions that work well in quadray coordinate space
- **Multi-layered Noise**: Combination of multiple noise functions for complex terrain

## Terrain Generation Algorithm

The terrain generation algorithm creates the base landscape structure:

```mermaid
sequenceDiagram
    participant WorldGenerator
    participant NoiseGenerator
    participant TetrahedralGrid
    participant ChunkManager
    
    WorldGenerator->>NoiseGenerator: Initialize with seed
    WorldGenerator->>ChunkManager: Request chunk generation
    ChunkManager->>WorldGenerator: Request terrain for chunk
    WorldGenerator->>NoiseGenerator: Generate 3D noise field
    NoiseGenerator->>WorldGenerator: Return noise values
    WorldGenerator->>WorldGenerator: Apply terrain function
    WorldGenerator->>TetrahedralGrid: Determine solid/empty cells
    TetrahedralGrid->>WorldGenerator: Return tetrahedral occupancy
    WorldGenerator->>ChunkManager: Return generated chunk data
```

The terrain generation process:
1. **Initialization**: Set up noise generators with the world seed
2. **Chunk Request**: Generate terrain chunk by chunk
3. **Noise Field**: Create a 3D noise field for the chunk
4. **Terrain Function**: Apply mathematical functions to the noise to determine terrain shape
5. **Tetrahedral Mapping**: Map the terrain function to tetrahedral grid cells
6. **Block Assignment**: Determine which tetrahedral cells are solid and which are empty
7. **Block Type Selection**: Assign appropriate block types based on position and biome

## Special Considerations for Tetrahedral Terrain

Generating terrain in tetrahedral space requires special considerations:

```mermaid
graph TD
    subgraph "Tetrahedral Terrain Challenges"
        Connectivity["Connectivity"]
        Orientation["Tetrahedron Orientation"]
        Transitions["Smooth Transitions"]
        FaceAlignment["Face Alignment"]
    end
    
    Connectivity --> PathfindingConsiderations["Pathfinding Considerations"]
    Connectivity --> Accessibility["Accessibility Checks"]
    
    Orientation --> ConsistentPatterns["Consistent Patterns"]
    Orientation --> SpaceFillingMethod["Space-Filling Method"]
    
    Transitions --> BiomeBlending["Biome Blending"]
    Transitions --> HeightTransitions["Height Transitions"]
    
    FaceAlignment --> BuildingSurfaces["Building Surfaces"]
    FaceAlignment --> NavigationSimplicity["Navigation Simplicity"]
```

Key tetrahedral terrain considerations:
- **Connectivity**: Ensuring that terrain is appropriately connected for player navigation
- **Tetrahedron Orientation**: Maintaining consistent orientation patterns for predictable building
- **Smooth Transitions**: Creating natural transitions between different terrain heights and types
- **Face Alignment**: Aligning tetrahedral faces to create flat surfaces where appropriate
- **Special Structures**: Generating tetrahedral-specific structures that showcase the geometry

## Biome System

The biome system determines the distribution of different environments:

```mermaid
graph TD
    subgraph "Biome System"
        BiomeNoise["Biome Noise Maps"]
        Climate["Climate Parameters"]
        BiomeTypes["Biome Types"]
        Transitions["Biome Transitions"]
    end
    
    BiomeNoise --> Temperature["Temperature Map"]
    BiomeNoise --> Humidity["Humidity Map"]
    BiomeNoise --> Elevation["Elevation Map"]
    
    Climate --> BiomeSelection["Biome Selection"]
    
    BiomeTypes --> Mountains["Tetrahedral Mountains"]
    BiomeTypes --> Forests["Crystal Forests"]
    BiomeTypes --> Plains["Geometric Plains"]
    BiomeTypes --> Oceans["Fluid Volumes"]
    BiomeTypes --> Caves["Tetrahedral Caverns"]
    
    Transitions --> GradientBlending["Gradient Blending"]
    Transitions --> BorderFeatures["Border Features"]
```

The biome generation process:
1. **Climate Parameter Generation**: Create temperature, humidity, and other climate maps
2. **Biome Mapping**: Map climate parameters to biome types
3. **Biome Detailing**: Add biome-specific features and block types
4. **Transition Zones**: Create smooth transitions between different biomes
5. **Special Features**: Add biome-specific landmarks and structures

### Tetrahedral Biome Types

QuadCraft features several unique biome types designed for tetrahedral space:

```mermaid
graph TD
    subgraph "Tetrahedral Biome Types"
        Mountains["Tetrahedral Peaks"]
        Plains["Geometric Plains"]
        Forests["Crystal Forests"]
        Caves["Fractal Caverns"]
        Islands["Floating Tetrahedra"]
        Oceans["Fluid Volumes"]
    end
    
    Mountains --> SharpPeaks["Sharp Peaks"]
    Mountains --> RidgeLines["Ridge Lines"]
    
    Plains --> RegularPatterns["Regular Patterns"]
    Plains --> FlatAreas["Building-Friendly Areas"]
    
    Forests --> CrystalTrees["Crystal Tree Formations"]
    Forests --> GeometricVegetation["Geometric Vegetation"]
    
    Caves --> NestedTetrahedra["Nested Tetrahedra"]
    Caves --> VoidSpaces["Void Spaces"]
    
    Islands --> DisconnectedTerrain["Disconnected Terrain"]
    Islands --> FloatingFormations["Floating Formations"]
    
    Oceans --> LiquidSimulation["Liquid Simulation"]
    Oceans --> GeometricShores["Geometric Shores"]
```

Each biome has unique characteristics:
- **Tetrahedral Peaks**: Mountain ranges with sharp edges and defined faces
- **Geometric Plains**: Flat areas with subtle tetrahedral patterns ideal for building
- **Crystal Forests**: Forests of crystal-like tetrahedral formations resembling trees
- **Fractal Caverns**: Underground networks of tetrahedral caves with varying sizes
- **Floating Tetrahedra**: Disconnected islands of tetrahedral terrain floating in space
- **Fluid Volumes**: Areas filled with liquid contained within tetrahedral boundaries

## Feature Generation

After the base terrain and biomes are established, various features are added to the world:

```mermaid
graph TD
    subgraph "Feature Generation"
        Structures["Structures"]
        Resources["Resources"]
        DetailFeatures["Detail Features"]
        EnvironmentalObjects["Environmental Objects"]
    end
    
    Structures --> Buildings["Tetrahedral Buildings"]
    Structures --> Monuments["Geometric Monuments"]
    Structures --> Ruins["Ancient Ruins"]
    
    Resources --> Minerals["Mineral Deposits"]
    Resources --> Crystals["Crystal Formations"]
    Resources --> SpecialBlocks["Special Blocks"]
    
    DetailFeatures --> SmallFormations["Small Formations"]
    DetailFeatures --> TerrainDetail["Terrain Detail"]
    
    EnvironmentalObjects --> Flora["Geometric Flora"]
    EnvironmentalObjects --> Fauna["Tetrahedral Fauna"]
    EnvironmentalObjects --> Particles["Environmental Particles"]
```

The feature generation process:
1. **Structure Placement**: Determine locations for large structures
2. **Resource Distribution**: Place resources based on biome type and depth
3. **Detail Features**: Add small features to increase visual interest
4. **Environmental Objects**: Place flora, fauna, and other environmental objects

### Structure Generation

Structures in QuadCraft are generated using template-based and procedural approaches:

```mermaid
sequenceDiagram
    participant StructureGenerator
    participant Template
    participant TerrainAdapter
    participant ChunkManager
    
    StructureGenerator->>ChunkManager: Find suitable locations
    ChunkManager->>StructureGenerator: Return potential locations
    StructureGenerator->>Template: Load structure template
    Template->>StructureGenerator: Return structure data
    StructureGenerator->>TerrainAdapter: Adapt structure to terrain
    TerrainAdapter->>StructureGenerator: Return adapted structure
    StructureGenerator->>ChunkManager: Place structure in chunks
```

Structure generation features:
- **Template System**: Pre-designed structure templates that can be placed in the world
- **Procedural Generation**: Algorithmic generation of unique structures
- **Terrain Adaptation**: Modification of structures to fit the local terrain
- **Style Variation**: Different architectural styles based on biome and location
- **Functional Structures**: Structures with specific gameplay functions

## Chunk Management

The world is divided into tetrahedral chunks for efficient memory management and generation:

```mermaid
classDiagram
    class ChunkManager {
        +std::map<ChunkCoord, Chunk*> chunks
        +loadChunk(ChunkCoord coord)
        +unloadChunk(ChunkCoord coord)
        +getChunk(ChunkCoord coord)
        +generateChunk(ChunkCoord coord)
        +areNeighborsLoaded(ChunkCoord coord)
    }
    
    class Chunk {
        +ChunkCoord position
        +std::vector<Block*> blocks
        +bool isModified
        +bool isGenerated
        +generate()
        +getBlock(QuadrayCoord localCoord)
        +setBlock(QuadrayCoord localCoord, BlockType type)
        +serialize()
        +deserialize(Data data)
    }
    
    class WorldGenerator {
        +uint32_t seed
        +NoiseGenerator noiseGen
        +BiomeGenerator biomeGen
        +StructureGenerator structGen
        +generateTerrain(Chunk* chunk)
        +populateBiome(Chunk* chunk, BiomeType biome)
        +placeStructures(Chunk* chunk)
        +applyDetailPass(Chunk* chunk)
    }
    
    ChunkManager o-- Chunk
    ChunkManager --> WorldGenerator
```

Chunk management features:
- **Tetrahedral Chunking**: Division of the world into tetrahedral chunks
- **Dynamic Loading**: Loading and unloading chunks based on player position
- **Generation Priority**: Prioritizing generation of visible chunks
- **Chunk Serialization**: Saving and loading chunks to/from disk
- **Chunk Boundaries**: Special handling of block connections at chunk boundaries

### Chunk Coordinate System

Chunks use a specialized coordinate system to efficiently index tetrahedral space:

```mermaid
graph TD
    subgraph "Chunk Coordinate System"
        GlobalCoords["Global Coordinates"]
        ChunkCoords["Chunk Coordinates"]
        LocalCoords["Local Coordinates"]
        Conversion["Coordinate Conversion"]
    end
    
    GlobalCoords --> Quadray["Quadray (a,b,c,d)"]
    
    ChunkCoords --> ChunkIndices["Chunk Indices (i,j,k)"]
    ChunkCoords --> ChunkOrigin["Chunk Origin"]
    
    LocalCoords --> LocalIndices["Local Indices"]
    LocalCoords --> BlockPositioning["Block Positioning"]
    
    Conversion --> GlobalToChunk["Global to Chunk"]
    Conversion --> ChunkToLocal["Chunk to Local"]
    Conversion --> LocalToGlobal["Local to Global"]
```

The coordinate system allows for:
- **Efficient Indexing**: Quick lookup of blocks within the world
- **Spatial Partitioning**: Dividing the world into manageable chunks
- **Level of Detail**: Potential for multi-resolution chunk representation
- **Infinite Worlds**: Support for theoretically infinite world sizes

## World Generation Implementation

The world generation system uses the following classes and algorithms:

```mermaid
classDiagram
    class NoiseGenerator {
        +uint32_t seed
        +float frequency
        +int octaves
        +float lacunarity
        +float persistence
        +float getValue(float x, float y, float z)
        +float getFractal(float x, float y, float z)
        +float getDomainWarping(float x, float y, float z)
    }
    
    class TerrainFunction {
        +float evaluate(float x, float y, float z)
        +float getHeightAt(float x, float z)
        +bool isSolid(float x, float y, float z)
    }
    
    class BiomeGenerator {
        +NoiseGenerator climateNoise
        +std::map<ClimateParams, BiomeType> biomeMap
        +BiomeType getBiomeAt(float x, float y, float z)
        +ClimateParams getClimateAt(float x, float y, float z)
        +float getTemperature(float x, float z)
        +float getHumidity(float x, float z)
    }
    
    class StructureGenerator {
        +std::vector<StructureTemplate> templates
        +uint32_t seed
        +bool canPlaceStructure(Structure* structure, Chunk* chunk)
        +void placeStructure(Structure* structure, Chunk* chunk)
        +Structure* generateStructure(StructureType type, Vector3 position)
    }
    
    WorldGenerator --> NoiseGenerator
    WorldGenerator --> TerrainFunction
    WorldGenerator --> BiomeGenerator
    WorldGenerator --> StructureGenerator
```

## Advanced Generation Techniques

QuadCraft employs several advanced techniques for world generation:

```mermaid
graph TD
    subgraph "Advanced Techniques"
        LSystem["L-Systems"]
        ImplicitSurfaces["Implicit Surfaces"]
        Voronoi["Voronoi Diagrams"]
        TetrahedralSubdivision["Tetrahedral Subdivision"]
    end
    
    LSystem --> CrystallineGrowth["Crystalline Growth"]
    LSystem --> RecursiveStructures["Recursive Structures"]
    
    ImplicitSurfaces --> SmoothTerrain["Smooth Terrain"]
    ImplicitSurfaces --> OrganicShapes["Organic Shapes"]
    
    Voronoi --> CellularPatterns["Cellular Patterns"]
    Voronoi --> RegionDivision["Region Division"]
    
    TetrahedralSubdivision --> DetailGeneration["Detail Generation"]
    TetrahedralSubdivision --> LODSystem["LOD System"]
```

Advanced generation techniques include:
- **L-Systems**: For generating crystal-like structures and fractals
- **Implicit Surfaces**: Creating smooth, continuous terrain surfaces
- **Voronoi Diagrams**: Generating cellular patterns and region division
- **Tetrahedral Subdivision**: Adding detail through recursive subdivision
- **Procedural Patterns**: Creating repeating motifs specific to tetrahedral geometry

## Cave and Tunnel Generation

Underground features are generated using specialized algorithms:

```mermaid
graph TD
    subgraph "Cave Generation"
        CaveNoise["Cave Noise"]
        TunnelSystem["Tunnel System"]
        CavityFormation["Cavity Formation"]
        UndergroundFeatures["Underground Features"]
    end
    
    CaveNoise --> DensityThreshold["Density Threshold"]
    CaveNoise --> NoiseWorms["Noise Worms"]
    
    TunnelSystem --> PathGeneration["Path Generation"]
    TunnelSystem --> Intersections["Tunnel Intersections"]
    
    CavityFormation --> ChamberGeneration["Chamber Generation"]
    CavityFormation --> VoidPockets["Void Pockets"]
    
    UndergroundFeatures --> Crystals["Crystal Formations"]
    UndergroundFeatures --> Aquifers["Tetrahedral Aquifers"]
    UndergroundFeatures --> Minerals["Mineral Veins"]
```

Cave generation features:
- **3D Noise**: Using 3D noise functions to carve out cave systems
- **Tunnel Algorithms**: Generating connecting tunnel networks
- **Chamber Generation**: Creating large underground chambers
- **Feature Placement**: Adding special features like crystal formations
- **Fluid Pockets**: Underground lakes and lava pools

## World Generation Parameters

The world generation system offers various parameters for customization:

```mermaid
graph TD
    subgraph "Generation Parameters"
        TerrainParams["Terrain Parameters"]
        BiomeParams["Biome Parameters"]
        StructureParams["Structure Parameters"]
        FeatureParams["Feature Parameters"]
    end
    
    TerrainParams --> TerrainScale["Terrain Scale"]
    TerrainParams --> TerrainRoughness["Terrain Roughness"]
    TerrainParams --> TerrainHeight["Maximum Height"]
    
    BiomeParams --> BiomeScale["Biome Scale"]
    BiomeParams --> BiomeFrequency["Biome Frequency"]
    BiomeParams --> BiomeVariety["Biome Variety"]
    
    StructureParams --> StructureDensity["Structure Density"]
    StructureParams --> StructureScale["Structure Scale"]
    StructureParams --> StructureVariety["Structure Variety"]
    
    FeatureParams --> FeatureDensity["Feature Density"]
    FeatureParams --> ResourceAbundance["Resource Abundance"]
    FeatureParams --> DetailLevel["Detail Level"]
```

These parameters allow for:
- **Custom Worlds**: Creation of worlds with specific characteristics
- **Varied Gameplay**: Different world types for different gameplay experiences
- **Performance Tuning**: Adjusting generation complexity based on hardware capabilities
- **Creative Expression**: Enabling players to create worlds that match their vision

## World Types

QuadCraft supports different world types with unique generation characteristics:

```mermaid
graph TD
    subgraph "World Types"
        Standard["Standard World"]
        FloatingIslands["Floating Islands"]
        Cavernous["Cavernous World"]
        Flat["Flat World"]
        Custom["Custom World"]
    end
    
    Standard --> ContinuousTerrain["Continuous Terrain"]
    Standard --> FullFeatureSet["Full Feature Set"]
    
    FloatingIslands --> DisconnectedLand["Disconnected Land Masses"]
    FloatingIslands --> VerticalChallenges["Vertical Challenges"]
    
    Cavernous --> MostlyHollow["Mostly Hollow"]
    Cavernous --> UndergroundFocus["Underground Focus"]
    
    Flat --> BuildingFocused["Building-Focused"]
    Flat --> MinimalTerrain["Minimal Terrain"]
    
    Custom --> UserDefined["User-Defined Parameters"]
    Custom --> ScriptedGeneration["Scripted Generation"]
```

Each world type has specific generation rules:
- **Standard World**: Balanced terrain with mountains, plains, and varied biomes
- **Floating Islands**: Disconnected tetrahedral islands floating in space
- **Cavernous World**: Minimal surface with extensive underground cave systems
- **Flat World**: Flat terrain ideal for creative building
- **Custom World**: User-defined world with customizable parameters

## World Generation Events

The generation system fires events at different stages for modifying the generation process:

```mermaid
sequenceDiagram
    participant Generator
    participant EventSystem
    participant Plugins
    
    Generator->>EventSystem: Fire PreGeneration event
    EventSystem->>Plugins: Notify plugins
    Plugins->>Generator: Modify generation parameters
    
    Generator->>Generator: Generate base terrain
    Generator->>EventSystem: Fire PostTerrainGeneration event
    EventSystem->>Plugins: Notify plugins
    Plugins->>Generator: Add terrain modifications
    
    Generator->>Generator: Generate biomes
    Generator->>EventSystem: Fire PostBiomeGeneration event
    EventSystem->>Plugins: Notify plugins
    Plugins->>Generator: Add biome modifications
    
    Generator->>Generator: Generate features
    Generator->>EventSystem: Fire PostFeatureGeneration event
    EventSystem->>Plugins: Notify plugins
    Plugins->>Generator: Add custom features
    
    Generator->>Generator: Final pass
    Generator->>EventSystem: Fire PostGeneration event
    EventSystem->>Plugins: Notify plugins
    Plugins->>Generator: Final modifications
```

This event-based approach allows for:
- **Extensibility**: Easy addition of new generation features
- **Modding Support**: Enabling mods to modify world generation
- **Custom Generation**: Support for custom generation plugins
- **Generation Hooks**: Providing entry points for generation modifications

## Conclusion

The QuadCraft world generation system creates unique tetrahedral worlds that challenge traditional voxel game conventions. By adapting procedural generation techniques to tetrahedral space, QuadCraft offers players diverse, interesting, and mathematically elegant environments to explore and build in. 