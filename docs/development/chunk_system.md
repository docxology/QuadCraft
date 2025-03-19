# QuadCraft Tetrahedral Chunk System

This document details the chunk system in QuadCraft, explaining how the tetrahedral world is divided into manageable chunks and how these chunks are processed, stored, and rendered.

## Chunk System Overview

The QuadCraft chunk system divides the tetrahedral world into manageable units for efficient memory usage, processing, and rendering.

```mermaid
graph TD
    subgraph "Chunk System Architecture"
        ChunkManager["Chunk Manager"]
        Chunks["Tetrahedral Chunks"]
        ChunkCoordinates["Chunk Coordinates"]
        ChunkProcessing["Chunk Processing"]
        ChunkMeshing["Chunk Meshing"]
    end
    
    ChunkManager --> ChunkLoading["Chunk Loading"]
    ChunkManager --> ChunkUnloading["Chunk Unloading"]
    ChunkManager --> ChunkGeneration["Chunk Generation"]
    ChunkManager --> ChunkSerialization["Chunk Serialization"]
    
    Chunks --> BlockStorage["Block Storage"]
    Chunks --> MetadataStorage["Metadata Storage"]
    Chunks --> EntityReferences["Entity References"]
    
    ChunkCoordinates --> IndexingSystem["Indexing System"]
    ChunkCoordinates --> CoordinateConversion["Coordinate Conversion"]
    
    ChunkProcessing --> UpdateQueue["Update Queue"]
    ChunkProcessing --> ProcessingPriorities["Processing Priorities"]
    
    ChunkMeshing --> MeshGeneration["Mesh Generation"]
    ChunkMeshing --> MeshOptimization["Mesh Optimization"]
    ChunkMeshing --> RenderBatching["Render Batching"]
```

## Tetrahedral Chunk Design

Unlike traditional voxel games that use cubic chunks, QuadCraft uses tetrahedral chunks to efficiently represent its non-Euclidean world.

### Chunk Structure

Each chunk in QuadCraft has the following key characteristics:

```mermaid
classDiagram
    class TetrahedralChunk {
        +ChunkCoord position
        +BlockStorage* blocks
        +LightingData* lighting
        +MetadataStorage* metadata
        +std::vector<Entity*> entities
        +ChunkMesh* mesh
        +bool isModified
        +bool isGenerated
        +bool isLoaded
        +bool isLightingCalculated
        +bool isMeshGenerated
        +bool isActive
        +void initialize()
        +Block* getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +void updateLighting()
        +void generateMesh()
        +void markDirty()
        +void update(float deltaTime)
        +void save(std::ostream& stream)
        +void load(std::istream& stream)
        +bool isVisible(Frustum* frustum)
    }
    
    class BlockStorage {
        +std::vector<Block> blocks
        +Block getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +uint32_t index(LocalCoord coord)
        +bool isValidCoord(LocalCoord coord)
        +void clear()
        +void optimize()
    }
    
    class ChunkMesh {
        +Mesh* opaqueMesh
        +Mesh* transparentMesh
        +bool isDirty
        +void generate(TetrahedralChunk* chunk)
        +void render(Shader* shader)
        +void destroy()
        +int getTriangleCount()
        +void optimizeMesh()
    }
    
    class LightingData {
        +std::vector<uint8_t> lightLevels
        +void calculateLighting(TetrahedralChunk* chunk, std::vector<TetrahedralChunk*> neighbors)
        +void propagateLight(LocalCoord start, LightType type)
        +uint8_t getLightLevel(LocalCoord coord, LightType type)
        +void setLightLevel(LocalCoord coord, LightType type, uint8_t level)
    }
    
    TetrahedralChunk o-- BlockStorage
    TetrahedralChunk o-- ChunkMesh
    TetrahedralChunk o-- LightingData
```

### Tetrahedral Chunk Geometry

Each chunk contains a structured arrangement of tetrahedral cells:

```mermaid
graph TD
    subgraph "Tetrahedral Chunk Geometry"
        TetrahedralGrid["Tetrahedral Grid"]
        Size["Chunk Size Parameters"]
        LocalCoordinates["Local Coordinates"]
        Boundaries["Chunk Boundaries"]
    end
    
    TetrahedralGrid --> SpaceFilling["Space-Filling Tetrahedra"]
    TetrahedralGrid --> OrientationPatterns["Orientation Patterns"]
    
    Size --> DimensionParams["Dimension Parameters"]
    Size --> CellCount["Cell Count"]
    
    LocalCoordinates --> IndexingSystem["Indexing System"]
    LocalCoordinates --> Mapping["Coordinate Mapping"]
    
    Boundaries --> BoundaryConditions["Boundary Conditions"]
    Boundaries --> SeamHandling["Seam Handling"]
```

