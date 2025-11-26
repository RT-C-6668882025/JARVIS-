import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { MODEL_ASSET_PATH, PINCH_THRESHOLD, DRAG_SMOOTHING, ROTATION_SENSITIVITY } from '../constants';
import { HandResult, InteractionMode, SystemStatus } from '../types';

interface VisionManagerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onResults: (results: HandResult) => void;
  onSystemUpdate: (stats: Partial<SystemStatus>) => void;
  onInteractionMode: (mode: InteractionMode) => void;
  earthRotationRef: React.MutableRefObject<{ x: number; y: number }>;
  earthScaleRef: React.MutableRefObject<number>;
  panelRef: React.RefObject<HTMLDivElement>;
}

const VisionManager: React.FC<VisionManagerProps> = ({
  videoRef,
  onResults,
  onSystemUpdate,
  onInteractionMode,
  earthRotationRef,
  earthScaleRef,
  panelRef
}) => {
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Interaction State Refs (avoid re-renders)
  const prevLeftHandPos = useRef<{x: number, y: number} | null>(null);
  const prevPinchDist = useRef<number | null>(null);
  const panelPos = useRef<{x: number, y: number}>({ x: window.innerWidth * 0.7, y: window.innerHeight * 0.2 });

  const initializeVision = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.7
      });
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load vision tasks:", error);
    }
  };

  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const processFrame = () => {
    if (videoRef.current && landmarkerRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      let startTimeMs = performance.now();

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
        
        // Broadcast raw results for visualizer
        onResults(results as unknown as HandResult);
        
        // --- INTERACTION LOGIC ---
        let currentMode = InteractionMode.IDLE;
        let activeHandsCount = results.landmarks.length;

        results.landmarks.forEach((landmarks, index) => {
          const handedness = results.handedness[index][0];
          // Note: MediaPipe mirrored video: Left hand appears on right of screen, but is labeled "Left".
          // We will use screen position X to determine controls.
          // < 0.5 screen width = Earth Control
          // > 0.5 screen width = Panel Control
          
          // Landmarks: 4=ThumbTip, 8=IndexTip, 9=MiddleMCP(Palm Center approx)
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const palmCenter = landmarks[9]; // Using Middle MCP as stable point
          
          const pinchDist = getDistance(thumbTip, indexTip);
          const isPinching = pinchDist < PINCH_THRESHOLD;

          // LEFT SIDE OF SCREEN (Mirroring: x is 0-1 from left to right)
          // Actually, in mirrored video, your real left hand appears on the left side (x < 0.5) if css transform scaleX(-1) is applied.
          // Assuming we flip video in CSS, then logic corresponds to visual position.
          // Let's assume Landmarks are normalized 0..1.
          
          if (palmCenter.x < 0.55) {
            // === EARTH CONTROL ===
            
            // 1. Rotation (Move Hand)
            if (prevLeftHandPos.current) {
               const deltaX = palmCenter.x - prevLeftHandPos.current.x;
               const deltaY = palmCenter.y - prevLeftHandPos.current.y;
               
               // Only rotate if not pinching (pinching is for scale)
               if (!isPinching) {
                  earthRotationRef.current.y += deltaX * ROTATION_SENSITIVITY;
                  earthRotationRef.current.x += deltaY * ROTATION_SENSITIVITY;
                  currentMode = InteractionMode.ROTATING;
               }
            }
            prevLeftHandPos.current = { x: palmCenter.x, y: palmCenter.y };

            // 2. Scaling (Pinch Distance change)
            if (prevPinchDist.current !== null && isPinching === false) {
               // Reset pinch reference when not pinching to avoid jumps
               prevPinchDist.current = null;
            }

            // Using two hands for pinch is standard, but here we use thumb-index distance of one hand
            // Map distance to scale.
            // Actually, "Pinch to scale" usually means relative change. 
            // Let's change scaling logic: Spread fingers = bigger, Pinch fingers = smaller? 
            // Or just map Y position to scale?
            // Let's stick to the prompt: "Thumb and Index distance detection".
            
            const rawDist = getDistance(thumbTip, indexTip);
            // Normalize distance approx 0.02 to 0.2
            const targetScale = 1.0 + (rawDist * 8); // Base 1, max approx 2.5
            
            // Apply smoothing
            const diff = targetScale - earthScaleRef.current;
            if (Math.abs(diff) > 0.01) {
              earthScaleRef.current += diff * 0.1;
              currentMode = InteractionMode.SCALING;
            }

          } else {
            // === PANEL CONTROL (Right Side) ===
            
            if (isPinching) {
               currentMode = InteractionMode.DRAGGING;
               
               // Map normalized coordinates to screen pixels
               // Flip X because of mirrored view if needed, but landmarks are 0-1 relative to image
               const targetX = (1 - palmCenter.x) * window.innerWidth; // Flip X for intuitive drag
               const targetY = palmCenter.y * window.innerHeight;

               // Update Panel Position directly via DOM for performance
               if (panelRef.current) {
                  // Smooth lerp
                  panelPos.current.x += (targetX - panelPos.current.x) * DRAG_SMOOTHING;
                  panelPos.current.y += (targetY - panelPos.current.y) * DRAG_SMOOTHING;
                  
                  panelRef.current.style.transform = `translate3d(${panelPos.current.x - 160}px, ${panelPos.current.y - 100}px, 0)`;
               }
            }
          }
        });

        // Reset state if no hands
        if (activeHandsCount === 0) {
           prevLeftHandPos.current = null;
           prevPinchDist.current = null;
        }

        onInteractionMode(currentMode);
        
        // System Stats Update
        const processingTime = performance.now() - startTimeMs;
        // Estimate FPS based on processing time
        const instantaneousFps = 1000 / Math.max(processingTime, 16); 
        
        onSystemUpdate({
           fps: instantaneousFps,
           activeHands: activeHandsCount,
           // @ts-ignore - memory API is not standard but useful for HUD
           memory: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0
        });
      }
    }
    requestRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    initializeVision();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      processFrame();
    }
  }, [isLoaded]);

  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black text-cyan-400 font-mono">
          <div className="text-center">
            <div className="mb-4 animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
            <p>INITIALIZING VISION SYSTEMS...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default VisionManager;