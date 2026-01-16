import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, MicrophoneIcon, SpinnerIcon, CheckCircleIcon, DownloadIcon } from './icons';

// FIX: Add webkitAudioContext to the Window interface to support Safari and older browsers.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// --- Audio Encoding/Decoding Helpers ---
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
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
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
const PARTICLE_COUNT = 5000;
const PARTICLE_DRAG = 0.95;
const PARTICLE_ATTRACTION = 0.03;
const PARTICLE_TURBULENCE = 0.1;
const PARTICLE_COLOR = 'rgba(200, 225, 255, 0.7)';

export const AetherCanvas: React.FC<AetherCanvasProps> = ({ onExit }) => {
    const { t } = useLocalization();
    const [status, setStatus] = useState<GenesisStatus>('READY');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [finalizedImage, setFinalizedImage] = useState<string | null>(null);
    const [imagePixelTargets, setImagePixelTargets] = useState<{ x: number, y: number }[] | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const liveSessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            if (!process.env.API_KEY) throw new Error("API key is not configured.");
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e: any) {
            console.error(e);
            setError(t('connectionError'));
            setStatus('ERROR');
        }
    }, [t]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.clientWidth * dpr;
            canvas.height = parent.clientHeight * dpr;
            canvas.style.width = `${parent.clientWidth}px`;
            canvas.style.height = `${parent.clientHeight}px`;
            context.scale(dpr, dpr);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            targetX: Math.random() * width,
            targetY: Math.random() * height,
        }));

        const animate = () => {
            const currentWidth = canvas.width / (window.devicePixelRatio || 1);
            const currentHeight = canvas.height / (window.devicePixelRatio || 1);

            context.clearRect(0, 0, canvas.width, canvas.height);

            if (finalizedImage && status === 'FINALIZED') {
                const img = new Image();
                img.src = finalizedImage;
                if (img.complete) {
                     const aspectRatio = img.width / img.height;
                     let drawWidth = currentWidth;
                     let drawHeight = currentWidth / aspectRatio;
                     if (drawHeight > currentHeight) {
                         drawHeight = currentHeight;
                         drawWidth = currentHeight * aspectRatio;
                     }
                     const x = (currentWidth - drawWidth) / 2;
                     const y = (currentHeight - drawHeight) / 2;
                     context.drawImage(img, x, y, drawWidth, drawHeight);
                }
            }
            
            if (finalizedImage && status === 'PAUSED') {
                 const img = new Image();
                 img.src = finalizedImage;
                 if (img.complete) {
                    context.globalAlpha = 0.2;
                    const aspectRatio = img.width / img.height;
                    let drawWidth = currentWidth;
                    let drawHeight = currentWidth / aspectRatio;
                    if (drawHeight > currentHeight) {
                        drawHeight = currentHeight;
                        drawWidth = currentHeight * aspectRatio;
                    }
                    const x = (currentWidth - drawWidth) / 2;
                    const y = (currentHeight - drawHeight) / 2;
                    context.drawImage(img, x, y, drawWidth, drawHeight);
                    context.globalAlpha = 1.0;
                 }
            }

            context.fillStyle = PARTICLE_COLOR;
            particlesRef.current.forEach((p, i) => {
                let target = { x: p.targetX, y: p.targetY };
                if (imagePixelTargets && imagePixelTargets.length > 0) {
                   target = imagePixelTargets[i % imagePixelTargets.length];
                } else if (status === 'GENERATING') {
                   target = { x: currentWidth / 2, y: currentHeight / 2 };
                }

                const dx = target.x - p.x;
                const dy = target.y - p.y;
                p.vx += dx * PARTICLE_ATTRACTION;
                p.vy += dy * PARTICLE_ATTRACTION;
                p.vx += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vy += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vx *= PARTICLE_DRAG;
                p.vy *= PARTICLE_DRAG;
                p.x += p.vx;
                p.y += p.vy;
                
                context.beginPath();
                context.arc(p.x, p.y, 1, 0, Math.PI * 2);
                context.fill();
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [status, finalizedImage, imagePixelTargets]);

    const startListening = useCallback(async () => {
        if (!aiRef.current) return;
        setStatus('LISTENING');
        setError(null);
        setTranscript('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            // FIX: The error on this line is resolved by the global Window interface declaration at the top of the file.
            const context = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = context;
            
            liveSessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-25',
                callbacks: {
                    onopen: () => {
                        const source = context.createMediaStreamSource(stream);
                        const processor = context.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;
                        
                        processor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            liveSessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(processor);
                        processor.connect(context.destination);
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
                    },
                    onclose: () => {},
                },
                config: {
                    inputAudioTranscription: {},
                    responseModalities: [],
                },
            });

        } catch (err) {
            console.error('Microphone access denied:', err);
            setError(t('micError'));
            setStatus('ERROR');
        }
    }, [t]);

    const stopListeningAndProcess = useCallback(async () => {
        setStatus('PROCESSING');
        
        liveSessionPromiseRef.current?.then(session => session.close());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        liveSessionPromiseRef.current = null;

        if (!transcript.trim()) {
            setStatus('READY');
            return;
        }

        setStatus('GENERATING');
        setFinalizedImage(null);
        setImagePixelTargets(null);

        try {
            if (!aiRef.current) throw new Error("AI not initialized");

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: transcript }] },
                config: { imageConfig: { aspectRatio: '16:9' } },
            });
            
            let foundImage = false;
            for (const part of response.candidates?.[0]?.content?.parts ?? []) {
                if (part.inlineData) {
                    const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    setFinalizedImage(base64Data);
                    
                    const img = new Image();
                    img.onload = () => {
                        const canvas = canvasRef.current;
                        if (!canvas) return;
                        const parent = canvas.parentElement;
                        if (!parent) return;
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        if (!ctx) return;
                        
                        const canvasWidth = parent.clientWidth;
                        const canvasHeight = parent.clientHeight;
                        
                        const aspectRatio = img.width / img.height;
                        let drawWidth = canvasWidth;
                        let drawHeight = canvasWidth / aspectRatio;
                        if (drawHeight > canvasHeight) {
                           drawHeight = canvasHeight;
                           drawWidth = canvasHeight * aspectRatio;
                        }

                        const xOffset = (canvasWidth - drawWidth) / 2;
                        const yOffset = (canvasHeight - drawHeight) / 2;
                        
                        const offscreenCanvas = document.createElement('canvas');
                        offscreenCanvas.width = drawWidth;
                        offscreenCanvas.height = drawHeight;
                        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
                        if(!offscreenCtx) return;

                        offscreenCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
                        const imageData = offscreenCtx.getImageData(0, 0, drawWidth, drawHeight);
                        
                        const newTargets = [];
                        const step = 4;
                        for (let y = 0; y < imageData.height; y += step) {
                            for (let x = 0; x < imageData.width; x += step) {
                                const index = (y * imageData.width + x) * 4;
                                const brightness = (imageData.data[index] + imageData.data[index+1] + imageData.data[index+2]) / 3;
                                if (brightness > 80 && Math.random() > 0.5) { 
                                    newTargets.push({ x: x + xOffset, y: y + yOffset });
                                }
                            }
                        }
                        setImagePixelTargets(newTargets);
                    };
                    img.src = base64Data;
                    
                    setStatus('PAUSED');
                    foundImage = true;
                    break;
                }
            }

            if (!foundImage) throw new Error(t('noImageGeneratedError'));
        } catch (e: any) {
            console.error(e);
            setError(e.message || t('imageGenerationError'));
            setStatus('ERROR');
        }

    }, [transcript, t]);

    const handleMicClick = () => {
        if (status === 'LISTENING') stopListeningAndProcess();
        else startListening();
    };
    
    const handleFinalize = () => setStatus('FINALIZED');
    
    const handleSave = () => {
        if (finalizedImage) {
            const link = document.createElement('a');
            link.href = finalizedImage;
            link.download = `aetherium-genesis-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExit = () => {
        liveSessionPromiseRef.current?.then(session => session.close());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        onExit();
    };

    const renderStatus = () => {
        switch (status) {
            case 'READY': return t('speakPrompt');
            case 'LISTENING': return t('listening');
            case 'PROCESSING': return t('processing');
            case 'GENERATING': return t('generating');
            case 'PAUSED': return t('ready');
            case 'FINALIZED': return t('ready');
            case 'ERROR': return error || t('error');
        }
    };

    return (
        <div className="absolute inset-0 bg-black flex flex-col">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 flex flex-col p-6 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-cyan-400">{t('genesisProtocol')}</h2>
                        <p className="text-gray-400">{t('voiceCommand')}</p>
                    </div>
                    <button onClick={handleExit} className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/80 transition-colors pointer-events-auto">
                        <CloseIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
                
                <div className="flex-grow flex items-center justify-center text-center">
                    <div className="max-w-3xl">
                        <p className={`transition-opacity duration-300 text-3xl font-light ${status === 'LISTENING' || status === 'PROCESSING' ? 'text-cyan-300' : 'text-gray-400'}`}>
                            {transcript || renderStatus()}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center items-center space-x-6">
                    <button onClick={handleMicClick} disabled={status === 'PROCESSING' || status === 'GENERATING'} className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center border-2 border-transparent hover:border-cyan-400 transition-all duration-300 pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed">
                        {status === 'LISTENING' && <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse" />}
                        {(status === 'PROCESSING' || status === 'GENERATING') && <SpinnerIcon className="w-10 h-10 text-cyan-400 animate-spin" />}
                        {status !== 'LISTENING' && status !== 'PROCESSING' && status !== 'GENERATING' && <MicrophoneIcon className="w-10 h-10 text-white" />}
                    </button>
                    {(status === 'PAUSED' || status === 'FINALIZED') && finalizedImage && (
                        <>
                            <button onClick={handleFinalize} className="flex items-center space-x-2 px-6 py-3 bg-green-600/80 text-white rounded-lg hover:bg-green-500/80 transition-colors pointer-events-auto">
                                <CheckCircleIcon className="w-6 h-6" />
                                <span>{t('finalize')}</span>
                            </button>
                             <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500/80 transition-colors pointer-events-auto">
                                <DownloadIcon className="w-6 h-6" />
                                <span>{t('saveImage')}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};