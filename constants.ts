export const MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const COLORS = {
  primary: 0x00ffff,
  secondary: 0x0088ff,
  alert: 0xff3333,
  grid: 0x003333
};

// Earth texture map
export const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
export const EARTH_BUMP_URL = "https://unpkg.com/three-globe/example/img/earth-topology.png";

// Interaction Thresholds
export const PINCH_THRESHOLD = 0.05; // Distance between thumb and index tip
export const DRAG_SMOOTHING = 0.15;
export const ROTATION_SENSITIVITY = 5.0;

export const CONTINENTS = [
  { name: "亚洲 (ASIA)", start: 60, end: 150 },
  { name: "太平洋 (PACIFIC)", start: 150, end: 230 },
  { name: "美洲 (AMERICAS)", start: 230, end: 330 },
  { name: "大西洋 (ATLANTIC)", start: 330, end: 360 }, // Loop wrap
  { name: "大西洋 (ATLANTIC)", start: 0, end: 30 },
  { name: "欧洲/非洲 (EMEA)", start: 30, end: 60 },
];