import React, { useEffect, useRef } from 'react';
import type { GraphNode, GraphLink } from '../types';

declare const d3: any;

interface DependencyGraphProps {
    nodes: GraphNode[];
    links: (Omit<GraphLink, 'source' | 'target'> & { source: string, target: string })[];
    highlightedNode: string | null;
    impactAnalysis: { source: string[], affected: string[] } | null;
}

const PARTICLE_ATTRACTION = 0.01;
const PARTICLE_TURBULENCE = 0.2;
const PARTICLE_DRAG = 0.95;

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ nodes: initialNodes, links, highlightedNode, impactAnalysis }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!ref.current || !initialNodes.length) return;

        const canvas = ref.current;
        const parent = canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext('2d');
        if (!context) return;
        context.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Initialize or update particles
        if (particlesRef.current.length !== initialNodes.length) {
            particlesRef.current = initialNodes.map(node => ({
                id: node.id,
                isDead: node.isDead,
                isCircular: node.isCircular,
                heat: node.heat,
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                targetX: width / 2,
                targetY: height / 2,
            }));
        } else {
             particlesRef.current.forEach(p => {
                const node = initialNodes.find(n => n.id === p.id);
                if(node) {
                    p.isDead = node.isDead;
                    p.isCircular = node.isCircular;
                    p.heat = node.heat;
                }
             });
        }

        const simulation = d3.forceSimulation(initialNodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .stop();

        simulation.tick(300);

        initialNodes.forEach((node: any) => {
            const particle = particlesRef.current.find(p => p.id === node.id);
            if (particle) {
                particle.targetX = node.x;
                particle.targetY = node.y;
            }
        });

        let animationFrameId: number;

        const getHeatColor = (heat: number): string => {
             const r = Math.floor(255 * heat);
             const g = Math.floor(255 * (1 - heat));
             return `rgb(${r}, ${g}, 0)`;
        };

        const animate = () => {
            context.clearRect(0, 0, width, height);

            const isSimulating = impactAnalysis !== null;
            const sourceNodes = impactAnalysis?.source || [];
            const affectedNodes = impactAnalysis?.affected || [];
            
            // Draw links
            context.globalAlpha = isSimulating ? 0.1 : 1;
            context.strokeStyle = 'rgba(150, 150, 150, 0.2)';
            context.lineWidth = 1;
            links.forEach((link: any) => {
                const sourceParticle = particlesRef.current.find(p => p.id === (typeof link.source === 'object' ? link.source.id : link.source));
                const targetParticle = particlesRef.current.find(p => p.id === (typeof link.target === 'object' ? link.target.id : link.target));
                if (sourceParticle && targetParticle) {
                    context.beginPath();
                    context.moveTo(sourceParticle.x, sourceParticle.y);
                    context.lineTo(targetParticle.x, targetParticle.y);
                    context.stroke();
                }
            });
            context.globalAlpha = 1;
            
            // Update and draw particles
            particlesRef.current.forEach(p => {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                p.vx += dx * PARTICLE_ATTRACTION;
                p.vy += dy * PARTICLE_ATTRACTION;
                p.vx += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vy += (Math.random() - 0.5) * PARTICLE_TURBULENCE;
                p.vx *= PARTICLE_DRAG;
                p.vy *= PARTICLE_DRAG;
                p.x += p.vx;
                p.y += p.vy;

                const isHighlighted = highlightedNode === p.id;
                const isSource = sourceNodes.includes(p.id);
                const isAffected = affectedNodes.includes(p.id);

                let radius = isHighlighted ? 12 : 8;
                let color = getHeatColor(p.heat);
                context.globalAlpha = 1.0;
                
                if (p.isCircular) color = '#FF0000';
                if (p.isDead) color = '#FF8C00';

                if (isSimulating) {
                    if (isSource) {
                        radius = 15;
                        color = '#FFFFFF';
                        context.shadowColor = color;
                        context.shadowBlur = 20;
                    } else if (isAffected) {
                        radius = 10;
                        color = '#00FFFF';
                        context.shadowColor = color;
                        context.shadowBlur = 15;
                    } else {
                        context.globalAlpha = 0.2;
                    }
                } else if (isHighlighted) {
                     context.shadowColor = '#00FFFF';
                     context.shadowBlur = 15;
                     color = '#00FFFF';
                } else {
                     context.shadowColor = color;
                     context.shadowBlur = 5 + p.heat * 10;
                }

                context.beginPath();
                context.arc(p.x, p.y, radius, 0, Math.PI * 2);
                context.fillStyle = color;
                context.fill();
                context.shadowBlur = 0;

                context.fillStyle = `rgba(255, 255, 255, ${isSimulating ? context.globalAlpha : 0.8})`;
                context.font = '10px sans-serif';
                context.fillText(p.id.split('/').pop()?.replace('.ts','').replace('.tsx',''), p.x + radius + 2, p.y + 4);
                
                context.globalAlpha = 1.0;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [initialNodes, links, highlightedNode, impactAnalysis]);

    return <canvas ref={ref}></canvas>;
};
