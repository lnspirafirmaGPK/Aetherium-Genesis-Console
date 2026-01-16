import React, { useState, useEffect, useRef } from 'react';
import LivingLight from './components/LivingLight';
import ListeningRing from './components/ListeningRing';
import GlyphVerifier from './components/GlyphVerifier';
import { AetherBusClient, IntentPayload } from './services/AetherBusClient';
import { SystemState } from './constants';

interface AppProps {
  skia: any;
}

const App: React.FC<AppProps> = ({ skia }) => {
  const [systemState, setSystemState] = useState<SystemState>(SystemState.NIRODHA);
  const [intent, setIntent] = useState<IntentPayload | null>(null);

  // Interaction Logic
  const [tapCount, setTapCount] = useState(0);

  // 10s Timer Logic
  const [listeningProgress, setListeningProgress] = useState(0); // 0.0 - 1.0
  const [simulatedVolume, setSimulatedVolume] = useState(0);
  const timerRef = useRef<number | null>(null);
  const busRef = useRef<AetherBusClient | null>(null);

  useEffect(() => {
    busRef.current = new AetherBusClient('ws://localhost:8000/ws');

    busRef.current.onMessage((payload: any) => {
        console.log("Body: Received Payload", payload);

        if (payload.type === "VERIFY") {
            setSystemState(SystemState.SACCALOKA);
            setIntent(payload);
        } else if (payload.type === "MANIFEST") {
            setSystemState(SystemState.SAKSHATKARA);
            setIntent(payload);
        }
    });

    return () => {
      busRef.current?.close();
    };
  }, []);

  // 3-Tap Wake
  useEffect(() => {
    if (tapCount > 0) {
      const timer = setTimeout(() => setTapCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  const handleGlobalTap = () => {
    // If LOCKED or VERIFYING, ignore global taps (handled by specific components)
    if (systemState === SystemState.MANANA || systemState === SystemState.SACCALOKA) return;

    // If LISTENING, stop listening? No, Directive says "Non-Blocking Touch... remains in SHRAVANA".
    // But we might want to cancel? For now, we stick to the directives.

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount === 3) {
      // Toggle Wake/Sleep
      setSystemState(prev => prev === SystemState.NIRODHA ? SystemState.SAKSHATKARA : SystemState.NIRODHA); // Default to manifest for wake
      setTapCount(0);
    }
  };

  const startListening = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (systemState === SystemState.MANANA) return; // Locked

      console.log("Starting SHRAVANA (Listening)...");
      setSystemState(SystemState.SHRAVANA);
      setListeningProgress(0);
      setSimulatedVolume(0.5); // Mock volume

      // Start 10s Timer
      let start = Date.now();
      const duration = 10000;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const p = Math.min(elapsed / duration, 1.0);
          setListeningProgress(p);

          // Random volume fluctuation
          setSimulatedVolume(0.3 + Math.random() * 0.4);

          if (p >= 1.0) {
              finishListening();
          }
      }, 100);
  };

  const finishListening = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      console.log("SHRAVANA Ended. Entering MANANA (Processing)...");
      setSystemState(SystemState.MANANA);

      // Send Data to Brain
      const voicePacket = {
          jsonrpc: "2.0",
          method: "input/voice_data",
          params: {
              text: "System check alpha one", // Simulated speech
              timestamp: Date.now()
          }
      };
      // Send as text because our client handles JSON parsing, but we need to send string
      // Our AetherBusClient doesn't have a send method? We need to implement it.
      // Or just use the raw WebSocket if exposed.
      // Checking AetherBusClient.ts... it doesn't have send.
      // I will hack it or update it.
      // I'll update AetherBusClient to support sending.
      busRef.current?.send(JSON.stringify(voicePacket));
  };

  const confirmIntent = () => {
      console.log("SACCALOKA: Intent Confirmed.");
      // Send Confirmation
      const packet = {
          jsonrpc: "2.0",
          method: "input/confirm_intent",
          params: {
              timestamp: Date.now()
          }
      };
      busRef.current?.send(JSON.stringify(packet));
      // State transition is handled by receiving MANIFEST payload from Brain
      // But we can optimistically show processing
      setSystemState(SystemState.MANANA);
  };

  return (
    <div
      onClick={handleGlobalTap}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'black',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* STATES */}

      {/* MANIFESTING or IDLE (if we want background light) */}
      {(systemState === SystemState.SAKSHATKARA || systemState === SystemState.SACCALOKA) && (
        <LivingLight intent={intent} skia={skia} />
      )}

      {/* LISTENING */}
      {systemState === SystemState.SHRAVANA && (
          <ListeningRing skia={skia} progress={listeningProgress} volume={simulatedVolume} />
      )}

      {/* VERIFYING */}
      {systemState === SystemState.SACCALOKA && intent?.text && (
          <GlyphVerifier skia={skia} text={intent.text} onConfirm={confirmIntent} />
      )}

      {/* INPUT LOCK / PROCESSING */}
      {systemState === SystemState.MANANA && (
          <div style={{color: 'gray', fontFamily: 'monospace', animation: 'pulse 1s infinite'}}>
              [ PROCESSING INTENT ]
          </div>
      )}

      {/* CONTROLS (Only visible if not Locked) */}
      {systemState !== SystemState.MANANA && systemState !== SystemState.SHRAVANA && (
          <div
            onClick={startListening}
            style={{
                position: 'absolute',
                bottom: 50,
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '2px solid cyan',
                backgroundColor: 'rgba(0,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 200
            }}
          >
              <div style={{width: 20, height: 20, backgroundColor: 'cyan', borderRadius: '50%'}} />
          </div>
      )}

      {/* DEBUG OVERLAY */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#333', fontFamily: 'monospace', fontSize: '10px', pointerEvents: 'none' }}>
        STATE: {systemState} <br/>
        TAP: {tapCount}/3 <br/>
      </div>
    </div>
  );
};

export default App;
