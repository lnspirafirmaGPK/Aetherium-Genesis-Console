
import React, { useEffect, useRef } from 'react';
import type { LightPulseState, DevLightParams, TouchPulse } from '../types';

interface LightPulseSimulatorProps {
    state: LightPulseState;
    devParamsOverride?: Partial<DevLightParams>;
}

const STATE_CONFIG: Record<LightPulseState, DevLightParams> = {
    IDLE: { frequency: 0.5, intensity: 1.0, color: '#00FFFF', decay: 0.95, chaos: 0 },
    THINKING: { frequency: 1.2, intensity: 0.9, color: '#BC13FE', decay: 0.95, chaos: 0.3 },
    EXECUTING: { frequency: 3.0, intensity: 1.2, color: '#FF8C00', decay: 0.9, chaos: 0.1 },
    COMPLETE: { frequency: 8.0, intensity: 2.0, color: '#22C55E', decay: 0.85, chaos: 0 },
    ERROR: { frequency: 15.0, intensity: 1.5, color: '#A0522D', decay: 0.9, chaos: 8.0 },
    NIRODHA: { frequency: 0.1, intensity: 0, color: '#050505', decay: 0.98, chaos: 0 },
};

// Physics for user-generated touch pulses
const TOUCH_PULSE_LIFESPAN_MS = 1000;
const TOUCH_PULSE_MAX_RADIUS = 80;
const TOUCH_PULSE_COLOR = 'rgba(200, 225, 255, 0.7)';

export { STATE_CONFIG };

export const LightPulseSimulator: React.FC<LightPulseSimulatorProps> = ({ state, devParamsOverride }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const touchPulsesRef = useRef<TouchPulse[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        const parent = canvas.parentElement;
        if (!parent) return;
        
        const baseConfig = STATE_CONFIG[state] || STATE_CONFIG.IDLE;
        const config = { ...baseConfig, ...devParamsOverride };

        let width = parent.clientWidth;
        let height = parent.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        const handleResize = () => {
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.scale(dpr, dpr);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const startTime = Date.now();

        const addPulse = (x: number, y: number) => {
            const rect = canvas.getBoundingClientRect();
            const pulse: TouchPulse = {
                x: (x - rect.left) * dpr,
                y: (y - rect.top) * dpr,
                startTime: Date.now(),
            };
            touchPulsesRef.current.push(pulse);
        };
        
        const handleMouseDown = (e: MouseEvent) => addPulse(e.clientX, e.clientY);
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                addPulse(touch.clientX, touch.clientY);
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

        const render = () => {
            // Draw background (decay effect)
            context.fillStyle = `rgba(16, 23, 42, ${1 - config.decay})`;
            context.fillRect(0, 0, width, height);

            // --- Draw main state pulse ---
            const mainPulseElapsedTime = (Date.now() - startTime) / 1000;
            const mainPulseProgress = (Math.sin(mainPulseElapsedTime * config.frequency * Math.PI) + 1) / 2;
            const chaosX = (Math.random() - 0.5) * config.chaos;
            const chaosY = (Math.random() - 0.5) * config.chaos;
            const centerX = width / 2 + chaosX;
            const centerY = height / 2 + chaosY;
            const maxRadius = Math.min(width, height) / 3;
            const currentRadius = maxRadius * mainPulseProgress * config.intensity;
            const currentOpacity = 0.1 + (mainPulseProgress * 0.9);

            const mainGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius);
            const [r, g, b] = [parseInt(config.color.slice(1, 3), 16), parseInt(config.color.slice(3, 5), 16), parseInt(config.color.slice(5, 7), 16)];
            mainGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.8})`);
            mainGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.2})`);
            mainGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            context.fillStyle = mainGradient;
            context.beginPath();
            context.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
            context.fill();
            
            // --- Draw touch pulses ---
            const now = Date.now();
            touchPulsesRef.current = touchPulsesRef.current.filter(pulse => {
                const age = now - pulse.startTime;
                return age < TOUCH_PULSE_LIFESPAN_MS;
            });

            touchPulsesRef.current.forEach(pulse => {
                const age = now - pulse.startTime;
                const progress = age / TOUCH_PULSE_LIFESPAN_MS;
                const radius = TOUCH_PULSE_MAX_RADIUS * Math.sin(progress * Math.PI); // Sin wave for smooth expand/contract
                const opacity = 1 - progress;

                const touchGradient = context.createRadialGradient(pulse.x / dpr, pulse.y / dpr, 0, pulse.x / dpr, pulse.y / dpr, radius);
                touchGradient.addColorStop(0, `rgba(200, 225, 255, ${opacity * 0.5})`);
                touchGradient.addColorStop(0.8, `rgba(100, 150, 255, ${opacity * 0.1})`);
                touchGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

                context.fillStyle = touchGradient;
                context.beginPath();
                context.arc(pulse.x / dpr, pulse.y / dpr, radius, 0, Math.PI * 2);
                context.fill();
            });

            animationFrameId.current = requestAnimationFrame(render);
        };
        
        render();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('touchstart', handleTouchStart);
        };
    }, [state, devParamsOverride]);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full cursor-pointer" />;
};