The tetrahedral chunk uses a specific geometric arrangement:
- **Chunk Size**: Each chunk contains a configurable number of tetrahedral cells (default: 16x16x16 in Cartesian space)
- **Cell Arrangement**: Tetrahedra are arranged in a space-filling pattern
- **Boundary Definition**: Chunk boundaries are defined along planes that align with tetrahedral faces
- **Orientation Consistency**: Tetrahedral orientations follow consistent patterns for predictable navigation

## Chunk Coordinates

The chunk system uses multiple coordinate systems for different purposes:

```mermaid
classDiagram
    class ChunkCoord {
        +int x
        +int y
        +int z
        +uint64_t hash()
        +bool operator==(const ChunkCoord& other)
        +ChunkCoord getNeighbor(Direction direction)
        +float distanceTo(ChunkCoord other)
    }
    
    class GlobalCoord {
        +Quadray quadray
        +Vector3 cartesian
        +ChunkCoord toChunkCoord()
        +LocalCoord toLocalCoord()
        +static GlobalCoord fromQuadray(Quadray quadray)
        +static GlobalCoord fromCartesian(Vector3 cartesian)
        +GlobalCoord getNeighbor(Direction direction)
    }
    
    class LocalCoord {
        +int tetraIndex
        +Vector3 localPosition
        +GlobalCoord toGlobalCoord(ChunkCoord chunkCoord)
        +LocalCoord getNeighbor(Direction direction)
        +bool isOnBoundary()
        +int getBoundaryFace()
        +bool isValid()
    }
    
    class CoordinateSystem {
        +GlobalCoord worldToGlobal(Vector3 worldPos)
        +Vector3 globalToWorld(GlobalCoord coord)
        +ChunkCoord worldToChunk(Vector3 worldPos)
        +LocalCoord worldToLocal(Vector3 worldPos, ChunkCoord chunkCoord)
        +Vector3 chunkLocalToWorld(ChunkCoord chunkCoord, LocalCoord localCoord)
    }
    
    GlobalCoord --> ChunkCoord
    GlobalCoord --> LocalCoord
    CoordinateSystem --> GlobalCoord
    CoordinateSystem --> ChunkCoord
    CoordinateSystem --> LocalCoord
```

The coordinate systems serve different purposes:
- **ChunkCoord**: Identifies specific chunks in the world grid
- **GlobalCoord**: Represents a global position in both Quadray and Cartesian coordinates
- **LocalCoord**: Identifies a specific tetrahedral cell and position within a chunk
- **CoordinateSystem**: Provides utility functions for converting between coordinate systems

### Coordinate Mapping

Converting between different coordinate systems is a core function:

```mermaid
sequenceDiagram
    participant World as World Position
    participant Global as Global Coordinate
    participant Chunk as Chunk Coordinate
    participant Local as Local Coordinate
    participant Index as Storage Index
    
    World->>Global: worldToGlobal(Vector3)
    Global->>Chunk: toChunkCoord()
    Global->>Local: toLocalCoord()
    Local->>Index: blockStorage.index(LocalCoord)
    
    Index->>Local: blockStorage.indexToCoord(index)
    Local->>Global: toGlobalCoord(ChunkCoord)
    Global->>World: globalToWorld(GlobalCoord)
```

This conversion system enables:
- **Efficient Lookup**: Quick translation from world position to specific block
- **Seamless Boundaries**: Smooth handling of positions crossing chunk boundaries
- **Tetrahedral Alignment**: Proper alignment with the tetrahedral grid
- **Bidirectional Mapping**: Conversion in both directions for complete functionality

## Chunk Manager

The ChunkManager handles all aspects of chunk loading, unloading, and processing:

