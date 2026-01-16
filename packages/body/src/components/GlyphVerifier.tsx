import React, { useMemo } from 'react';
import { Canvas, Text, useFont, Skia } from '@shopify/react-native-skia';

interface GlyphVerifierProps {
  skia: any;
  text: string;
  onConfirm: () => void;
}

const GlyphVerifier: React.FC<GlyphVerifierProps> = ({ skia, text, onConfirm }) => {
  // We need to load a font. Skia Web might not have system fonts.
  // We can try to load a font from a URL or rely on a default if possible.
  // In pure Skia Web, we often need `skia.Typeface.MakeFreeTypeFaceFromData`.

  // Since this is a prototype, we will try to render basic text.
  // If font loading is hard, we might need a fallback.

  // For now, let's assume we can load a standard font or use a simple path.
  // Actually, @shopify/react-native-skia provides `useFont`.
  // We can point to a Google Font URL.
  const fontSize = 32;
  const font = useFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff', fontSize);

  if (!font) {
      return <div style={{color: 'cyan', position: 'absolute', top: '40%'}}>Loading Glyph...</div>;
  }

  return (
    <div
        onClick={(e) => { e.stopPropagation(); onConfirm(); }}
        style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100
        }}
    >
        {/* We use a DIV overlay for the click, but render the text in Canvas for the Glow effect */}
        {/* Actually, let's use the Canvas for rendering */}
        {/* @ts-ignore */}
        <Canvas style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <Text
                x={window.innerWidth / 2 - (text.length * 10)}
                y={window.innerHeight / 2}
                text={text}
                font={font}
                color="cyan"
                style="stroke"
                strokeWidth={2}
            />
            <Text
                x={window.innerWidth / 2 - (text.length * 10)}
                y={window.innerHeight / 2}
                text={text}
                font={font}
                color="white"
                style="fill"
                opacity={0.8}
            />
        </Canvas>

        {/* Helper text */}
        <div style={{ position: 'absolute', bottom: '20%', color: 'cyan', fontFamily: 'monospace' }}>
            [ TAP GLYPH TO CONFIRM ]
        </div>
    </div>
  );
};

export default GlyphVerifier;
