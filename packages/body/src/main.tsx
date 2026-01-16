import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// @ts-ignore
import { JsiSkApi } from '@shopify/react-native-skia/lib/module/skia/web/JsiSkia';

// Declare global types to avoid ts-nocheck
declare global {
  interface Window {
    SkiaApi: any;
    CanvasKit: any;
  }
}

console.log("Starting App Initialization...");

const init = async () => {
  try {
      // LoadSkiaWeb returns Promise<void> but at runtime often behaves differently or we rely on side effects
      await LoadSkiaWeb();
      let Skia: any = undefined;

      // Attempt to retrieve Skia from global scope
      if (typeof window !== 'undefined') {
        Skia = window.SkiaApi;
      }

      // Fallback: Manually initialize JsiSkApi if CanvasKit is present
      if (!Skia && window.CanvasKit) {
          console.log("CanvasKit found, initializing JsiSkApi manual fallback...");
          Skia = JsiSkApi(window.CanvasKit);

          // CRITICAL: Set global SkiaApi BEFORE importing components that rely on it
          window.SkiaApi = Skia;
          // Polyfill global for libraries expecting Node environment
          (globalThis as any).SkiaApi = Skia;

          console.log("Manual JsiSkApi initialization success.");
      }

      if (!Skia) {
        throw new Error("Skia API failed to load. Ensure WebAssembly is supported.");
      }

      console.log("Skia initialized globally.");

      // Dynamic Import of App to ensure modules evaluate AFTER Skia is global
      const App = (await import('./App')).default;

      ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
          <App skia={Skia} />
        </React.StrictMode>
      );

  } catch (err) {
      console.error("Initialization Failed:", err);
      document.body.innerHTML = `<h1 style='color:red; font-family: monospace; padding: 20px;'>SYSTEM FAILURE: ${err}</h1>`;
  }
};

init();
