import React, { useEffect, useState } from 'react';
import { Activity, Battery, Wifi, Globe, MapPin, Fingerprint, Lock, Cpu } from 'lucide-react';
import { GeoIntel, InteractionMode, SystemStatus } from '../types';

interface HUDOverlayProps {
  systemStatus: SystemStatus;
  geoIntel: GeoIntel;
  interactionMode: InteractionMode;
  panelRef: React.RefObject<HTMLDivElement>;
}

const RandomHex = () => {
  const [hex, setHex] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      let str = '';
      for (let i = 0; i < 4; i++) {
        str += Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0') + ' ';
      }
      setHex(str);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return <div className="text-xs text-cyan-500/50 font-mono-tech">{hex}</div>;
};

const HUDOverlay: React.FC<HUDOverlayProps> = ({ systemStatus, geoIntel, interactionMode, panelRef }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 font-mono-tech">
      {/* Top Left: System Status */}
      <div className="absolute top-4 left-4 p-4 border-l-2 border-cyan-400 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-xl font-bold text-cyan-400 tracking-widest">SYSTEM_ONLINE</h2>
        </div>
        <div className="space-y-1 text-sm text-cyan-200">
          <div className="flex justify-between w-48">
            <span>FPS:</span>
            <span className="font-bold">{Math.round(systemStatus.fps)}</span>
          </div>
          <div className="flex justify-between w-48">
            <span>MEM:</span>
            <span>{systemStatus.memory} MB</span>
          </div>
          <div className="flex justify-between w-48">
            <span>CONFIDENCE:</span>
            <span>{(systemStatus.trackingConfidence * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-1 w-full bg-cyan-900 rounded">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_10px_#00ffff]" 
              style={{ width: `${systemStatus.trackingConfidence * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-4 border-t border-cyan-800 pt-2">
           <RandomHex />
           <RandomHex />
           <RandomHex />
        </div>
      </div>

      {/* Top Right: Header */}
      <div className="absolute top-4 right-4 text-right">
        <h1 className="text-6xl font-bold text-cyan-400 text-glow tracking-tighter" style={{ fontFamily: 'Rajdhani' }}>
          J.A.R.V.I.S.
        </h1>
        <div className="flex items-center justify-end gap-4 mt-2 text-cyan-200">
          <span className="text-2xl">{time.toLocaleTimeString()}</span>
          <div className="flex gap-2">
            <Wifi className="w-5 h-5 animate-pulse" />
            <Battery className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-cyan-600 tracking-[0.5em]">
          INTELLIGENT COMPUTING SYSTEM V4.0.2
        </div>
      </div>

      {/* Center Reticle (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyan-500/20 rounded-full flex items-center justify-center opacity-30">
        <div className="w-60 h-60 border border-cyan-500/10 rounded-full border-dashed animate-spin-slow"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#00ffff]"></div>
      </div>

      {/* Bottom Left: Interaction State */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Fingerprint className="w-6 h-6" />
          <span className="text-lg font-bold">BIO-METRIC INPUT</span>
        </div>
        <div className="bg-black/50 border border-cyan-500/50 p-3 rounded-tr-xl w-64">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs text-cyan-300">HANDS DETECTED:</span>
             <span className="text-lg font-bold text-cyan-400">{systemStatus.activeHands}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-xs text-cyan-300">CURRENT MODE:</span>
             <span className={`text-sm font-bold px-2 py-0.5 rounded ${
               interactionMode === InteractionMode.IDLE ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-400 text-black'
             }`}>
               {interactionMode}
             </span>
           </div>
        </div>
      </div>

      {/* Floating Panel (Controlled by Right Hand) */}
      <div 
        ref={panelRef}
        className="absolute w-80 bg-black/80 backdrop-blur-md border border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.2)] rounded-bl-3xl transition-transform duration-75"
        style={{ top: '20%', right: '5%', transform: 'translate3d(0,0,0)' }} // Initial
      >
        <div className="h-1 bg-cyan-400 w-full shadow-[0_0_10px_#00ffff]"></div>
        <div className="p-5">
           <div className="flex items-center gap-3 mb-4 border-b border-cyan-800 pb-2">
              <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
              <h3 className="text-xl font-bold text-cyan-100">GEO-INTEL</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                <span className="text-xs text-cyan-500 block mb-1">TARGET REGION</span>
                <span className="text-2xl font-bold text-white tracking-wider">{geoIntel.continent}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-xs text-cyan-500 block">LATITUDE</span>
                   <span className="text-lg text-cyan-200">{geoIntel.lat.toFixed(4)}°N</span>
                </div>
                <div>
                   <span className="text-xs text-cyan-500 block">LONGITUDE</span>
                   <span className="text-lg text-cyan-200">{geoIntel.lon.toFixed(4)}°W</span>
                </div>
              </div>

              <div>
                 <span className="text-xs text-cyan-500 block mb-1">DATA STREAM</span>
                 <div className="h-24 bg-cyan-900/20 rounded border border-cyan-800/50 p-2 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
                    <div className="text-[10px] text-cyan-400/70 space-y-1 font-mono leading-tight">
                       <p>> SCANNING SECTOR 7G...</p>
                       <p>> POPULATION: {geoIntel.population}</p>
                       <p>> ATMOSPHERE: STABLE</p>
                       <p>> THREAT LEVEL: 0.00%</p>
                       <p>> UPLINK ESTABLISHED</p>
                       <p>> ENCRYPTING PACKETS...</p>
                       <RandomHex />
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                 <div className="flex gap-2 items-center">
                    <Lock className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs text-cyan-600">SECURE CHANNEL</span>
                 </div>
                 <span className={`text-xs px-2 py-1 rounded font-bold ${
                    geoIntel.activityLevel === 'HIGH' ? 'bg-red-900 text-red-100' : 'bg-cyan-900 text-cyan-100'
                 }`}>
                   {geoIntel.activityLevel} ACT
                 </span>
              </div>
           </div>
        </div>
        {/* Decorative Corner */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
      </div>

      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanline z-50 opacity-30 pointer-events-none"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};

export default HUDOverlay;