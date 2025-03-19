# QuadCraft Technical Architecture

This document describes the technical architecture of QuadCraft, detailing the system components, their interactions, and design patterns used throughout the codebase.

## System Overview

QuadCraft is built using a modular architecture that separates core game functionality from rendering and input handling. This approach provides flexibility for future development and ensures clear separation of concerns.

```mermaid
graph TD
    subgraph "High-Level Architecture"
        Engine["Game Engine"]
        Renderer["Renderer"]
        Physics["Physics System"]
        Input["Input Handler"]
        World["World System"]
        Entity["Entity System"]
        UI["User Interface"]
    end
    
    Engine --> Renderer
    Engine --> Physics
    Engine --> Input
    Engine --> World
    Engine --> Entity
    Engine --> UI
    
    World --> Entity
    Input --> Engine
    Physics --> Entity
    Renderer --> World
    Renderer --> Entity
    Renderer --> UI
```

## Directory Structure

The codebase is organized into the following directory structure:

```mermaid
graph TD
    Root["Root (/)"] --> Src["src/"]
    Root --> Build["build/"]
    Root --> Assets["assets/"]
    Root --> Docs["docs/"]
    Root --> Tests["tests/"]
    
    Src --> Core["core/"]
    Src --> Game["game/"]
    Src --> Render["render/"]
    Src --> Physics["physics/"]
    Src --> UI["ui/"]
    Src --> Utils["utils/"]
    
    Core --> Entity["entity/"]
    Core --> Coordinate["coordinate/"]
    Core --> Math["math/"]
    Core --> Memory["memory/"]
    
    Game --> World["world/"]
    Game --> Block["block/"]
    Game --> Input["input/"]
    Game --> Player["player/"]
    
    Render --> Shader["shader/"]
    Render --> Mesh["mesh/"]
    Render --> Texture["texture/"]
    Render --> Camera["camera/"]
    
    Physics --> Collision["collision/"]
    Physics --> Tetrahedral["tetrahedral/"]
    
    UI --> HUD["hud/"]
    UI --> Menu["menu/"]
    UI --> Debug["debug/"]
```

## Core Systems

### Coordinate System

QuadCraft uses two coordinate systems: traditional Cartesian coordinates for rendering and physics, and Quadray coordinates for the tetrahedral world representation.

```mermaid
classDiagram
    class Vector3 {
        +float x
        +float y
        +float z
        +Vector3(float x, float y, float z)
        +Vector3 operator+(Vector3)
        +Vector3 operator-(Vector3)
        +Vector3 operator*(float)
        +Vector3 operator/(float)
        +float dot(Vector3)
        +Vector3 cross(Vector3)
        +float length()
        +Vector3 normalize()
    }
    
    class Quadray {
        +float a
        +float b
        +float c
        +float d
        +Quadray(float a, float b, float c, float d)
        +Quadray fromCartesian(Vector3)
        +Vector3 toCartesian()
        +Quadray normalize()
        +float distance(Quadray)
    }
    
    class CoordinateConverter {
        +Vector3 quadrayToCartesian(Quadray)
        +Quadray cartesianToQuadray(Vector3)
        +Vector3 normalizeDirection(Vector3)
        +Quadray normalizeQuadray(Quadray)
    }
    
    Vector3 <-- CoordinateConverter
    Quadray <-- CoordinateConverter
```

### Entity System

The entity system manages all dynamic objects in the game world.

```mermaid
classDiagram
    class Entity {
        +Vector3 position
        +Vector3 rotation
        +Vector3 scale
        +uint32_t id
        +bool active
        +update(float deltaTime)
        +render()
    }
    
    class Camera {
        +Vector3 position
        +Vector3 front
        +Vector3 up
        +Vector3 right
        +float yaw
        +float pitch
        +float zoom
        +updateCameraVectors()
        +getViewMatrix()
        +processKeyboard(CameraMovement, float deltaTime)
        +processMouseMovement(float xOffset, float yOffset)
    }
    
    class Player {
        +Camera camera
        +float movementSpeed
        +float mouseSensitivity
        +Quadray quadrayPosition
        +update(float deltaTime)
        +processInput(float deltaTime)
        +updateQuadrayPosition()
    }
    
    class EntityManager {
        +std::vector<Entity*> entities
        +addEntity(Entity*)
        +removeEntity(uint32_t id)
        +getEntity(uint32_t id)
        +updateAll(float deltaTime)
        +renderAll()
    }
    
    Entity <|-- Camera
    Entity <|-- Player
    Entity --> EntityManager
```

