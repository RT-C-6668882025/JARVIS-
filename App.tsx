import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import CameraFeed from './components/CameraFeed';
import VisionManager from './components/VisionManager';
import HandVisualizer from './components/HandVisualizer';
import HologramEarth from './components/HologramEarth';
import HUDOverlay from './components/HUDOverlay';
import { HandResult, SystemStatus, GeoIntel, InteractionMode } from './types';

const App: React.FC = () => {
  // --- Refs for Performance ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // We use refs for 3D manipulation to bypass React render cycle for 60fps smoothness
  const earthRotationRef = useRef({ x: 0, y: 0 });
  const earthScaleRef = useRef(1.5);

  // --- State for UI ---
  const [handResults, setHandResults] = useState<HandResult | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    fps: 0,
    memory: 0,
    trackingConfidence: 0.98,
    activeHands: 0
  });
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.IDLE);
  const [geoIntel, setGeoIntel] = useState<GeoIntel>({
    continent: 'SCANNING...',
    lat: 34.0522,
    lon: 118.2437,
    population: 'UNK',
    activityLevel: 'LOW'
  });

  const handleSystemUpdate = (update: Partial<SystemStatus>) => {
    setSystemStatus(prev => ({ ...prev, ...update }));
  };

  const handleRegionChange = (regionName: string) => {
    // Only update if changed to avoid render thrashing
    if (geoIntel.continent !== regionName) {
      setGeoIntel(prev => ({
        ...prev,
        continent: regionName,
        population: (Math.random() * 1000 + 100).toFixed(1) + 'M',
        activityLevel: Math.random() > 0.7 ? 'HIGH' : 'MODERATE',
        lat: (Math.random() * 180) - 90,
        lon: (Math.random() * 360) - 180
      }));
    }
  };

  // Memoize window dimensions for visualizer
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden cursor-crosshair">
      
      {/* 1. Background Camera Feed */}
      <CameraFeed videoRef={videoRef} />

      {/* 2. Logic Layer (Vision) */}
      <VisionManager 
        videoRef={videoRef}
        onResults={setHandResults}
        onSystemUpdate={handleSystemUpdate}
        onInteractionMode={setInteractionMode}
        earthRotationRef={earthRotationRef}
        earthScaleRef={earthScaleRef}
        panelRef={panelRef}
      />

      {/* 3. 2D Canvas Layer (Hand Skeleton) */}
      <HandVisualizer 
        results={handResults} 
        width={dimensions.w} 
        height={dimensions.h} 
      />

      {/* 4. 3D WebGL Layer (Hologram) */}
      <div className="absolute top-0 left-0 w-1/2 h-full z-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.5} color="#00ffff" />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
          <HologramEarth 
            rotationRef={earthRotationRef} 
            scaleRef={earthScaleRef}
            onRegionChange={handleRegionChange}
          />
        </Canvas>
      </div>

      {/* 5. UI Overlay (HUD) */}
      <HUDOverlay 
        systemStatus={systemStatus} 
        geoIntel={geoIntel}
        interactionMode={interactionMode}
        panelRef={panelRef}
      />
      
    </div>
  );
};

export default App;