```mermaid
classDiagram
    class ChunkManager {
        +std::map<ChunkCoord, TetrahedralChunk*> chunks
        +TetrahedralChunk* getChunk(ChunkCoord coord)
        +TetrahedralChunk* loadChunk(ChunkCoord coord)
        +void unloadChunk(ChunkCoord coord)
        +void saveChunk(ChunkCoord coord)
        +Block getBlock(GlobalCoord coord)
        +void setBlock(GlobalCoord coord, Block block)
        +std::vector<TetrahedralChunk*> getVisibleChunks(Frustum* frustum)
        +void update(Vector3 playerPosition, float deltaTime)
        +void updateChunkLoading(Vector3 playerPosition)
        +void generateMeshes()
        +void markAreaDirty(GlobalCoord min, GlobalCoord max)
        +void onPlayerMovedChunk(ChunkCoord oldChunk, ChunkCoord newChunk)
    }
    
    class ChunkCache {
        +std::map<ChunkCoord, CacheEntry> cache
        +CacheEntry* getCacheEntry(ChunkCoord coord)
        +void addToCache(ChunkCoord coord, TetrahedralChunk* chunk)
        +void removeFromCache(ChunkCoord coord)
        +void flush()
        +void updatePriorities(ChunkCoord playerChunk)
        +TetrahedralChunk* getNextEvictionCandidate()
    }
    
    class ChunkGenerator {
        +WorldGenerator* worldGenerator
        +void generateChunk(TetrahedralChunk* chunk)
        +void populateChunk(TetrahedralChunk* chunk)
        +void generateStructures(TetrahedralChunk* chunk)
        +void finalizeChunk(TetrahedralChunk* chunk)
        +bool isGenerating()
        +void cancelGeneration()
    }
    
    class ChunkSerializer {
        +void saveChunk(TetrahedralChunk* chunk, std::string filename)
        +TetrahedralChunk* loadChunk(ChunkCoord coord, std::string filename)
        +bool chunkExists(ChunkCoord coord)
        +void deleteChunk(ChunkCoord coord)
        +std::vector<ChunkCoord> getExistingChunks()
    }
    
    ChunkManager o-- ChunkCache
    ChunkManager o-- ChunkGenerator
    ChunkManager o-- ChunkSerializer
```

The ChunkManager responsibilities include:
- **Chunk Lifecycle**: Managing the loading, unloading, and activation of chunks
- **Player-Centric Loading**: Loading chunks around the player's position
- **Persistent Storage**: Saving and loading chunks from disk
- **Block Access**: Providing a world-coordinate interface for block manipulation
- **Visibility Determination**: Identifying which chunks should be rendered
- **Mesh Generation**: Coordinating the generation and updating of chunk meshes

### Chunk Loading Strategy

The chunk loading process follows a specific strategy:

```mermaid
graph TD
    subgraph "Chunk Loading Strategy"
        PlayerPosition["Player Position"]
        LoadDistance["Load Distance Parameters"]
        PriorityCalculation["Priority Calculation"]
        LoadingQueue["Loading Queue"]
    end
    
    PlayerPosition --> PlayerChunk["Player Chunk"]
    
    LoadDistance --> HorizontalDistance["Horizontal Distance"]
    LoadDistance --> VerticalDistance["Vertical Distance"]
    LoadDistance --> ViewDistance["View Distance"]
    
    PlayerChunk --> ChunkDistanceCalculation["Chunk Distance Calculation"]
    LoadDistance --> ChunkDistanceCalculation
    
    ChunkDistanceCalculation --> LoadingDecision["Loading Decision"]
    LoadingDecision --> LoadingQueue
    
    LoadingQueue --> HighPriorityChunks["High Priority Chunks"]
    LoadingQueue --> MediumPriorityChunks["Medium Priority Chunks"]
    LoadingQueue --> LowPriorityChunks["Low Priority Chunks"]
```

Key loading strategy elements:
- **Spherical Loading**: Chunks are loaded in spherical layers around the player
- **Distance-Based Priority**: Closer chunks have higher loading priority
- **View Direction Bias**: Chunks in the player's view direction have increased priority
- **Incremental Loading**: Chunks are loaded over multiple frames to avoid stuttering
- **Memory Bounds**: A maximum number of loaded chunks prevents excessive memory usage

## Block Storage

The chunk system includes specialized storage for tetrahedral blocks:

```mermaid
classDiagram
    class TetrahedralBlockStorage {
        +std::vector<Block> blocks
        +Block getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +uint32_t index(LocalCoord coord)
        +LocalCoord indexToCoord(uint32_t index)
        +bool isValidCoord(LocalCoord coord)
        +void clear()
        +void optimize()
    }
    
    class PaletteBlockStorage {
        +std::vector<uint16_t> indices
        +std::vector<Block> palette
        +Block getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +void rebuildPalette()
        +int getPaletteSize()
        +int getBitsPerBlock()
        +void optimize()
    }
    
    class RunLengthBlockStorage {
        +std::vector<RLEEntry> entries
        +Block getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +void compressStorage()
        +int getCompressionRatio()
        +void optimize()
    }
    
    class SparseBlockStorage {
        +std::map<uint32_t, Block> blocks
        +Block getBlock(LocalCoord coord)
        +void setBlock(LocalCoord coord, Block block)
        +bool hasBlock(LocalCoord coord)
        +void removeBlock(LocalCoord coord)
        +int getBlockCount()
        +std::vector<uint32_t> getOccupiedIndices()
    }
    
    BlockStorage <|-- TetrahedralBlockStorage
    TetrahedralBlockStorage <|-- PaletteBlockStorage
    TetrahedralBlockStorage <|-- RunLengthBlockStorage
    TetrahedralBlockStorage <|-- SparseBlockStorage
```