### Rendering System

The rendering system handles all graphical output.

```mermaid
classDiagram
    class Shader {
        +uint32_t ID
        +Shader(const char* vertexPath, const char* fragmentPath)
        +use()
        +setBool(const std::string &name, bool value)
        +setInt(const std::string &name, int value)
        +setFloat(const std::string &name, float value)
        +setVec3(const std::string &name, Vector3 value)
        +setMat4(const std::string &name, glm::mat4 value)
    }
    
    class Mesh {
        +std::vector<Vertex> vertices
        +std::vector<uint32_t> indices
        +Texture texture
        +VAO, VBO, EBO
        +setupMesh()
        +render(Shader shader)
    }
    
    class Texture {
        +uint32_t ID
        +loadFromFile(const char* path)
        +bind(uint32_t unit)
    }
    
    class Renderer {
        +std::vector<Mesh*> meshes
        +Camera* activeCamera
        +Shader* activeShader
        +initialize()
        +addMesh(Mesh*)
        +setActiveCamera(Camera*)
        +setActiveShader(Shader*)
        +render()
        +clear()
    }
    
    class TetrahedralMeshGenerator {
        +Mesh generateTetrahedron(Vector3 v1, Vector3 v2, Vector3 v3, Vector3 v4)
        +Mesh generateFromBlock(Block* block)
        +std::vector<Vertex> calculateVertices(Block* block)
        +std::vector<uint32_t> calculateIndices(Block* block)
    }
    
    Mesh --> Shader
    Mesh --> Texture
    Renderer --> Mesh
    Renderer --> Camera
    Renderer --> Shader
    TetrahedralMeshGenerator --> Mesh
```

### World System

The world system manages the tetrahedral blocks and world generation.

```mermaid
classDiagram
    class Block {
        +BlockType type
        +Quadray position
        +bool active
        +Material material
        +Block(BlockType type, Quadray position)
        +getVertices()
        +getFaces()
    }
    
    class Chunk {
        +std::vector<Block*> blocks
        +Quadray position
        +bool modified
        +Mesh* mesh
        +addBlock(Block*)
        +removeBlock(Quadray position)
        +getBlock(Quadray position)
        +generateMesh()
        +update()
        +render(Shader shader)
    }
    
    class World {
        +std::map<ChunkCoord, Chunk*> chunks
        +Player* player
        +WorldGenerator generator
        +initialize()
        +update(float deltaTime)
        +render()
        +getBlock(Quadray position)
        +setBlock(Quadray position, BlockType type)
        +removeBlock(Quadray position)
        +getChunk(ChunkCoord coord)
        +generateChunk(ChunkCoord coord)
    }
    
    class WorldGenerator {
        +generateChunk(ChunkCoord coord)
        +generateTerrainForChunk(Chunk* chunk)
        +generateStructures(Chunk* chunk)
        +float getNoise(float x, float y, float z)
    }
    
    Block <-- Chunk
    Chunk <-- World
    World --> WorldGenerator
```

### Physics System

The physics system handles collision detection and response in tetrahedral space.

```mermaid
classDiagram
    class Collider {
        +ColliderType type
        +bool isActive
        +checkCollision(Collider* other)
    }
    
    class TetrahedralCollider {
        +std::vector<Vector3> vertices
        +bool pointInside(Vector3 point)
        +bool rayIntersect(Ray ray, float& distance)
    }
    
    class PhysicsSystem {
        +std::vector<Collider*> colliders
        +World* world
        +addCollider(Collider*)
        +removeCollider(Collider*)
        +update(float deltaTime)
        +raycast(Ray ray, RaycastResult& result)
        +moveWithCollision(Entity* entity, Vector3 movement)
    }
    
    class RaycastResult {
        +bool hit
        +float distance
        +Vector3 hitPoint
        +Vector3 hitNormal
        +Block* hitBlock
    }
    
    Collider <|-- TetrahedralCollider
    PhysicsSystem --> Collider
    PhysicsSystem --> RaycastResult
```

