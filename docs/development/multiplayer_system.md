# QuadCraft Multiplayer System

This document details the multiplayer and networking architecture of QuadCraft, explaining how the game synchronizes players, blocks, and entities across a network while adapting to the unique challenges of a tetrahedral world.

## Networking Overview

QuadCraft's multiplayer system is designed to provide a seamless and responsive experience in a shared tetrahedral world. The architecture balances between authority distribution, bandwidth efficiency, and latency compensation.

```mermaid
graph TD
    subgraph "Multiplayer Architecture"
        ClientServer["Client-Server Model"]
        Authority["Authority Model"]
        Synchronization["Synchronization"]
        Optimization["Network Optimization"]
    end
    
    ClientServer --> Servers["Dedicated Servers"]
    ClientServer --> Clients["Game Clients"]
    ClientServer --> P2P["Peer-to-Peer Support"]
    
    Authority --> ServerAuthority["Server Authority"]
    Authority --> ClientPrediction["Client Prediction"]
    Authority --> HybridAuthority["Hybrid Authority"]
    
    Synchronization --> EntitySync["Entity Synchronization"]
    Synchronization --> ChunkSync["Chunk Synchronization"]
    Synchronization --> EventSync["Event Synchronization"]
    
    Optimization --> Compression["Data Compression"]
    Optimization --> Prioritization["Transmission Prioritization"]
    Optimization --> Batching["Update Batching"]
```

## Network Architecture

QuadCraft primarily employs a client-server architecture with options for peer-to-peer connectivity for smaller worlds:

```mermaid
classDiagram
    class NetworkManager {
        +ConnectionMode mode
        +int protocolVersion
        +NetworkHost* host
        +ConnectionConfig config
        +void initialize(ConnectionMode mode)
        +void connect(std::string address, int port)
        +void disconnect()
        +void update(float deltaTime)
        +void sendPacket(Packet* packet, DeliveryMethod method)
        +void registerPacketHandler(PacketType type, PacketHandler* handler)
        +void setCompression(bool enabled, int threshold)
    }
    
    class NetworkHost {
        +bool isServer
        +std::vector<NetworkPeer*> peers
        +void start(int port)
        +void stop()
        +void poll()
        +NetworkPeer* connectTo(std::string address, int port)
        +void broadcastPacket(Packet* packet, DeliveryMethod method)
        +void disconnectPeer(NetworkPeer* peer, std::string reason)
    }
    
    class NetworkPeer {
        +uint64_t id
        +std::string address
        +ConnectionState state
        +float roundTripTime
        +int packetLoss
        +void sendPacket(Packet* packet, DeliveryMethod method)
        +void disconnect(std::string reason)
        +bool isConnected()
        +void updateStats()
    }
    
    class Packet {
        +PacketType type
        +uint32_t sequence
        +void* data
        +size_t dataSize
        +bool reliable
        +void serialize(ByteBuffer* buffer)
        +void deserialize(ByteBuffer* buffer)
    }
    
    NetworkManager o-- NetworkHost
    NetworkHost o-- NetworkPeer
    NetworkManager --> Packet
```

### Connection Phases

The multiplayer connection follows distinct phases to establish and maintain communication:

```mermaid
sequenceDiagram
    participant Client
    participant Server
    
    Client->>Server: Connection Request
    Server->>Client: Connection Challenge
    Client->>Server: Challenge Response
    Server->>Client: Connection Accepted
    
    Server->>Client: Initial World Data
    Client->>Server: Player Info
    Server->>Client: Player ID Assignment
    
    loop Game Session
        Client->>Server: Player Input
        Server->>Client: World State Updates
        Client->>Server: Block Modifications
        Server->>Client: Entity Updates
    end
    
    Client->>Server: Disconnect Notification
    Server->>Client: Disconnect Acknowledgment
```

## Tetrahedral Synchronization Challenges

The tetrahedral nature of QuadCraft presents unique networking challenges:

```mermaid
graph TD
    subgraph "Tetrahedral Networking Challenges"
        Orientation["Orientation Complexity"]
        WorldSize["Larger World Size"]
        Navigation["Navigation Complexity"]
        Boundaries["Boundary Transitions"]
    end
    
    Orientation --> RotationEncoding["Rotation Encoding"]
    Orientation --> OrientationInterpolation["Orientation Interpolation"]
    
    WorldSize --> ChunkOptimization["Chunk Optimization"]
    WorldSize --> ProgressiveLoading["Progressive Loading"]
    
    Navigation --> PathSynchronization["Path Synchronization"]
    Navigation --> MovementPrediction["Movement Prediction"]
    
    Boundaries --> SeamlessTransitions["Seamless Transitions"]
    Boundaries --> CrossChunkInteraction["Cross-Chunk Interaction"]
```

Solutions to these challenges include:

- **Quaternion Compression**: Specialized compression for tetrahedral orientations
- **Tetrahedral-Aware Delta Compression**: Encoding only changes with tetrahedral relevance
- **Orientation-Preserving Interpolation**: Ensuring smooth transitions between networked states
- **Progressive Tetrahedral Chunk Loading**: Prioritizing chunks based on tetrahedral visibility
- **Tetrahedral Path Prediction**: Specialized algorithms for predicting movement in tetrahedral space

## Packet Types and Structure

QuadCraft uses a variety of packet types to handle different aspects of synchronization:

```mermaid
classDiagram
    class BasePacket {
        +PacketType type
        +uint32_t sequence
        +void serialize(ByteBuffer* buffer)
        +void deserialize(ByteBuffer* buffer)
    }
    
    class LoginPacket {
        +std::string username
        +std::string authToken
        +uint32_t protocolVersion
        +std::vector<std::string> mods
    }
    
    class WorldDataPacket {
        +int32_t worldSeed
        +WorldSettings settings
        +std::vector<BiomeData> biomes
        +TetrahedralWorldInfo worldInfo
    }
    
    class ChunkDataPacket {
        +ChunkCoord coord
        +uint8_t compressionLevel
        +std::vector<uint8_t> compressedData
        +bool isInitial
        +uint64_t revision
    }
    
    class EntityUpdatePacket {
        +uint32_t entityCount
        +std::vector<EntityData> entities
        +uint64_t worldTick
        +bool fullUpdate
    }
    
    class PlayerInputPacket {
        +Vector3 movement
        +float yaw
        +float pitch
        +uint32_t actions
        +uint64_t inputSequence
        +uint64_t lastAcknowledgedTick
    }
    
    class BlockUpdatePacket {
        +std::vector<BlockChangeData> changes
        +uint64_t updateId
        +bool reliable
    }
    
    BasePacket <|-- LoginPacket
    BasePacket <|-- WorldDataPacket
    BasePacket <|-- ChunkDataPacket
    BasePacket <|-- EntityUpdatePacket
    BasePacket <|-- PlayerInputPacket
    BasePacket <|-- BlockUpdatePacket
```

## Authority Model

QuadCraft uses a hybrid authority model to balance responsiveness with consistency:

```mermaid
graph LR
    subgraph "Authority Distribution"
        ServerAuth["Server Authority"]
        ClientAuth["Client Authority"]
    end
    
    ServerAuth --> WorldGeneration["World Generation"]
    ServerAuth --> EntityAI["Entity AI"]
    ServerAuth --> Physics["Physics Simulation"]
    ServerAuth --> Inventory["Inventory Management"]
    
    ClientAuth --> PlayerInput["Player Input"]
    ClientAuth --> LocalPrediction["Local Prediction"]
    ClientAuth --> UI["User Interface"]
    ClientAuth --> ClientEffects["Client Effects"]
```

### Client-Side Prediction

To maintain responsiveness despite network latency, QuadCraft implements client-side prediction:

```mermaid
sequenceDiagram
    participant Client
    participant Server
    
    note over Client: Player initiates movement
    Client->>Client: Apply input locally
    Client->>Client: Predict new position
    Client->>Server: Send input (seq=1)
    
    note over Client: Continue movement prediction
    Client->>Client: Apply input locally
    Client->>Client: Predict new position
    Client->>Server: Send input (seq=2)
    
    Server->>Server: Process input (seq=1)
    Server->>Server: Update authoritative state
    Server->>Client: State update (ack=1)
    
    note over Client: Reconciliation
    Client->>Client: Compare prediction with server state
    Client->>Client: Correct if necessary
    
    Server->>Server: Process input (seq=2)
    Server->>Server: Update authoritative state
    Server->>Client: State update (ack=2)
```

## Entity Synchronization

Entities in QuadCraft are synchronized using a component-based approach:

```mermaid
classDiagram
    class NetworkEntitySystem {
        +std::map<uint64_t, NetworkEntityData> networkEntities
        +void registerNetworkedComponent(ComponentType type)
        +void update(float deltaTime)
        +void synchronizeEntity(Entity* entity)
        +void processEntityUpdates(EntityUpdatePacket* packet)
        +void interpolateEntities(float alpha)
    }
    
    class NetworkEntityData {
        +uint64_t networkId
        +Entity* localEntity
        +std::map<ComponentType, NetworkComponentData> components
        +bool isOwned
        +float lastUpdateTime
        +std::vector<StateSnapshot> stateHistory
        +void applyUpdate(EntityData update)
        +EntityData createUpdate(bool fullUpdate)
    }
    
    class NetworkComponentData {
        +ComponentType type
        +bool dirty
        +float priority
        +std::vector<uint8_t> lastSentData
        +void markDirty()
        +float calculatePriority()
        +bool serializeComponent(ByteBuffer* buffer)
        +bool deserializeComponent(ByteBuffer* buffer)
    }
    
    class TetrahedralTransformNetData {
        +Quadray lastPosition
        +TetrahedralRotation lastRotation
        +float positionThreshold
        +float rotationThreshold
        +bool needsUpdate(TetrahedralTransformComponent* component)
    }
    
    NetworkEntitySystem o-- NetworkEntityData
    NetworkEntityData o-- NetworkComponentData
    NetworkComponentData <|-- TetrahedralTransformNetData
```

### Entity Interpolation

To ensure smooth movement despite network jitter, entities are interpolated between received states:

```cpp
// Entity interpolation in tetrahedral space
void interpolateEntityPosition(
    Entity* entity,
    const StateSnapshot& from,
    const StateSnapshot& to,
    float alpha) {
    
    // Get the transform component
    TetrahedralTransformComponent* transform = 
        entity->getComponent<TetrahedralTransformComponent>();
    
    // Skip interpolation if component not found
    if (!transform) return;
    
    // Handle special case where entity crosses tetrahedron boundaries
    if (from.tetrahedronId != to.tetrahedronId) {
        // If we're more than halfway through the interpolation,
        // switch to the destination tetrahedron
        if (alpha > 0.5f) {
            transform->setTetrahedron(to.tetrahedronId);
            
            // Adjust alpha for remaining interpolation
            float adjustedAlpha = (alpha - 0.5f) * 2.0f;
            
            // Interpolate within destination tetrahedron
            Quadray interpolatedPos = quadrayLerp(
                to.entryPosition, to.position, adjustedAlpha);
            transform->setPosition(interpolatedPos);
        } else {
            // Stay in original tetrahedron for first half
            transform->setTetrahedron(from.tetrahedronId);
            
            // Adjust alpha for first half interpolation
            float adjustedAlpha = alpha * 2.0f;
            
            // Interpolate toward exit point
            Quadray interpolatedPos = quadrayLerp(
                from.position, from.exitPosition, adjustedAlpha);
            transform->setPosition(interpolatedPos);
        }
    } else {
        // Standard interpolation within same tetrahedron
        Quadray interpolatedPos = quadrayLerp(from.position, to.position, alpha);
        transform->setPosition(interpolatedPos);
    }
    
    // Interpolate rotation (using specialized tetrahedral rotation interpolation)
    TetrahedralRotation interpolatedRot = interpolateTetraRotation(
        from.rotation, to.rotation, alpha);
    transform->setRotation(interpolatedRot);
}
```

## Chunk Synchronization

The chunk synchronization system prioritizes which chunks to send based on player proximity and visibility:

```mermaid
classDiagram
    class ChunkSyncManager {
        +std::map<ChunkCoord, ChunkSyncData> syncedChunks
        +int maxConcurrentTransfers
        +int compressionLevel
        +void updatePlayerPosition(NetworkPeer* peer, Vector3 position)
        +void queueChunksAroundPlayer(NetworkPeer* peer, ChunkCoord center)
        +void handleChunkRequest(NetworkPeer* peer, ChunkRequestPacket* packet)
        +void sendPendingChunks()
        +void prioritizeChunks()
    }
    
    class ChunkSyncData {
        +ChunkCoord coord
        +uint64_t revision
        +std::map<uint64_t, PeerChunkState> peerStates
        +bool isDirty
        +void markDirty()
        +std::vector<NetworkPeer*> getPeersNeedingUpdate()
        +ChunkDataPacket* createChunkPacket()
    }
    
    class PeerChunkState {
        +uint64_t lastSentRevision
        +ChunkSendState state
        +float priority
        +float lastSentTime
        +bool needsFullUpdate()
        +void updatePriority(Vector3 playerPosition)
    }
    
    class TetrahedralChunkOptimizer {
        +void optimizeChunkForNetwork(TetrahedralChunk* chunk, ByteBuffer* output)
        +void compressTetrahedralData(const std::vector<uint8_t>& input, std::vector<uint8_t>& output)
        +void applyTetrahedralDeltaCompression(ByteBuffer* output, TetrahedralChunk* current, TetrahedralChunk* baseline)
    }
    
    ChunkSyncManager o-- ChunkSyncData
    ChunkSyncData o-- PeerChunkState
    ChunkSyncManager --> TetrahedralChunkOptimizer
```

### Progressive Chunk Loading

To optimize bandwidth and prioritize relevant information, chunks are loaded progressively:

```mermaid
graph TD
    subgraph "Progressive Loading Strategy"
        ViewPosition["Player View Position"]
        FrustumCalculation["View Frustum Calculation"]
        DistanceCalculation["Distance Calculation"]
        VisibilityCheck["Visibility Check"]
    end
    
    ViewPosition --> TetrahedralFrustum["Tetrahedral Frustum"]
    ViewPosition --> PositionInChunk["Position in Chunk Grid"]
    
    TetrahedralFrustum --> FrustumCalculation
    PositionInChunk --> SphericalLayer["Spherical Layer Calculation"]
    
    SphericalLayer --> ChunkDistance["Chunk Distance Score"]
    FrustumCalculation --> InFrustumScore["In-Frustum Score"]
    
    ChunkDistance --> PriorityScore["Final Priority Score"]
    InFrustumScore --> PriorityScore
    
    PriorityScore --> TransmissionQueue["Transmission Queue"]
    TransmissionQueue --> BandwidthAllocation["Bandwidth Allocation"]
```

```cpp
// Calculate transmission priority for a chunk
float calculateChunkPriority(
    ChunkCoord chunkCoord,
    Vector3 playerPosition,
    Vector3 playerDirection,
    float playerFOV) {
    
    // Convert player position to chunk space
    ChunkCoord playerChunk = worldToChunkCoord(playerPosition);
    
    // Calculate Manhattan distance in chunk coordinates
    int distX = abs(chunkCoord.x - playerChunk.x);
    int distY = abs(chunkCoord.y - playerChunk.y);
    int distZ = abs(chunkCoord.z - playerChunk.z);
    
    // Calculate direct distance
    float chunkSize = getChunkSize();
    Vector3 chunkCenter = getChunkCenterPosition(chunkCoord);
    float directDistance = distance(playerPosition, chunkCenter);
    
    // Base priority inversely proportional to distance
    float priority = 1000.0f / (1.0f + directDistance);
    
    // Adjust for tetrahedral visibility - chunks in view direction get higher priority
    Vector3 toChunk = normalize(chunkCenter - playerPosition);
    float dotProduct = dot(playerDirection, toChunk);
    
    // Boost priority if chunk is in view direction
    if (dotProduct > cos(playerFOV * 0.5f)) {
        priority *= 2.0f + dotProduct;
    }
    
    // Special case for the chunk the player is in and neighbors
    if (distX <= 1 && distY <= 1 && distZ <= 1) {
        priority *= 10.0f;
    }
    
    // Adjust based on tetrahedral importance
    priority *= getTetrahedralImportanceFactor(chunkCoord, playerPosition);
    
    return priority;
}
```

## Block Updates

Block changes in the tetrahedral world are synchronized efficiently:

```mermaid
classDiagram
    class BlockUpdateSystem {
        +std::queue<BlockChangeEvent> pendingUpdates
        +int maxUpdatesPerPacket
        +float updateInterval
        +uint64_t nextUpdateId
        +void queueBlockUpdate(GlobalCoord coord, Block newBlock, Block oldBlock)
        +void sendPendingUpdates()
        +void handleRemoteBlockUpdate(BlockUpdatePacket* packet)
        +void applyBlockUpdate(GlobalCoord coord, Block block, bool remote)
    }
    
    class BlockChangeEvent {
        +GlobalCoord coord
        +Block newBlock
        +Block oldBlock
        +uint64_t timestamp
        +uint64_t playerId
        +bool isRemote
    }
    
    class BlockUpdatePacket {
        +uint32_t updateCount
        +std::vector<BlockChange> changes
        +uint64_t updateId
        +bool reliable
    }
    
    class TetrahedralBlockChange {
        +GlobalCoord coord
        +uint16_t blockId
        +uint8_t metadata
        +bool isRemote
        +void applyToWorld(World* world)
        +void serialize(ByteBuffer* buffer)
        +void deserialize(ByteBuffer* buffer)
    }
    
    BlockUpdateSystem o-- BlockChangeEvent
    BlockUpdateSystem --> BlockUpdatePacket
    BlockUpdatePacket o-- TetrahedralBlockChange
```

### Block Update Batching

Block updates are batched for network efficiency:

```cpp
// Batch block updates for efficient transmission
BlockUpdatePacket* createBatchedBlockUpdatePacket(
    const std::vector<BlockChangeEvent>& updates,
    uint64_t updateId,
    bool reliable) {
    
    BlockUpdatePacket* packet = new BlockUpdatePacket();
    packet->updateId = updateId;
    packet->reliable = reliable;
    
    // Group changes by chunk for potential optimization
    std::map<ChunkCoord, std::vector<BlockChangeEvent>> changesByChunk;
    
    for (const auto& update : updates) {
        ChunkCoord chunkCoord = update.coord.toChunkCoord();
        changesByChunk[chunkCoord].push_back(update);
    }
    
    // Process each chunk's changes
    for (const auto& [chunkCoord, chunkUpdates] : changesByChunk) {
        // Check if we should use chunk-based compression
        if (chunkUpdates.size() > CHUNK_COMPRESSION_THRESHOLD) {
            // Add as compressed chunk data
            compressChunkBlockUpdates(chunkCoord, chunkUpdates, packet);
        } else {
            // Add as individual updates
            for (const auto& update : chunkUpdates) {
                TetrahedralBlockChange change;
                change.coord = update.coord;
                change.blockId = update.newBlock.id;
                change.metadata = update.newBlock.metadata;
                
                packet->changes.push_back(change);
            }
        }
    }
    
    packet->updateCount = packet->changes.size();
    return packet;
}
```

## Player Synchronization

Player data synchronization is handled with prioritized components:

```mermaid
classDiagram
    class PlayerSyncSystem {
        +std::map<uint64_t, PlayerNetworkData> playerData
        +void updateLocalPlayer(Player* player)
        +void processPlayerUpdate(PlayerUpdatePacket* packet)
        +void sendPlayerUpdate(float deltaTime)
        +PlayerData createPlayerUpdate(Player* player, bool fullUpdate)
    }
    
    class PlayerNetworkData {
        +uint64_t playerId
        +std::string playerName
        +uint64_t lastInputSequence
        +uint64_t lastUpdateTime
        +TetrahedralTransform lastSentTransform
        +PlayerState state
        +PlayerInventory inventory
        +float updatePriority
        +void applyUpdate(PlayerUpdatePacket* packet)
        +void interpolate(float alpha)
    }
    
    class PlayerUpdatePacket {
        +uint64_t playerId
        +uint64_t inputSequence
        +TetrahedralTransform transform
        +PlayerState state
        +bool fullUpdate
        +PlayerInventory inventory
    }
    
    class TetrahedralTransform {
        +Quadray position
        +TetrahedralRotation rotation
        +Vector3 velocity
        +bool onGround
        +int currentTetrahedronId
        +void serialize(ByteBuffer* buffer)
        +void deserialize(ByteBuffer* buffer)
    }
    
    PlayerSyncSystem o-- PlayerNetworkData
    PlayerSyncSystem --> PlayerUpdatePacket
    PlayerUpdatePacket o-- TetrahedralTransform
```

### Tetrahedral Movement Synchronization

Player movement in tetrahedral space presents unique challenges:

```cpp
// Synchronize player movement in tetrahedral space
void synchronizePlayerMovement(
    Player* player,
    const TetrahedralTransform& serverTransform,
    uint64_t serverTick,
    uint64_t acknowledgedInput) {
    
    // Get player controller
    TetrahedralPlayerController* controller = 
        player->getComponent<TetrahedralPlayerController>();
    
    // Get current client-side transform
    TetrahedralTransformComponent* transform = 
        player->getComponent<TetrahedralTransformComponent>();
    
    // Clear outdated predicted moves
    controller->clearAcknowledgedMoves(acknowledgedInput);
    
    // If server and client tetrahedron IDs don't match, force correction
    if (transform->getTetrahedronId() != serverTransform.currentTetrahedronId) {
        // Tetrahedral space mismatch requires immediate correction
        applyServerTransform(player, serverTransform);
        return;
    }
    
    // Calculate position difference in quadray coordinates
    Quadray currentPos = transform->getPosition();
    float positionError = quadrayDistance(currentPos, serverTransform.position);
    
    // Calculate rotation difference
    TetrahedralRotation currentRot = transform->getRotation();
    float rotationError = tetrahedralRotationDistance(
        currentRot, serverTransform.rotation);
    
    // If error exceeds threshold, correct position
    if (positionError > POSITION_ERROR_THRESHOLD ||
        rotationError > ROTATION_ERROR_THRESHOLD) {
        
        // Apply server correction
        applyServerTransform(player, serverTransform);
        
        // Reapply pending inputs to maintain responsiveness
        controller->reapplyPendingMoves();
    }
}
```

## Latency Compensation

QuadCraft employs several techniques to compensate for network latency:

```mermaid
graph TD
    subgraph "Latency Compensation Techniques"
        ClientPrediction["Client Prediction"]
        ServerReconciliation["Server Reconciliation"]
        EntityInterpolation["Entity Interpolation"]
        TimeRewinding["Time Rewinding"]
    end
    
    ClientPrediction --> InputBuffer["Input Buffer"]
    ClientPrediction --> MovementPrediction["Movement Prediction"]
    
    ServerReconciliation --> StateCorrection["State Correction"]
    ServerReconciliation --> RollbackAndReplay["Rollback and Replay"]
    
    EntityInterpolation --> PositionBuffer["Position Buffer"]
    EntityInterpolation --> TetrahedralInterpolation["Tetrahedral Interpolation"]
    
    TimeRewinding --> HistoryBuffer["History Buffer"]
    TimeRewinding --> HitDetection["Hit Detection Rewind"]
```

### Server-Side Lag Compensation

For actions like block breaking and combat, server-side lag compensation is implemented:

```cpp
// Server-side lag compensation for player actions
bool performLagCompensatedAction(
    Player* player,
    const ActionData& action,
    float maxCompensationTime) {
    
    // Calculate how far back in time to rewind (based on player's ping)
    float ping = getPlayerPing(player->getId());
    float rewindTime = min(ping * 0.001f, maxCompensationTime);
    
    // Get the world state manager
    WorldStateManager* stateManager = getWorldStateManager();
    
    // Create a rewound world state
    WorldStateSnapshot* rewoundState = 
        stateManager->getStateAtTime(getCurrentTime() - rewindTime);
    
    if (!rewoundState) {
        // Fallback if history not available
        return performAction(player, action);
    }
    
    // Temporarily apply the historical state
    WorldStateGuard guard(stateManager, rewoundState);
    
    // Perform the action in the rewound state
    bool result = performAction(player, action);
    
    // The guard will restore the current state when it goes out of scope
    return result;
}
```

## Network Optimization

Several optimization techniques are employed to minimize bandwidth:

```mermaid
graph TD
    subgraph "Network Optimizations"
        Compression["Data Compression"]
        DeltaEncoding["Delta Encoding"]
        Prioritization["Transmission Prioritization"]
        InterestManagement["Interest Management"]
    end
    
    Compression --> TetrahedralCompression["Tetrahedral-Specific Compression"]
    Compression --> GeneralCompression["General Compression Algorithms"]
    
    DeltaEncoding --> PositionDelta["Position Delta Encoding"]
    DeltaEncoding --> ChunkDeltaEncoding["Chunk Delta Encoding"]
    
    Prioritization --> DistanceBased["Distance-Based Priority"]
    Prioritization --> VisibilityBased["Visibility-Based Priority"]
    
    InterestManagement --> AOI["Area of Interest"]
    InterestManagement --> RelevanceFiltering["Relevance Filtering"]
```

