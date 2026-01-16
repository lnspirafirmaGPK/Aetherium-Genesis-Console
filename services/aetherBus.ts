import type { AetherEventType, AkashicEnvelope, IntentVector, AetherBus as IAetherBus, RefactoringTask, CodeFile } from '../types';

// Simple deterministic hash for simulation of a Canonical Hash
const generateCanonicalHash = (obj: any): string => {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return `hash-${hash.toString(16)}`;
};


export class AetherBus implements IAetherBus {
    private static instance: AetherBus;
    private subscribers: Map<AetherEventType, Set<(envelope: AkashicEnvelope) => void>> = new Map();

    private constructor() {
        console.log("AetherBus initialized. The Nervous Core is online.");
    }

    public static getInstance(): AetherBus {
        if (!AetherBus.instance) {
            AetherBus.instance = new AetherBus();
        }
        return AetherBus.instance;
    }

    private validatePayload(eventType: AetherEventType, payload: any): boolean {
        switch (eventType) {
            case 'EXECUTE_REFACTORING_PROTOCOL':
            case 'SIMULATE_IMPACT':
                return (
                    payload &&
                    typeof payload.id === 'string' &&
                    typeof payload.type === 'string' &&
                    Array.isArray(payload.filesInvolved) &&
                    payload.filesInvolved.every((f: any) => typeof f === 'string')
                );
            case 'REFACTORING_COMPLETE':
                return (
                    payload &&
                    typeof payload.completedTaskId === 'string' &&
                    Array.isArray(payload.newFiles) &&
                    payload.newFiles.every((f: any) => f && typeof f.path === 'string' && typeof f.content === 'string')
                );
            case 'FIRMA_NODE_SELECTED':
                return (
                    payload &&
                    typeof payload.path === 'string' &&
                    typeof payload.content === 'string'
                );
            case 'WISDOM_FETCH_START':
            case 'WISDOM_FETCH_END':
            case 'TIER_SUSPENSION_TRIGGERED':
                 return true; // No payload to validate
            default:
                console.warn(`[AetherBus] No validation rule for eventType: ${eventType}`);
                return true;
        }
    }
    
    // Simulates "Identity Annihilation" and Vector-Only Handshake.
    // This method transforms raw event data into a pure, context-free IntentVector.
    // It strips away any potentially sensitive or unnecessary data (like full file content),
    // anonymizing the payload into its essential components. This ensures that subscribers
    // react to the intent, not the raw data structure.
    private createIntentVector(eventType: AetherEventType, rawPayload: any): IntentVector {
        const task = rawPayload as RefactoringTask;
        switch (eventType) {
            case 'EXECUTE_REFACTORING_PROTOCOL':
                // Vector Extraction: Extract core protocol details, discard descriptive text.
                return {
                    intent: 'EXECUTE_PROTOCOL',
                    targetId: task.id,
                    protocolType: task.type,
                    filesInvolved: task.filesInvolved // File paths are identifiers, not content.
                };
            case 'SIMULATE_IMPACT':
                return {
                    intent: 'SIMULATE_IMPACT',
                    targetId: task.id,
                    filesInvolved: task.filesInvolved,
                };
            case 'REFACTORING_COMPLETE':
                // The new state of the Firma is the core intent.
                return {
                    intent: 'UPDATE_FIRMA',
                    targetId: rawPayload.completedTaskId,
                    newFirmaState: rawPayload.newFiles
                };
            case 'FIRMA_NODE_SELECTED':
                 // PII Anonymization: The raw file content is discarded.
                 // We only care about the node's identity (path) and a characteristic (size).
                 const file = rawPayload as CodeFile;
                 return {
                    intent: 'VIEW_NODE',
                    targetId: file.path,
                    nodeSize: file.content.length // A characteristic of the vector.
                 };
            case 'WISDOM_FETCH_START':
                return { intent: 'STATE_CHANGE_THINKING', targetId: 'WisdomEngine' };
            case 'WISDOM_FETCH_END':
                return { intent: 'STATE_CHANGE_IDLE', targetId: 'WisdomEngine' };
            case 'TIER_SUSPENSION_TRIGGERED':
                return { intent: 'STATE_CHANGE_NIRODHA', targetId: 'EconomicFabric' };
            default:
                 // For unknown intents, create a null-vector. Do not leak the original payload.
                 return {
                    intent: 'UNKNOWN',
                    targetId: 'NULL',
                 };
        }
    }


    public publish(eventType: AetherEventType, rawPayload: object): void {
        if (!this.validatePayload(eventType, rawPayload)) {
            console.error(`[AetherBus] Invalid payload for eventType: ${eventType}`, rawPayload);
            return; 
        }

        const intentVector = this.createIntentVector(eventType, rawPayload);
        const hash = generateCanonicalHash(intentVector);

        // AkashicEnvelope is immutable (conceptually frozen)
        const envelope: AkashicEnvelope = Object.freeze({
            eventType,
            payload: Object.freeze(intentVector),
            timestamp: Date.now(),
            hash,
        });

        console.log(`[AetherBus] Publishing: ${eventType}`, envelope);

        const eventSubscribers = this.subscribers.get(eventType);
        if (eventSubscribers) {
            eventSubscribers.forEach(callback => {
                try {
                    callback(envelope);
                } catch (error) {
                    console.error(`[AetherBus] Error in subscriber for ${eventType}:`, error);
                }
            });
        }
    }

    public subscribe(eventType: AetherEventType, callback: (envelope: AkashicEnvelope) => void): () => void {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        const eventSubscribers = this.subscribers.get(eventType)!;
        eventSubscribers.add(callback);
        
        // Return an unsubscribe function
        return () => {
            eventSubscribers.delete(callback);
            console.log(`[AetherBus] Unsubscribed from: ${eventType}`);
        };
    }
}