### Input System

The input system handles user interaction with the game.

```mermaid
classDiagram
    class InputManager {
        +static InputManager* instance
        +bool keys[1024]
        +float lastX, lastY
        +bool firstMouse
        +float deltaTime
        +static InputManager* getInstance()
        +processKeyboard(int key, int action)
        +processMouseMovement(float xPos, float yPos)
        +processMouseButton(int button, int action)
        +isKeyPressed(int key)
        +getMousePosition()
        +getDeltaTime()
        +update(float currentTime)
    }
    
    class Input {
        +InputManager* inputManager
        +Camera* camera
        +processInput(float deltaTime)
        +processKeyInput(float deltaTime)
        +processMouseInput()
        +raycast()
    }
    
    Input --> InputManager
    Input --> Camera
```

### UI System

The UI system manages all user interface elements.

```mermaid
classDiagram
    class UIElement {
        +Vector2 position
        +Vector2 size
        +bool active
        +render()
        +update(float deltaTime)
        +isPointInside(float x, float y)
    }
    
    class Text {
        +std::string content
        +Font* font
        +float scale
        +render()
    }
    
    class Button {
        +std::string label
        +Callback onClick
        +bool isPressed
        +render()
        +handleClick(float x, float y)
    }
    
    class HUD {
        +std::vector<UIElement*> elements
        +Player* player
        +render()
        +update(float deltaTime)
        +addElement(UIElement*)
        +removeElement(UIElement*)
    }
    
    class UIManager {
        +HUD* hud
        +Menu* currentMenu
        +initialize()
        +render()
        +update(float deltaTime)
        +showMenu(MenuType type)
        +hideMenu()
        +isMenuActive()
    }
    
    UIElement <|-- Text
    UIElement <|-- Button
    HUD --> UIElement
    UIManager --> HUD
```

## Data Flow

The following diagram illustrates the main data flow in the QuadCraft engine:

```mermaid
sequenceDiagram
    participant Game Loop
    participant Input Manager
    participant Player
    participant Physics
    participant World
    participant Renderer
    
    Game Loop->>Input Manager: Process inputs
    Input Manager->>Player: Update player state
    Player->>Physics: Apply movement
    Physics->>World: Check collisions
    World->>Player: Adjust position if needed
    Player->>World: Interact with blocks
    World->>World: Update chunks
    Game Loop->>World: Update world state
    Game Loop->>Renderer: Render frame
    Renderer->>World: Get visible chunks
    World->>Renderer: Return chunk meshes
    Renderer->>Game Loop: Frame complete
```

## Initialization Sequence

The application initialization sequence follows this order:

```mermaid
sequenceDiagram
    participant Main
    participant Game
    participant Window
    participant Renderer
    participant Input
    participant World
    participant Player
    participant UI
    
    Main->>Game: Initialize game
    Game->>Window: Create window
    Window->>Game: Window created
    Game->>Renderer: Initialize renderer
    Renderer->>Game: Renderer initialized
    Game->>Input: Initialize input manager
    Input->>Game: Input manager initialized
    Game->>World: Initialize world
    World->>Game: World initialized
    Game->>Player: Create player
    Player->>Game: Player created
    Game->>UI: Initialize UI
    UI->>Game: UI initialized
    Game->>Main: Game initialized
    Main->>Game: Start game loop
```

## Rendering Pipeline

The rendering pipeline processes tetrahedral elements for display:

```mermaid
graph TD
    subgraph "Rendering Pipeline"
        FrustumCulling["Frustum Culling"]
        ChunkMeshing["Chunk Meshing"]
        TetrahedralProcessing["Tetrahedral Processing"]
        ShaderApplication["Shader Application"]
        PostProcessing["Post Processing"]
        UIRendering["UI Rendering"]
    end
    
    FrustumCulling --> ChunkMeshing
    ChunkMeshing --> TetrahedralProcessing
    TetrahedralProcessing --> ShaderApplication
    ShaderApplication --> PostProcessing
    PostProcessing --> UIRendering
```

## Entity Component System

QuadCraft uses an Entity Component System for managing game objects:

