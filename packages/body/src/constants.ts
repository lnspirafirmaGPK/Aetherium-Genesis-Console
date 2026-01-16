export enum SystemState {
  NIRODHA = "IDLE_BLACK",      // Ready for 3-tap or single tap
  SHRAVANA = "LISTENING",      // 10s Window Open (Responsive Ring)
  MANANA = "PROCESSING",       // INPUT LOCKED (Analyzing accent/intent)
  SACCALOKA = "VERIFYING",     // Path B: Waiting for user touch on Glyph
  SAKSHATKARA = "MANIFESTING"  // Final light/app appearance
}

export interface IntentPayload {
  type: "MANIFEST" | "VERIFY";
  text?: string; // For Glyph
  vibe_state?: {
    mood: string;
    energy_level: number;
    urgency: number;
  };
  render_params?: {
    geometry: string;
    chroma_primary: string;
    chroma_secondary: string;
    pulse_frequency: number;
    bloom_factor: number;
  };
}
