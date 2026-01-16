import React, { useState, useEffect } from 'react';
import LivingLight from './components/LivingLight';
import { AetherBusClient, IntentPayload } from './services/AetherBusClient';

// Ritual States
enum SystemState {
  NIRODHA = 0, // Blackout / Off
  WAKING = 1,  // On / Active
}

interface AppProps {
  skia: any;
}

const App: React.FC<AppProps> = ({ skia }) => {
  const [systemState, setSystemState] = useState<SystemState>(SystemState.NIRODHA);
  const [intent, setIntent] = useState<IntentPayload | null>(null);

  // 3-Tap Ritual Logic
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    // Initialize AetherBus
    const bus = new AetherBusClient('ws://localhost:8000/ws');

    bus.onMessage((payload) => {
      // Safety: Only process if WAKING.
      // If we receive a "Parajika" or disconnection signal, we might force NIRODHA here too.
      if (systemState === SystemState.WAKING) {
        setIntent(payload);
      }
    });

    // Safety: Force NIRODHA on disconnect?
    // bus.onDisconnect(() => setSystemState(SystemState.NIRODHA)); // Optional feature

    return () => {
      bus.close();
    };
  }, [systemState]);

  useEffect(() => {
    if (tapCount > 0) {
      const timer = setTimeout(() => setTapCount(0), 1000); // Reset taps if idle for 1s
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  const handleInteraction = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    console.log(`Ritual Tap: ${newTapCount}`);

    if (newTapCount === 3) {
      // Toggle State
      setSystemState(prev => {
        const newState = prev === SystemState.NIRODHA ? SystemState.WAKING : SystemState.NIRODHA;
        console.log(`System Transition: ${SystemState[prev]} -> ${SystemState[newState]}`);
        return newState;
      });
      setTapCount(0);
    }
  };

  return (
    <div
      onClick={handleInteraction}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'black',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {systemState === SystemState.WAKING && (
        <LivingLight intent={intent} skia={skia} />
      )}

      {/* Debug Overlay */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#333', fontFamily: 'monospace', fontSize: '10px', pointerEvents: 'none' }}>
        AG-SC-ADK STATUS: {SystemState[systemState]} <br/>
        TAP RITUAL: {tapCount}/3 <br/>
        MCP LINK: {intent ? "ACTIVE" : "WAITING"}
      </div>
    </div>
  );
};

export default App;
