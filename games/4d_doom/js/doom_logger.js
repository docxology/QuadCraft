/**
 * doom_logger.js — Unified Structured Logging System
 * 
 * Configurable, emoji-prefixed logging for the 4D Doom engine.
 * Ensures all systems (Engine, Geometry, AI, Physics) have distinct visual traces.
 */

export const LOG_LEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Default level - can be configured at runtime
export let currentLogLevel = LOG_LEVEL.INFO;

export function setLogLevel(level) {
    currentLogLevel = Object.values(LOG_LEVEL).includes(level) ? level : LOG_LEVEL.INFO;
}

export const Logger = {
    // ─── Base methods ──────────────────────────────────────────────────
    debug: (system, msg) => { if (currentLogLevel <= LOG_LEVEL.DEBUG) console.log(`[${system}] 🔍 ${msg}`); },
    info: (system, msg) => { if (currentLogLevel <= LOG_LEVEL.INFO) console.log(`[${system}] ℹ️ ${msg}`); },
    warn: (system, msg) => { if (currentLogLevel <= LOG_LEVEL.WARN) console.warn(`[${system}] ⚠️ ${msg}`); },
    error: (system, msg) => { if (currentLogLevel <= LOG_LEVEL.ERROR) console.error(`[${system}] 🚨 ${msg}`); },

    // ─── Semantic Shortcuts ────────────────────────────────────────────
    engine: (msg) => Logger.info('🎮 Engine', msg),
    engineDebug: (msg) => Logger.debug('🎮 Engine', msg),

    geometry: (msg) => Logger.info('📐 Geometry', msg),
    geometryDebug: (msg) => Logger.debug('📐 Geometry', msg),

    physics: (msg) => Logger.debug('💥 Physics', msg),

    render: (msg) => Logger.debug('👁️ Render', msg),

    ai: (msg) => Logger.debug('🧠 AI', msg),
    aiInfo: (msg) => Logger.info('🧠 AI', msg),

    map: (msg) => Logger.info('🗺️ Map', msg),
    mapDebug: (msg) => Logger.debug('🗺️ Map', msg),

    test: (msg) => Logger.info('🧪 Test', msg),
    testError: (msg) => Logger.error('🧪 Test', msg)
};