The storage systems are optimized for different scenarios:
- **Basic Storage**: Standard array of block data for general use
- **Palette Storage**: Optimized for chunks with few unique block types
- **Run-Length Encoding**: Efficient for chunks with large areas of the same block type
- **Sparse Storage**: Optimized for mostly empty chunks
- **Adaptive Storage**: Selection of optimal storage type based on chunk contents

## Chunk Meshing

The process of converting chunk data into renderable meshes is crucial for performance:

```mermaid
sequenceDiagram
    participant Chunk as TetrahedralChunk
    participant Mesher as ChunkMesher
    participant Factory as MeshFactory
    participant Optimizer as MeshOptimizer
    participant Renderer as ChunkRenderer
    
    Chunk->>Chunk: markDirty()
    Chunk->>Mesher: generateMesh(chunk)
    Mesher->>Mesher: extractVisibleFaces()
    Mesher->>Factory: createTetrahedralFaces()
    Factory->>Mesher: return face data
    Mesher->>Optimizer: optimizeMesh(meshData)
    Optimizer->>Mesher: return optimized mesh
    Mesher->>Chunk: setMesh(mesh)
    Chunk->>Renderer: render(shader)
```

The meshing process includes:
- **Face Extraction**: Identifying visible tetrahedral faces
- **Geometry Generation**: Creating triangulated geometry for the faces
- **Material Sorting**: Separating opaque and transparent geometry
- **Mesh Optimization**: Reducing triangle count and vertex duplication
- **Buffer Creation**: Generating GPU-friendly vertex and index buffers
- **Render Preparation**: Organizing meshes for efficient rendering

### Tetrahedral Face Visibility

Determining which faces are visible is a key optimization:

```mermaid
graph TD
    subgraph "Face Visibility Determination"
        SolidCheck["Solid Block Check"]
        TransparencyCheck["Transparency Check"]
        NeighborCheck["Neighbor Block Check"]
        OcclusionCheck["Occlusion Check"]
    end
    
    SolidCheck --> IsBlockSolid["Is Block Solid?"]
    IsBlockSolid -->|No| SkipBlock["Skip Block"]
    IsBlockSolid -->|Yes| CheckFaces["Check Faces"]
    
    CheckFaces --> IterateFaces["Iterate Over Tetrahedron Faces"]
    IterateFaces --> GetNeighbor["Get Neighbor Block"]
    
    GetNeighbor --> NeighborCheck
    NeighborCheck --> IsNeighborSolid["Is Neighbor Solid?"]
    
    IsNeighborSolid -->|No| FaceVisible["Face is Visible"]
    IsNeighborSolid -->|Yes| TransparencyCheck
    
    TransparencyCheck --> BothTransparent["Both Blocks Transparent?"]
    BothTransparent -->|Yes| CompareTypes["Compare Block Types"]
    BothTransparent -->|No| OcclusionCheck
    
    OcclusionCheck --> IsOccluded["Is Face Occluded?"]
    IsOccluded -->|Yes| FaceHidden["Face is Hidden"]
    IsOccluded -->|No| FaceVisible
```

Advanced visibility techniques include:
- **Greedy Meshing**: Combining adjacent faces with the same properties
- **Ambient Occlusion**: Adding shading to corners for visual depth
- **LOD Generation**: Creating multiple detail levels for distant chunks
- **Partial Updates**: Updating only modified sections of a chunk
- **Tetrahedral-Specific Optimizations**: Special handling for tetrahedral geometry

## Chunk Processing Pipeline

The chunk processing follows a multi-stage pipeline:

```mermaid
graph TD
    subgraph "Chunk Processing Pipeline"
        Loading["Loading Stage"]
        Generation["Generation Stage"]
        Population["Population Stage"]
        Lighting["Lighting Stage"]
        Meshing["Meshing Stage"]
        Optimization["Optimization Stage"]
        Serialization["Serialization Stage"]
    end
    
    Loading --> DiskLoad["Load from Disk"]
    Loading --> CreateNew["Create New Chunk"]
    
    Generation --> TerrainGeneration["Terrain Generation"]
    Generation --> BiomeAssignment["Biome Assignment"]
    
    Population --> StructureGeneration["Structure Generation"]
    Population --> EntityPlacement["Entity Placement"]
    Population --> DetailPass["Detail Pass"]
    
    Lighting --> SunlightPropagation["Sunlight Propagation"]
    Lighting --> BlocklightPropagation["Blocklight Propagation"]
    
    Meshing --> FaceExtraction["Face Extraction"]
    Meshing --> GeometryGeneration["Geometry Generation"]
    
    Optimization --> VertexOptimization["Vertex Optimization"]
    Optimization --> IndexOptimization["Index Optimization"]
    
    Serialization --> BlockSerialization["Block Serialization"]
    Serialization --> MetadataSerialization["Metadata Serialization"]
```

The processing pipeline ensures efficient chunk preparation:
- **Multi-Threading**: Processing chunks on background threads
- **Priority System**: Prioritizing chunks that are most important to the player
- **Batching**: Processing multiple chunks in batches for efficiency
- **Cancellation**: Cancelling low-priority processing when new areas become important
- **Progress Tracking**: Tracking and reporting processing progress for user feedback

## Tetrahedral Chunk Challenges

Working with tetrahedral chunks presents unique challenges:

```mermaid
graph TD
    subgraph "Tetrahedral Chunk Challenges"
        GeometryComplexity["Geometry Complexity"]
        BoundaryHandling["Boundary Handling"]
        StorageEfficiency["Storage Efficiency"]
        MeshingComplexity["Meshing Complexity"]
        NavigationComplexity["Navigation Complexity"]
    end
    
    GeometryComplexity --> NonEuclideanGeometry["Non-Euclidean Geometry"]
    GeometryComplexity --> ComplexTriangulation["Complex Triangulation"]
    
    BoundaryHandling --> EdgeCases["Edge Cases"]
    BoundaryHandling --> SeamRendering["Seam Rendering"]
    
    StorageEfficiency --> SparseData["Sparse Data"]
    StorageEfficiency --> CompressionTechniques["Compression Techniques"]
    
    MeshingComplexity --> GreedyMeshingAdaptation["Greedy Meshing Adaptation"]
    MeshingComplexity --> TetrahedralFaceHandling["Tetrahedral Face Handling"]
    
    NavigationComplexity --> PathfindingAcrossChunks["Pathfinding Across Chunks"]
    NavigationComplexity --> ConsistentOrientation["Consistent Orientation"]
```

Solutions to these challenges include:
- **Specialized Algorithms**: Custom algorithms adapted for tetrahedral geometry
- **Boundary Metadata**: Extra metadata to handle chunk boundaries properly
- **Optimized Storage**: Storage schemes tailored to tetrahedral data
- **Adaptive Meshing**: Meshing techniques that adapt to tetrahedral faces
- **Coordinate Translation**: Robust systems for translating between coordinate systems

## Memory Management

Efficient memory management is crucial for the chunk system:

```mermaid
classDiagram
    class ChunkMemoryManager {
        +size_t maxMemoryUsage
        +size_t currentMemoryUsage
        +size_t getChunkMemoryUsage(TetrahedralChunk* chunk)
        +bool canLoadChunk()
        +void registerChunkLoad(TetrahedralChunk* chunk)
        +void registerChunkUnload(TetrahedralChunk* chunk)
        +std::vector<TetrahedralChunk*> getEvictionCandidates(int count)
        +void optimizeMemoryUsage()
    }
    
    class ChunkCache {
        +std::map<ChunkCoord, CacheEntry> cache
        +size_t maxCacheSize
        +void addToCache(TetrahedralChunk* chunk)
        +TetrahedralChunk* getFromCache(ChunkCoord coord)
        +void removeFromCache(ChunkCoord coord)
        +void updateCachePriorities(ChunkCoord playerChunk)
        +void trimCache()
    }
    
    class MemoryPool {
        +void* allocate(size_t size)
        +void deallocate(void* ptr)
        +size_t getUsedMemory()
        +size_t getCapacity()
        +void expandCapacity(size_t additionalCapacity)
        +void optimize()
    }
    
    ChunkMemoryManager o-- ChunkCache
    ChunkMemoryManager --> MemoryPool
```

Memory management strategies include:
- **Memory Budgeting**: Setting limits on chunk-related memory usage
- **Chunk Eviction**: Unloading less important chunks when memory limits are approached
- **Memory Pooling**: Using pooled allocations for chunk data to reduce fragmentation
- **Deferred Loading**: Loading chunks only when necessary
- **Compression**: Compressing inactive chunks in memory
- **Shared Resource Usage**: Sharing common resources across chunks

## Chunk Serialization

Saving and loading chunks is essential for persistent worlds:

```mermaid
classDiagram
    class ChunkSerializer {
        +void saveChunk(TetrahedralChunk* chunk, std::ostream& stream)
        +TetrahedralChunk* loadChunk(ChunkCoord coord, std::istream& stream)
        +void writeHeader(ChunkHeader header, std::ostream& stream)
        +ChunkHeader readHeader(std::istream& stream)
        +void writeBlocks(TetrahedralChunk* chunk, std::ostream& stream)
        +void readBlocks(TetrahedralChunk* chunk, std::istream& stream)
        +void writeMetadata(TetrahedralChunk* chunk, std::ostream& stream)
        +void readMetadata(TetrahedralChunk* chunk, std::istream& stream)
    }
    
    class ChunkCompressionLayer {
        +void compressData(const std::vector<uint8_t>& input, std::vector<uint8_t>& output)
        +void decompressData(const std::vector<uint8_t>& input, std::vector<uint8_t>& output)
        +CompressionFormat getFormat()
        +int getCompressionLevel()
        +void setCompressionLevel(int level)
    }
    
    class ChunkStorage {
        +void saveChunkToDisk(TetrahedralChunk* chunk)
        +TetrahedralChunk* loadChunkFromDisk(ChunkCoord coord)
        +bool chunkExistsOnDisk(ChunkCoord coord)
        +void deleteChunkFromDisk(ChunkCoord coord)
        +std::string getChunkFilename(ChunkCoord coord)
        +std::vector<ChunkCoord> getExistingChunks()
    }
    
    ChunkSerializer --> ChunkCompressionLayer
    ChunkStorage --> ChunkSerializer
```

The serialization system includes:
- **Format Versioning**: Support for evolving chunk formats
- **Data Compression**: Efficient compression for stored chunks
- **Streaming Support**: Incremental reading and writing of chunk data
- **Error Handling**: Robust error handling and recovery
- **Backwards Compatibility**: Supporting loading of older chunk formats
- **Region Files**: Grouping chunks into region files for efficiency

## Multi-Threading Model

The chunk system leverages multi-threading for performance:

```mermaid
graph TD
    subgraph "Chunk Threading Model"
        MainThread["Main Thread"]
        LoadingThread["Loading Thread"]
        GenerationThread["Generation Thread"]
        MeshingThread["Meshing Thread"]
        SavingThread["Saving Thread"]
    end
    
    MainThread --> ChunkManager["Chunk Manager"]
    MainThread --> ChunkRenderManager["Chunk Render Manager"]
    
    LoadingThread --> LoadingQueue["Loading Queue"]
    LoadingThread --> ChunkCacheManager["Chunk Cache Manager"]
    
    GenerationThread --> GenerationQueue["Generation Queue"]
    GenerationThread --> WorldGenerator["World Generator"]
    
    MeshingThread --> MeshingQueue["Meshing Queue"]
    MeshingThread --> MeshBuilder["Mesh Builder"]
    
    SavingThread --> SavingQueue["Saving Queue"]
    SavingThread --> ChunkSerializer["Chunk Serializer"]
    
    ChunkManager --> LoadingQueue
    ChunkManager --> GenerationQueue
    ChunkManager --> MeshingQueue
    ChunkManager --> SavingQueue
```

The threading model provides:
- **Parallel Processing**: Processing multiple chunks simultaneously
- **Task Prioritization**: Focusing processing power on important chunks
- **Work Stealing**: Balancing load across available threads
- **Thread Safety**: Ensuring thread-safe access to shared resources
- **Cancellation Support**: Ability to cancel ongoing tasks when priorities change
- **Progress Tracking**: Monitoring and reporting progress of background operations

## Chunk Events

The chunk system uses events to coordinate with other systems:

```mermaid
classDiagram
    class ChunkEventSystem {
        +void addEventListener(ChunkEventType type, ChunkEventListener* listener)
        +void removeEventListener(ChunkEventType type, ChunkEventListener* listener)
        +void dispatchEvent(ChunkEvent* event)
    }
    
    class ChunkEvent {
        +ChunkEventType type
        +ChunkCoord chunkCoord
        +TetrahedralChunk* chunk
        +void* userData
    }
    
    class ChunkEventListener {
        +virtual void onChunkEvent(ChunkEvent* event)
    }
    
    class EntityManager {
        +void onChunkLoaded(ChunkEvent* event)
        +void onChunkUnloaded(ChunkEvent* event)
    }
    
    class PhysicsSystem {
        +void onChunkLoaded(ChunkEvent* event)
        +void onChunkUnloaded(ChunkEvent* event)
    }
    
    class ChunkManager {
        -ChunkEventSystem* eventSystem
        +void fireChunkLoadedEvent(TetrahedralChunk* chunk)
        +void fireChunkUnloadedEvent(TetrahedralChunk* chunk)
    }
    
    ChunkEventSystem o-- ChunkEvent
    ChunkEventSystem o-- ChunkEventListener
    ChunkEventListener <|-- EntityManager
    ChunkEventListener <|-- PhysicsSystem
    ChunkManager --> ChunkEventSystem
```