### Tetrahedral Data Compression

Special compression techniques are used for tetrahedral data:

```cpp
// Compress tetrahedral chunk data for network transmission
void compressTetrahedralChunkData(
    TetrahedralChunk* chunk,
    std::vector<uint8_t>& output,
    CompressionLevel level) {
    
    ByteBuffer buffer;
    
    // Write chunk header
    buffer.writeInt32(chunk->getPosition().x);
    buffer.writeInt32(chunk->getPosition().y);
    buffer.writeInt32(chunk->getPosition().z);
    buffer.writeUInt64(chunk->getRevision());
    
    // Determine optimal storage representation for this chunk
    TetrahedralStorageType storageType = determineOptimalStorage(chunk);
    buffer.writeUInt8(static_cast<uint8_t>(storageType));
    
    switch (storageType) {
        case TetrahedralStorageType::FULL:
            serializeFullChunk(chunk, buffer);
            break;
            
        case TetrahedralStorageType::RLE:
            serializeRLEChunk(chunk, buffer);
            break;
            
        case TetrahedralStorageType::PALETTE:
            serializePaletteChunk(chunk, buffer);
            break;
            
        case TetrahedralStorageType::SPARSE:
            serializeSparseChunk(chunk, buffer);
            break;
    }
    
    // Add additional chunk data
    serializeChunkMetadata(chunk, buffer);
    
    // Apply general-purpose compression
    compressBuffer(buffer.getData(), buffer.getSize(), output, level);
}
```

## Security Considerations

The network system includes several security features:

```mermaid
classDiagram
    class SecurityManager {
        +void initializeSecurity()
        +bool verifyConnection(NetworkPeer* peer)
        +void encryptPacket(Packet* packet)
        +bool decryptPacket(Packet* packet)
        +void banPlayer(uint64_t playerId, std::string reason)
        +bool validateAction(Player* player, Action action)
    }
    
    class AntiCheatSystem {
        +void registerChecks()
        +void processPlayerStats(Player* player)
        +void detectAnomaly(Player* player, AntiCheatCheckType check)
        +void reportViolation(Player* player, ViolationType type)
        +void updateReputationScore(Player* player, float delta)
    }
    
    class RateLimiter {
        +std::map<PacketType, RateLimit> limits
        +std::map<uint64_t, PacketCounter> counters
        +bool checkLimit(NetworkPeer* peer, PacketType type)
        +void updateCounter(NetworkPeer* peer, PacketType type)
        +void resetCounters()
    }
    
    SecurityManager --> AntiCheatSystem
    SecurityManager --> RateLimiter
```

## Server Administration

Tools for managing the multiplayer environment:

```mermaid
classDiagram
    class ServerManager {
        +void initialize(ServerConfig config)
        +void start()
        +void stop()
        +void restart()
        +ServerStats getStats()
        +void kickPlayer(uint64_t playerId, std::string reason)
        +void banPlayer(uint64_t playerId, std::string reason)
        +bool isPlayerBanned(uint64_t playerId)
    }
    
    class ServerConsole {
        +void initialize()
        +void processCommand(std::string command)
        +void registerCommand(std::string name, CommandHandler handler)
        +void broadcastMessage(std::string message)
        +void sendPlayerMessage(uint64_t playerId, std::string message)
    }
    
    class ServerConfig {
        +int port
        +int maxPlayers
        +bool useAuth
        +std::string serverName
        +std::string welcomeMessage
        +bool allowCheats
        +TetrahedralWorldConfig worldConfig
        +void loadFromFile(std::string filename)
        +void saveToFile(std::string filename)
    }
    
    ServerManager --> ServerConsole
    ServerManager --> ServerConfig
```

## Peer-to-Peer Mode

For smaller games, QuadCraft supports peer-to-peer connectivity:

```mermaid
classDiagram
    class P2PManager {
        +void initializeP2P()
        +void hostGame(P2PGameConfig config)
        +void joinGame(std::string hostAddress)
        +void leaveGame()
        +void synchronizeState()
        +void electedAsHost(bool isHost)
    }
    
    class P2PDiscovery {
        +void startDiscovery()
        +void stopDiscovery()
        +void broadcastPresence()
        +std::vector<P2PGameInfo> getDiscoveredGames()
        +void registerDiscoveryHandler(DiscoveryHandler handler)
    }
    
    class P2PConnectionHandler {
        +void initializeConnections()
        +void connectToPeer(std::string address)
        +void disconnectFromPeer(uint64_t peerId)
        +void sendToPeer(uint64_t peerId, Packet* packet)
        +void broadcastToAllPeers(Packet* packet)
    }
    
    P2PManager --> P2PDiscovery
    P2PManager --> P2PConnectionHandler
```

