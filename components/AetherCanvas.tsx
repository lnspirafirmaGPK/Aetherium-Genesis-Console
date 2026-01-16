import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Blob } from '@google/genai';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, MicrophoneIcon, SpinnerIcon, CheckCircleIcon, DownloadIcon } from './icons';

// --- Audio Encoding/Decoding Helpers ---
// NOTE: These are simplified for this context and should be robust in production.
const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const createBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] < 0 ? data[i] * 0x8000 : data[i] * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

// --- Component Props ---
interface AetherCanvasProps {
    onExit: () => void;
}

// --- Component State ---
type GenesisStatus = 'READY' | 'LISTENING' | 'PROCESSING' | 'GENERATING' | 'PAUSED' | 'FINALIZED' | 'ERROR';

// --- Particle Physics Constants ---
const PARTICLE_COUNT = 3000;
const PARTICLE_DRAG = 0.95;
const PARTICLE_ATTRACTION = 0.03;
const PARTICLE_TURBULENCE = 0.1;

export const AetherCanvas: React.FC<AetherCanvasProps> = ({ onExit }) => {
    const { t } = useLocalization();
    const [status, setStatus] = useState<GenesisStatus>('READY');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [finalizedImage, setFinalizedImage] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);
    const imageAttractorsRef = useRef<any[]>([]);
    const animationFrameId = useRef<number | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // --- Canvas Animation Logic ---
    const runAnimation = useCallback(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        
        const parent = canvas.parentElement;
        if(!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.scale(dpr, dpr);
        
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: 0,
                    vy: 0,
                });
            }
        }

        const animate = () => {
            context.fillStyle = 'rgba(16, 23, 42, 0.2)'; // Fading trail effect
            context.fillRect(0, 0, width, height);
            
            particlesRef.current.forEach(p => {
                let targetX = width / 2;
                let targetY = height / 2;
                let attraction = PARTICLE_ATTRACTION / 5;

                if (imageAttractorsRef.current.length > 0) {
                    // Move towards a random attractor from the image
                    const attractor = imageAttractorsRef.current[Math.floor(Math.random() * imageAttractorsRef.current.length)];
                    targetX = attractor.x;
                    targetY = attractor.y;
                    attraction = PARTICLE_ATTRACTION;
                } else if (status === 'GENERATING' || status === 'PROCESSING') {
                     // Swirl while thinking
                     const angle = Date.now() * 0.001 + (p.x * 0.1);
                     targetX = width / 2 + Math.cos(angle) * 100;
                     targetY = height / 2 + Math.sin(angle) * 100;
                }
                
                const dx = targetX - p.x;
                const dy = targetY - p.y;
                p.vx += dx * attraction;
                p.vy += dy * attraction;
                p.vx += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vy += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vx *= PARTICLE_DRAG;
                p.vy *= PARTICLE_DRAG;
                p.x += p.vx;
                p.y += p.vy;
                
                // Boundaries
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                context.fillStyle = 'rgba(0, 255, 255, 0.7)';
                context.fillRect(p.x, p.y, 1, 1);
            });
            
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        animate();
    }, [status]);

    useEffect(() => {
        runAnimation();
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [runAnimation]);

    // --- Image Generation Logic ---
    const generateImage = async (prompt: string) => {
        if (!prompt) return;
        setStatus('GENERATING');
        setFinalizedImage(null);
        imageAttractorsRef.current = [];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: { tools: [{ google_search: {} }] }
            });

            const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (part?.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setFinalizedImage(imageUrl);
                
                const img = new Image();
                img.onload = () => {
                    const offscreenCanvas = document.createElement('canvas');
                    const aspect = img.width / img.height;
                    const canvas = canvasRef.current;
                    if(!canvas) return;

                    let w = canvas.width / 2;
                    let h = w / aspect;
                    if(h > canvas.height / 2) {
                        h = canvas.height / 2;
                        w = h * aspect;
                    }

                    offscreenCanvas.width = w;
                    offscreenCanvas.height = h;
                    const ctx = offscreenCanvas.getContext('2d');
                    if(!ctx) return;

                    ctx.drawImage(img, 0, 0, w, h);
                    const imageData = ctx.getImageData(0, 0, w, h);
                    const newAttractors = [];
                    const offsetX = (canvas.width / 2 - w) / 2;
                    const offsetY = (canvas.height / 2 - h) / 2;
                    for (let i = 0; i < imageData.data.length; i += 4 * 8) { // Sample every 8th pixel
                        const brightness = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
                        if (brightness > 100) { // Threshold
                            const x = (i / 4) % w;
                            const y = Math.floor((i / 4) / w);
                            newAttractors.push({ x: x + offsetX, y: y + offsetY });
                        }
                    }
                    imageAttractorsRef.current = newAttractors;
                };
                img.src = imageUrl;

                setStatus('PAUSED');
            } else {
                setError(t('noImageGeneratedError'));
                setStatus('ERROR');
            }
        } catch (e) {
            console.error(e);
            setError(t('imageGenerationError'));
            setStatus('ERROR');
        }
    };
    
    // --- Voice Session Logic ---
    const stopListening = useCallback(() => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
        }
        if (sessionPromiseRef.current) {
           sessionPromiseRef.current.then(session => session.close());
           sessionPromiseRef.current = null;
        }
        if (status === 'LISTENING') {
            setStatus('PROCESSING');
            generateImage(transcript);
        }
    }, [transcript, status, t]);


    const startListening = useCallback(async () => {
        setError(null);
        setTranscript('');
        setStatus('LISTENING');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-25',
                config: { inputAudioTranscription: {} },
                callbacks: {
                    onopen: () => {
                        // FIX: Cast `window` to `any` to allow access to the non-standard `webkitAudioContext` for Safari compatibility, resolving a TypeScript type error.
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscript(prev => prev + message.serverContent.inputTranscription.text);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError(t('connectionError'));
                        setStatus('ERROR');
                        stopListening();
                    },
                    onclose: () => {
                        stream.getTracks().forEach(track => track.stop());
                    },
                },
            });

        } catch (err) {
            console.error('Microphone access denied:', err);
            setError(t('micError'));
            setStatus('ERROR');
        }
    }, [t, stopListening]);

    const handleMicClick = () => {
        if (status === 'LISTENING') {
            stopListening();
        } else {
            startListening();
        }
    };
    
    const handleFinalize = () => {
      setStatus('FINALIZED');
      imageAttractorsRef.current = [];
    }

    const handleSaveImage = () => {
        if (finalizedImage) {
            const link = document.createElement('a');
            link.href = finalizedImage;
            link.download = `aether-genesis-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleExit = () => {
        stopListening();
        onExit();
    };

    const StatusDisplay = () => {
        let text = '';
        switch(status){
            case 'READY': text = t('speakPrompt'); break;
            case 'LISTENING': text = t('listening'); break;
            case 'PROCESSING': text = t('processing'); break;
            case 'GENERATING': text = t('generating'); break;
            case 'PAUSED': text = 'Generation complete. Awaiting command.'; break;
            case 'FINALIZED': text = 'Creation finalized.'; break;
            case 'ERROR': text = error || 'An unknown error occurred.'; break;
        }
        return <p className={`text-center transition-opacity duration-300 ${status === 'LISTENING' ? 'text-red-400' : 'text-gray-400'}`}>{text}</p>;
    }

    return (
        <div className="relative w-full h-full flex flex-col bg-gray-900">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 flex flex-col p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-cyan-400">{t('genesisProtocol')}</h3>
                    <button onClick={handleExit} className="p-2 text-gray-400 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex-grow flex items-center justify-center">
                    {finalizedImage && (
                        <img 
                            src={finalizedImage} 
                            alt={transcript}
                            className={`transition-opacity duration-500 max-w-full max-h-full object-contain ${status === 'FINALIZED' ? 'opacity-100' : 'opacity-30'}`}
                         />
                    )}
                </div>

                <div className="w-full mt-auto space-y-3">
                    <div className="bg-black/50 backdrop-blur-sm p-3 rounded-lg text-center min-h-[4em]">
                        <p className="text-gray-200">{transcript}</p>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm p-3 rounded-lg">
                        <StatusDisplay/>
                    </div>
                    <div className="flex justify-center items-center gap-4">
                        <button 
                            onClick={handleMicClick}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors
                                ${status === 'LISTENING' ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'}
                                disabled:bg-gray-600 disabled:cursor-not-allowed`}
                            disabled={status === 'GENERATING' || status === 'PROCESSING' || status === 'FINALIZED'}
                        >
                            {status === 'GENERATING' || status === 'PROCESSING' ? (
                               <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                            ) : (
                               <MicrophoneIcon className="w-8 h-8 text-white" />
                            )}
                        </button>
                        {status === 'PAUSED' && (
                            <button onClick={handleFinalize} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md flex items-center">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                {t('finalize')}
                            </button>
                        )}
                        {status === 'FINALIZED' && (
                             <button onClick={handleSaveImage} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md flex items-center">
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                {t('saveImage')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};