```mermaid
classDiagram
    class Entity {
        +uint32_t id
        +bool active
        +addComponent(Component*)
        +removeComponent(ComponentType)
        +getComponent(ComponentType)
    }
    
    class Component {
        +ComponentType type
        +Entity* owner
        +initialize()
        +update(float deltaTime)
    }
    
    class TransformComponent {
        +Vector3 position
        +Vector3 rotation
        +Vector3 scale
        +update(float deltaTime)
    }
    
    class RenderComponent {
        +Mesh* mesh
        +Material material
        +bool visible
        +render(Shader* shader)
    }
    
    class PhysicsComponent {
        +Collider* collider
        +Vector3 velocity
        +float mass
        +bool useGravity
        +applyForce(Vector3 force)
        +update(float deltaTime)
    }
    
    class System {
        +std::vector<Entity*> entities
        +update(float deltaTime)
        +addEntity(Entity*)
        +removeEntity(Entity*)
    }
    
    class RenderSystem {
        +update(float deltaTime)
        +render()
    }
    
    class PhysicsSystem {
        +update(float deltaTime)
        +resolveCollisions()
    }
    
    Entity --> Component
    Component <|-- TransformComponent
    Component <|-- RenderComponent
    Component <|-- PhysicsComponent
    System <|-- RenderSystem
    System <|-- PhysicsSystem
    System --> Entity
```

## Optimization Techniques

QuadCraft implements several optimization techniques:

```mermaid
graph TD
    subgraph "Optimization Techniques"
        ChunkCulling["Chunk Culling"]
        LazyLoading["Lazy Chunk Loading"]
        MeshCaching["Mesh Caching"]
        LOD["Level of Detail"]
        Instancing["Instancing for Similar Tetrahedra"]
    end
    
    ChunkCulling --> Visibility["Only render visible chunks"]
    LazyLoading --> Memory["Reduce memory usage"]
    MeshCaching --> Performance["Avoid regenerating unchanged meshes"]
    LOD --> Distance["Simplify distant tetrahedra"]
    Instancing --> DrawCalls["Reduce draw calls"]
```

## Memory Management

QuadCraft uses these memory management strategies:

```mermaid
graph TD
    subgraph "Memory Management"
        Pooling["Object Pooling"]
        ChunkStreaming["Chunk Streaming"]
        ResourceCache["Resource Caching"]
        GarbageCollection["Garbage Collection"]
    end
    
    Pooling --> Reuse["Reuse common objects"]
    ChunkStreaming --> LoadUnload["Load/unload chunks based on distance"]
    ResourceCache --> Sharing["Share resources between objects"]
    GarbageCollection --> Cleanup["Clean up unused resources"]
```

## Concurrency Model

QuadCraft uses a multi-threaded approach for performance:

```mermaid
graph TD
    subgraph "Threading Model"
        MainThread["Main Thread (Rendering + Input)"]
        WorldGeneration["World Generation Thread"]
        Physics["Physics Thread"]
        MeshGeneration["Mesh Generation Thread"]
        Loading["Resource Loading Thread"]
    end
    
    MainThread --> GameLoop["Game Loop"]
    WorldGeneration --> ChunkGeneration["Generate Chunks"]
    Physics --> Collisions["Physics Calculations"]
    MeshGeneration --> Meshes["Generate Meshes"]
    Loading --> Resources["Load Resources"]
```

## Serialization System

The game uses a serialization system for saving and loading:

```mermaid
classDiagram
    class Serializable {
        +serialize(Serializer* serializer)
        +deserialize(Deserializer* deserializer)
    }
    
    class Serializer {
        +writeInt(int value)
        +writeFloat(float value)
        +writeString(std::string value)
        +writeVector3(Vector3 value)
        +writeQuadray(Quadray value)
        +beginObject(std::string name)
        +endObject()
        +beginArray(std::string name, int size)
        +endArray()
    }
    
    class Deserializer {
        +readInt()
        +readFloat()
        +readString()
        +readVector3()
        +readQuadray()
        +beginObject(std::string name)
        +endObject()
        +beginArray(std::string name)
        +endArray()
        +hasMoreElements()
    }
    
    class SaveSystem {
        +saveWorld(World* world, std::string filename)
        +loadWorld(std::string filename, World* world)
        +savePlayer(Player* player, std::string filename)
        +loadPlayer(std::string filename, Player* player)
    }
    
    Serializable <|-- Block
    Serializable <|-- Chunk
    Serializable <|-- Player
    SaveSystem --> Serializer
    SaveSystem --> Deserializer
```

