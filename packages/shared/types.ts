export interface NeuralShaderParams {
  color_base: string;
  vibe_intensity: number;
  ripple_pattern: string;
}

export interface PhysicsParams {
  intent_vector: number[]; // Mock vector for now
  vibe_score: number;
  emotional_tone: string;
  neural_shader_params: NeuralShaderParams;
  triggered_ritual: 'startup' | 'resonance' | 'uposatha' | 'parajika' | 'normal';
  timestamp: string;
}

export interface GemOfWisdom {
  id: string;
  pattern: string; // acoustic_vector
  resolved_intent: string;
  usage_count: number;
  last_synced: string;
  ritual_tags: string[];
  temporal_jitter: number;
}
