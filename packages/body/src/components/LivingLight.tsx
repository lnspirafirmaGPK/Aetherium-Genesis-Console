import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, Fill, Shader } from '@shopify/react-native-skia';

export interface IntentPayload {
  vibe_state: {
    mood: string;
    energy_level: number;
    urgency: number;
  };
  render_params: {
    chroma_primary: string;
    chroma_secondary: string;
    pulse_frequency: number;
    bloom_factor: number;
  };
}

interface LivingLightProps {
  intent: IntentPayload | null;
  skia: any;
}

// ORGANIC FLUID SHADER (The Soul)
const SHADER_CODE = `
uniform float u_time;
uniform float2 u_resolution;
uniform float3 u_color_primary;
uniform float3 u_color_secondary;
uniform float u_energy;
uniform float u_pulse_freq;

// Smooth Union (Metaball logic)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Noise function
float noise(float3 p) {
    return fract(sin(dot(p, float3(12.9898, 78.233, 45.164))) * 43758.5453);
}

// FBM (Fractal Brownian Motion) for smoke/cloud effect
float fbm(float3 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
        v += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return v;
}

float4 main(float2 pos) {
    float2 uv = (pos - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
    float t = u_time;

    // Breathing / Pulse
    float pulse = sin(t * u_pulse_freq * 3.14) * 0.5 + 0.5;

    // Core Nucleus (Orb)
    float d1 = length(uv) - 0.2 - (u_energy * 0.1) - (pulse * 0.05);

    // Wandering Satellite (Organic movement)
    float2 satPos = float2(sin(t * 0.5), cos(t * 0.7)) * 0.3;
    float d2 = length(uv - satPos) - 0.1;

    // Smooth Union (The Fusion)
    float d = smin(d1, d2, 0.3); // k=0.3 for viscous look

    // Add FBM Noise distortion (Viscosity)
    float n = fbm(float3(uv * 3.0, t * 0.2));
    d -= n * 0.1 * u_energy;

    // Glow / Bioluminescence
    float glow = 0.015 / abs(d);

    // Color
    float3 col = mix(u_color_primary, u_color_secondary, length(uv) + n);

    // Final Composition
    float3 finalColor = col * glow * (1.0 + pulse * 0.5);

    // Alpha for blending
    float alpha = smoothstep(0.01, 0.0, d);
    finalColor += col * alpha * 0.8;

    return float4(finalColor, 1.0);
}
`;

const LivingLight: React.FC<LivingLightProps> = ({ intent, skia }) => {
  const [time, setTime] = useState(0);
  const startTimeRef = useRef(Date.now());
  const requestRef = useRef<number>();

  // Create RuntimeEffect using the injected Skia instance
  const source = useMemo(() => {
    if (!skia || !skia.RuntimeEffect) return null;
    return skia.RuntimeEffect.Make(SHADER_CODE);
  }, [skia]);

  const animate = () => {
    setTime((Date.now() - startTimeRef.current) / 1000);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const energy = intent?.vibe_state.energy_level || 0.5;
  const pulseFreq = intent?.render_params.pulse_frequency || 1.0;

  const hexToFloat3 = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [0, 1, 1];
  };

  const uColorPrimary = useMemo(() => hexToFloat3(intent?.render_params.chroma_primary || "#00FFFF"), [intent]);
  const uColorSecondary = useMemo(() => hexToFloat3(intent?.render_params.chroma_secondary || "#FF00FF"), [intent]);

  const uniforms = {
      u_time: time,
      u_resolution: [window.innerWidth, window.innerHeight],
      u_color_primary: uColorPrimary,
      u_color_secondary: uColorSecondary,
      u_energy: energy,
      u_pulse_freq: pulseFreq
  };

  if (!source) return null;

  return (
    // @ts-ignore
    <Canvas style={{ width: '100%', height: '100%' }}>
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
};

export default LivingLight;