Chunk events include:
- **Chunk Loaded**: Fired when a chunk is fully loaded and ready for use
- **Chunk Unloaded**: Fired when a chunk is about to be unloaded
- **Chunk Changed**: Fired when a chunk's content is significantly changed
- **Chunk Mesh Generated**: Fired when a chunk's mesh is generated or updated
- **Block Changed**: Fired when a block within a chunk is changed
- **Chunk Generation Progress**: Fired to report generation progress

## Level of Detail System

For distant chunks, a Level of Detail (LOD) system improves performance:

```mermaid
classDiagram
    class ChunkLODSystem {
        +std::map<ChunkCoord, ChunkLODData> lodData
        +void updateLOD(Vector3 playerPosition)
        +LODLevel getLODLevel(ChunkCoord coord)
        +void setLODParameters(LODParameters params)
        +void generateLODMesh(TetrahedralChunk* chunk, LODLevel level)
    }
    
    class ChunkLODData {
        +LODLevel currentLevel
        +std::vector<Mesh*> lodMeshes
        +float distanceToPlayer
        +void updateDistance(Vector3 playerPosition)
        +Mesh* getMeshForLevel(LODLevel level)
        +void freeMeshes()
    }
    
    class LODParameters {
        +float lodDistance1
        +float lodDistance2
        +float lodDistance3
        +bool enableLOD
        +float transitionDuration
        +bool generateColliders
    }
    
    class ChunkRenderer {
        +void renderChunks(std::vector<TetrahedralChunk*> chunks, Camera* camera)
        +void renderChunkLOD(TetrahedralChunk* chunk, LODLevel level)
    }
    
    ChunkLODSystem o-- ChunkLODData
    ChunkLODSystem --> LODParameters
    ChunkRenderer --> ChunkLODSystem
```

The LOD system provides:
- **Distance-Based Detail**: Reducing detail for distant chunks
- **Smooth Transitions**: Smooth transitions between LOD levels
- **Memory Efficiency**: Using less memory for distant chunks
- **Simplified Collision**: Simplified collision for distant chunks
- **Adaptive Detail**: Adjusting detail based on performance and view direction
- **Tetrahedral Preservation**: Maintaining tetrahedral appearance even at low detail

## Chunk Lighting

The lighting system is an important part of the chunk system:

```mermaid
classDiagram
    class ChunkLightingSystem {
        +void initializeLighting(TetrahedralChunk* chunk)
        +void propagateInitialSunlight(TetrahedralChunk* chunk)
        +void propagateLight(GlobalCoord position, LightType type, uint8_t intensity)
        +void removeLightSource(GlobalCoord position, LightType type)
        +void updateLighting(GlobalCoord position, int radius)
        +uint8_t getLightLevel(GlobalCoord position, LightType type)
    }
    
    class LightNode {
        +GlobalCoord position
        +LightType type
        +uint8_t intensity
    }
    
    class LightPropagationQueue {
        +std::queue<LightNode> queue
        +void enqueue(LightNode node)
        +LightNode dequeue()
        +bool isEmpty()
        +int size()
    }
    
    class LightRemovalQueue {
        +std::queue<LightNode> queue
        +void enqueue(LightNode node)
        +LightNode dequeue()
        +bool isEmpty()
        +int size()
    }
    
    ChunkLightingSystem --> LightPropagationQueue
    ChunkLightingSystem --> LightRemovalQueue
    LightPropagationQueue o-- LightNode
    LightRemovalQueue o-- LightNode
```

The lighting system includes:
- **Sunlight Propagation**: Downward propagation of sunlight
- **Blocklight Propagation**: Outward propagation from light-emitting blocks
- **Light Removal**: Removing light when blocks change
- **Incremental Updates**: Updating only affected areas when changes occur
- **Cross-Chunk Propagation**: Light propagation across chunk boundaries
- **Tetrahedral-Specific Adaptations**: Special handling for tetrahedral faces

## Performance Optimizations

The chunk system includes numerous performance optimizations:

