
import type { TranslationKey } from './localization';

export interface CodeSymbol {
    name: string;
    type: 'function' | 'class' | 'variable';
    exported: boolean;
}

export interface CodeFile {
    path: string;
    content: string;
}

export interface Dependency {
    from: string; // path of file doing the importing
    to: string;   // path of file being imported
}

export interface AnalysisResult {
    dependencies: Dependency[];
    symbols: Map<string, CodeSymbol[]>; // Map<filePath, symbols>
    deadCodeSymbols: { path: string, symbolName: string }[];
    deadCodeFiles: string[];
    circularDependencies: string[][];
    circularDependencyFiles: string[][];
}

// For D3 Graph
// Fix: Replace d3.SimulationNodeDatum with inline properties to avoid namespace error.
export interface GraphNode {
    id: string;
    isDead: boolean;
    isCircular: boolean;

    // Properties added by d3.js force simulation
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

// Fix: Replace d3.SimulationLinkDatum with inline properties to avoid namespace error.
export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;

    // Property added by d3.js force simulation
    index?: number;
}

export type RefactoringTaskType = 'BREAK_CIRCULAR_DEPENDENCY' | 'REMOVE_DEAD_CODE';

// FIX: Removed incorrect `TranslationKey` type definition. The correct type is now imported.
// export type TranslationKey = string;

export interface RefactoringTask {
    id: string;
    type: RefactoringTaskType;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    filesInvolved: string[];
    planKeys: TranslationKey[];
}

// AetherBus Types
export type AetherEventType = 
    | 'EXECUTE_REFACTORING_PROTOCOL'
    | 'REFACTORING_COMPLETE'
    | 'FIRMA_NODE_SELECTED'
    | 'WISDOM_FETCH_START'
    | 'WISDOM_FETCH_END';

// Represents the "Vector-Only Handshake" payload
export interface IntentVector {
    intent: string;
    targetId: string;
    [key: string]: any; 
}

// Immutable, hashed data container
export interface AkashicEnvelope {
    readonly eventType: AetherEventType;
    readonly payload: Readonly<IntentVector>;
    readonly timestamp: number;
    readonly hash: string; // Canonical Hash
}

export interface AetherBus {
    publish(eventType: AetherEventType, rawPayload: object): void;
    subscribe(eventType: AetherEventType, callback: (envelope: AkashicEnvelope) => void): () => void; // Returns an unsubscribe function
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9";

// Wisdom Engine Types
export interface GroundingResult {
    explanation: string;
    sources: { uri: string; title: string }[];
}

export type LightPulseState = 'IDLE' | 'THINKING' | 'EXECUTING' | 'COMPLETE' | 'ERROR' | 'NIRODHA';

export interface DevLightParams {
    frequency: number;
    intensity: number;
    color: string;
    decay: number;
    chaos: number;
}

export interface TouchPulse {
    x: number;
    y: number;
    startTime: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface ModelConfig {
    wisdomEngine: string;
    imageGenesis: string;
    chatbot: string;
}
