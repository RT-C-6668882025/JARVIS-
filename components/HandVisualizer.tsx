import React, { useEffect, useRef } from 'react';
import { HandResult } from '../types';

interface HandVisualizerProps {
  results: HandResult | null;
  width: number;
  height: number;
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
];

const HandVisualizer: React.FC<HandVisualizerProps> = ({ results, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!results || !results.landmarks) return;

    // Drawing settings
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';

    for (const landmarks of results.landmarks) {
      // Draw Connections
      for (const [start, end] of CONNECTIONS) {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }

      // Draw Landmarks
      for (const point of landmarks) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [results, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
};

export default HandVisualizer;