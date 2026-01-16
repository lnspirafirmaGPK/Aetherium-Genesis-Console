
import React, { useEffect, useRef } from 'react';
import type { GraphNode, GraphLink } from '../types';

declare const d3: any;

interface DependencyGraphProps {
    nodes: GraphNode[];
    // FIX: The `links` prop should be an array of link objects.
    links: (Omit<GraphLink, 'source' | 'target'> & { source: string, target: string })[];
    highlightedNode: string | null;
}

const PARTICLE_ATTRACTION = 0.01;
const PARTICLE_TURBULENCE = 0.2;
const PARTICLE_DRAG = 0.95;

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ nodes: initialNodes, links, highlightedNode }) => {
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
        
        // Initialize particles if they don't exist
        if (particlesRef.current.length !== initialNodes.length) {
            particlesRef.current = initialNodes.map(node => ({
                id: node.id,
                isDead: node.isDead,
                isCircular: node.isCircular,
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                targetX: width / 2,
                targetY: height / 2,
            }));
        } else {
            // Update properties of existing particles
             particlesRef.current.forEach(p => {
                const node = initialNodes.find(n => n.id === p.id);
                if(node) {
                    p.isDead = node.isDead;
                    p.isCircular = node.isCircular;
                }
             });
        }


        // Use D3 force simulation to calculate target positions without rendering SVG
        const simulation = d3.forceSimulation(initialNodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .stop();

        simulation.tick(300); // Run simulation ticks to settle the layout

        // Update particle target positions from simulation
        initialNodes.forEach((node: any) => {
            const particle = particlesRef.current.find(p => p.id === node.id);
            if (particle) {
                particle.targetX = node.x;
                particle.targetY = node.y;
            }
        });

        let animationFrameId: number;

        const animate = () => {
            context.clearRect(0, 0, width, height);

            // Draw links
            context.strokeStyle = 'rgba(150, 150, 150, 0.2)';
            context.lineWidth = 1;
            links.forEach((link: any) => {
                const source = particlesRef.current.find(p => p.id === link.source.id);
                const target = particlesRef.current.find(p => p.id === link.target.id);
                if (source && target) {
                    context.beginPath();
                    context.moveTo(source.x, source.y);
                    context.lineTo(target.x, target.y);
                    context.stroke();
                }
            });
            
            // Update and draw particles
            particlesRef.current.forEach(p => {
                // Physics
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

                // Drawing
                const isHighlighted = highlightedNode === p.id;
                const radius = isHighlighted ? 12 : 8;
                
                context.beginPath();
                context.arc(p.x, p.y, radius, 0, Math.PI * 2);

                let color = '#00BFFF'; // Stable
                if(p.isCircular) color = '#FF0000'; // Danger
                if(p.isDead) color = '#FF8C00'; // Busy/Warning

                if (isHighlighted) {
                     context.shadowColor = '#00FFFF';
                     context.shadowBlur = 15;
                     color = '#00FFFF';
                } else {
                     context.shadowColor = color;
                     context.shadowBlur = 5;
                }

                context.fillStyle = color;
                context.fill();

                // Reset shadow for next particle
                context.shadowBlur = 0;

                // Draw label
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.font = '10px sans-serif';
                context.fillText(p.id.split('/').pop()?.replace('.ts','').replace('.tsx',''), p.x + radius + 2, p.y + 4);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [initialNodes, links, highlightedNode]);

    return <canvas ref={ref}></canvas>;
};
