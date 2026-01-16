import React, { useState, useEffect, useRef } from 'react';
import NeuralShaderInstance from './components/NeuralShaderInstance';
import ListeningRing from './components/ListeningRing';
import GlyphVerifier from './components/GlyphVerifier';
import { AetherBusClient } from './services/AetherBusClient';
import { PhysicsParams } from './types/intent';
import { SystemState } from './constants';

interface AppProps {
  skia: any;
}

const App: React.FC<AppProps> = ({ skia }) => {
  const [systemState, setSystemState] = useState<SystemState>(SystemState.NIRODHA);
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams | null>(null);

  // Interaction Logic
  const [tapCount, setTapCount] = useState(0);
  const [listeningProgress, setListeningProgress] = useState(0);
  const [simulatedVolume, setSimulatedVolume] = useState(0);
  const timerRef = useRef<number | null>(null);
  const busRef = useRef<AetherBusClient | null>(null);

  useEffect(() => {
    busRef.current = new AetherBusClient('ws://localhost:8000/ws');

    busRef.current.onMessage((params) => {
        console.log("Body: Received PhysicsParams", params);
        setPhysicsParams(params);
        setSystemState(SystemState.SAKSHATKARA); // Manifestation
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
    if (systemState === SystemState.MANANA) return;
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    if (newTapCount === 3) {
      setSystemState(prev => prev === SystemState.NIRODHA ? SystemState.SAKSHATKARA : SystemState.NIRODHA);
      setTapCount(0);
    }
  };

  const startListening = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSystemState(SystemState.SHRAVANA);
      setListeningProgress(0);
      setSimulatedVolume(0.5);

      let start = Date.now();
      const duration = 10000;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
          const elapsed = Date.now() - start;
          const p = Math.min(elapsed / duration, 1.0);
          setListeningProgress(p);
          setSimulatedVolume(0.3 + Math.random() * 0.4);

          if (p >= 1.0) {
              finishListening();
          }
      }, 100);
  };

  const finishListening = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setSystemState(SystemState.MANANA);

      const voicePacket = {
          jsonrpc: "2.0",
          method: "input/voice_data",
          params: {
              text: "System check alpha one",
              timestamp: Date.now()
          }
      };
      busRef.current?.send(JSON.stringify(voicePacket));
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
      {/* MANIFESTING (GenUI Layer) */}
      {(systemState === SystemState.SAKSHATKARA) && (
        <NeuralShaderInstance physicsParams={physicsParams} skia={skia} />
      )}

      {/* LISTENING */}
      {systemState === SystemState.SHRAVANA && (
          <ListeningRing skia={skia} progress={listeningProgress} volume={simulatedVolume} />
      )}

      {/* INPUT LOCK / PROCESSING */}
      {systemState === SystemState.MANANA && (
          <div style={{color: 'gray', fontFamily: 'monospace', animation: 'pulse 1s infinite'}}>
              [ PROCESSING INTENT ]
          </div>
      )}

      {/* CONTROLS */}
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

      {/* DEBUG */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#333', fontFamily: 'monospace', fontSize: '10px', pointerEvents: 'none' }}>
        STATE: {systemState} <br/>
      </div>
    </div>
  );
};

export default App;