## Configuration System

QuadCraft uses a robust configuration system:

```mermaid
classDiagram
    class Config {
        +static Config* instance
        +std::map<std::string, ConfigValue> values
        +static Config* getInstance()
        +load(std::string filename)
        +save(std::string filename)
        +getInt(std::string key, int defaultValue)
        +getFloat(std::string key, float defaultValue)
        +getString(std::string key, std::string defaultValue)
        +getBool(std::string key, bool defaultValue)
        +set(std::string key, ConfigValue value)
    }
    
    class ConfigValue {
        +ValueType type
        +union { int intValue; float floatValue; bool boolValue; }
        +std::string stringValue
        +ConfigValue(int value)
        +ConfigValue(float value)
        +ConfigValue(bool value)
        +ConfigValue(std::string value)
    }
    
    Config -- ConfigValue
```

## Event System

QuadCraft uses an event-driven architecture:

```mermaid
classDiagram
    class Event {
        +EventType type
        +timestamp
    }
    
    class InputEvent {
        +InputType inputType
        +int keyCode
        +float x
        +float y
    }
    
    class BlockEvent {
        +Quadray position
        +BlockType type
        +BlockEventType eventType
    }
    
    class EventListener {
        +handleEvent(Event* event)
    }
    
    class EventManager {
        +static EventManager* instance
        +std::map<EventType, std::vector<EventListener*>> listeners
        +static EventManager* getInstance()
        +addEventListener(EventType type, EventListener* listener)
        +removeEventListener(EventType type, EventListener* listener)
        +dispatchEvent(Event* event)
    }
    
    Event <|-- InputEvent
    Event <|-- BlockEvent
    EventManager --> Event
    EventManager --> EventListener
```

## Asset Management

The asset management system handles game resources:

```mermaid
classDiagram
    class Asset {
        +std::string name
        +AssetType type
        +bool loaded
        +load()
        +unload()
    }
    
    class TextureAsset {
        +uint32_t textureID
        +int width
        +int height
        +load()
        +unload()
    }
    
    class ShaderAsset {
        +uint32_t shaderID
        +std::string vertexSource
        +std::string fragmentSource
        +load()
        +unload()
    }
    
    class AssetManager {
        +std::map<std::string, Asset*> assets
        +loadAsset(std::string path, AssetType type)
        +getAsset(std::string name)
        +unloadAsset(std::string name)
        +unloadUnused()
    }
    
    Asset <|-- TextureAsset
    Asset <|-- ShaderAsset
    AssetManager --> Asset
```

## Debugging Tools

QuadCraft includes several debugging tools:

```mermaid
graph TD
    subgraph "Debugging Tools"
        Logger["Logger System"]
        DebugRenderer["Debug Renderer"]
        Profiler["Performance Profiler"]
        Console["In-Game Console"]
    end
    
    Logger --> LogLevels["Multiple Log Levels"]
    DebugRenderer --> Wireframe["Wireframe Mode"]
    DebugRenderer --> Overlays["Debug Overlays"]
    Profiler --> Timers["Performance Timers"]
    Console --> Commands["Execute Commands"]
```

## Build System

QuadCraft uses CMake as its build system:

```mermaid
graph TD
    subgraph "Build System"
        CMake["CMake"]
        Dependencies["External Dependencies"]
        BuildTypes["Build Types"]
        Testing["Testing"]
    end
    
    CMake --> CrossPlatform["Cross-Platform Support"]
    Dependencies --> ThirdParty["Third-Party Libraries"]
    BuildTypes --> Debug["Debug Build"]
    BuildTypes --> Release["Release Build"]
    Testing --> UnitTests["Unit Tests"]
```

## Conclusion

QuadCraft's architecture is designed to support the unique requirements of tetrahedral geometry while maintaining performance and flexibility. The separation of concerns between different systems allows for easier maintenance and future expansion of the codebase. 