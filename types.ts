export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  landmarks: HandLandmark[][];
  handedness: { index: number; score: number; categoryName: string; displayName: string }[];
}

export interface SystemStatus {
  fps: number;
  memory: number;
  trackingConfidence: number;
  activeHands: number;
}

export interface GeoIntel {
  continent: string;
  lat: number;
  lon: number;
  population: string;
  activityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export enum InteractionMode {
  IDLE = '待机',
  ROTATING = '旋转中',
  SCALING = '缩放中',
  DRAGGING = '拖拽中',
}