```mermaid
graph TD
    subgraph "Chunk Optimizations"
        Culling["Culling Techniques"]
        Batching["Batching Strategies"]
        Caching["Caching Mechanisms"]
        LazyLoading["Lazy Loading"]
        DataStructures["Optimized Data Structures"]
    end
    
    Culling --> FrustumCulling["Frustum Culling"]
    Culling --> OcclusionCulling["Occlusion Culling"]
    Culling --> DetailCulling["Detail Culling"]
    
    Batching --> DrawCallBatching["Draw Call Batching"]
    Batching --> GeometryBatching["Geometry Batching"]
    Batching --> InstancingSupport["Instancing Support"]
    
    Caching --> BlockTypeCaching["Block Type Caching"]
    Caching --> MeshCaching["Mesh Caching"]
    Caching --> LightingCaching["Lighting Caching"]
    
    LazyLoading --> DeferredGeneration["Deferred Generation"]
    LazyLoading --> PrioritizedLoading["Prioritized Loading"]
    LazyLoading --> ProgressiveDetail["Progressive Detail"]
    
    DataStructures --> SpatialHashing["Spatial Hashing"]
    DataStructures --> QuadTrees["Quad Trees"]
    DataStructures --> ChunkOctrees["Chunk Octrees"]
```

Key optimizations include:
- **Culling Strategies**: Only processing visible chunks
- **Chunk Prioritization**: Focusing resources on important chunks
- **Memory Management**: Efficient handling of chunk memory
- **Render Batching**: Reducing draw calls through batching
- **Incremental Mesh Updates**: Updating only changed parts of meshes
- **Tetrahedral-Specific Optimizations**: Special optimizations for tetrahedral data

## Example: Chunk Creation and Access

Here's an example of how chunk creation and block access works in code:

```cpp
// Creating and initializing a new chunk
TetrahedralChunk* createChunk(ChunkCoord coord) {
    TetrahedralChunk* chunk = new TetrahedralChunk(coord);
    chunk->initialize();
    
    // Generate terrain for the chunk
    worldGenerator.generateTerrain(chunk);
    
    // Add structures and features
    worldGenerator.populateChunk(chunk);
    
    // Initialize lighting
    lightingSystem.initializeLighting(chunk);
    
    // Generate mesh
    chunk->generateMesh();
    
    return chunk;
}

// Setting a block in the world
void setBlockAt(Vector3 worldPosition, Block block) {
    // Convert world position to global coordinate
    GlobalCoord globalCoord = coordinateSystem.worldToGlobal(worldPosition);
    
    // Get the chunk coordinate
    ChunkCoord chunkCoord = globalCoord.toChunkCoord();
    
    // Get the local coordinate within the chunk
    LocalCoord localCoord = globalCoord.toLocalCoord();
    
    // Get or load the chunk
    TetrahedralChunk* chunk = chunkManager.getChunk(chunkCoord);
    if (!chunk) {
        chunk = chunkManager.loadChunk(chunkCoord);
    }
    
    // Set the block
    chunk->setBlock(localCoord, block);
    
    // Mark the chunk as modified
    chunk->markDirty();
    
    // Update lighting
    lightingSystem.updateLighting(globalCoord, 15);
    
    // Update neighboring chunks if the block is on a boundary
    if (localCoord.isOnBoundary()) {
        int face = localCoord.getBoundaryFace();
        ChunkCoord neighborCoord = chunkCoord.getNeighbor(face);
        TetrahedralChunk* neighbor = chunkManager.getChunk(neighborCoord);
        if (neighbor) {
            neighbor->markDirty();
        }
    }
}

// Getting a block from the world
Block getBlockAt(Vector3 worldPosition) {
    // Convert world position to global coordinate
    GlobalCoord globalCoord = coordinateSystem.worldToGlobal(worldPosition);
    
    // Get the chunk coordinate
    ChunkCoord chunkCoord = globalCoord.toChunkCoord();
    
    // Get the local coordinate within the chunk
    LocalCoord localCoord = globalCoord.toLocalCoord();
    
    // Get the chunk (return air if chunk not loaded)
    TetrahedralChunk* chunk = chunkManager.getChunk(chunkCoord);
    if (!chunk) {
        return Block::AIR;
    }
    
    // Return the block
    return chunk->getBlock(localCoord);
}
```

## Conclusion

The QuadCraft tetrahedral chunk system provides an efficient framework for managing the tetrahedral world. By adapting traditional voxel chunk techniques to tetrahedral space, the system maintains performance while supporting the unique geometric properties of QuadCraft's non-Euclidean world. Through careful design of coordinate systems, storage solutions, and processing pipelines, the chunk system enables smooth exploration and interaction with complex tetrahedral environments. 