## Example Code: Action Synchronization

Here's an example of how player actions are synchronized across the network:

```cpp
// Client-side action handling
void PlayerActionSystem::performAction(ActionType type, const ActionData& data) {
    // Create action packet
    PlayerActionPacket packet;
    packet.type = type;
    packet.data = data;
    packet.sequence = nextActionSequence++;
    packet.timestamp = getCurrentTime();
    
    // Store action for potential reconciliation
    pendingActions[packet.sequence] = {
        .packet = packet,
        .appliedLocally = false
    };
    
    // Apply immediately on client for responsiveness
    if (canApplyLocally(type)) {
        applyActionLocally(packet);
        pendingActions[packet.sequence].appliedLocally = true;
    }
    
    // Send to server
    networkManager->sendPacket(&packet, DeliveryMethod::RELIABLE_ORDERED);
}

// Server-side action handling
void ServerActionHandler::handlePlayerAction(
    NetworkPeer* peer, PlayerActionPacket* packet) {
    
    // Get player associated with this peer
    Player* player = getPlayerByPeerId(peer->getId());
    if (!player) return;
    
    // Validate action
    if (!isActionValid(player, packet)) {
        // Invalid action - log and potentially take anti-cheat measures
        logInvalidAction(player, packet);
        return;
    }
    
    // Process the action on server
    ActionResult result = processAction(player, packet);
    
    // Send acknowledgment to client
    ActionAckPacket ack;
    ack.sequence = packet->sequence;
    ack.result = result.success;
    ack.resultData = result.data;
    
    networkManager->sendPacket(peer, &ack, DeliveryMethod::RELIABLE_ORDERED);
    
    // Broadcast to other players if needed
    if (shouldBroadcastAction(packet->type)) {
        broadcastActionToRelevantPlayers(player, packet, result);
    }
}

// Client-side acknowledgment handling
void PlayerActionSystem::handleActionAck(ActionAckPacket* packet) {
    // Find the pending action
    auto it = pendingActions.find(packet->sequence);
    if (it == pendingActions.end()) return;
    
    PendingAction& action = it->second;
    
    // Check if server denied the action
    if (!packet->result) {
        // Rollback the locally applied action if needed
        if (action.appliedLocally) {
            rollbackAction(action.packet);
        }
        
        // Apply the server's state
        applyServerActionResult(action.packet, packet->resultData);
    }
    
    // Remove from pending actions
    pendingActions.erase(it);
}
```

## Multiplayer Sessions and Matchmaking

For public servers, QuadCraft includes session management:

```mermaid
classDiagram
    class SessionManager {
        +void initializeSessions()
        +SessionId createSession(SessionConfig config)
        +void joinSession(SessionId id)
        +void leaveCurrentSession()
        +SessionInfo getCurrentSession()
        +std::vector<SessionInfo> getAvailableSessions()
        +void updateSessionVisibility(bool isPublic)
    }
    
    class MatchmakingService {
        +void initialize(std::string regionId)
        +void findMatch(MatchCriteria criteria)
        +void cancelMatchmaking()
        +void registerMatchFoundCallback(MatchCallback callback)
        +std::vector<ServerInfo> getRecommendedServers()
    }
    
    class SessionConfig {
        +std::string sessionName
        +int maxPlayers
        +bool isPrivate
        +std::string password
        +GameMode gameMode
        +WorldSeed seed
        +TetrahedralWorldConfig worldConfig
    }
    
    SessionManager --> MatchmakingService
    SessionManager --> SessionConfig
```

## Conclusion

QuadCraft's multiplayer system addresses the unique challenges of synchronizing a tetrahedral world across the network. Through specialized compression techniques, predictive algorithms, and a hybrid authority model, players can enjoy a responsive experience despite the complex geometry of the game world. The system's modular design allows it to scale from small peer-to-peer games to large dedicated servers, while maintaining security and performance. 