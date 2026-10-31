// src/features/failure-prediction/types.js
export const COMPONENT_TYPES = {
  BATTERY: 'battery',
  SCREEN: 'screen',
  MOTHERBOARD: 'motherboard',
  RAM: 'ram',
  STORAGE: 'storage',
  FAN: 'fan',
  POWER_SUPPLY: 'power_supply',
  KEYBOARD: 'keyboard',
  TRACKPAD: 'trackpad',
  CAMERA: 'camera',
  SPEAKER: 'speaker',
  PORTS: 'ports'
};

export const RISK_LEVELS = {
  LOW: { level: 'low', color: 'green', score: 0 },
  MEDIUM: { level: 'medium', color: 'yellow', score: 1 },
  HIGH: { level: 'high', color: 'orange', score: 2 },
  CRITICAL: { level: 'critical', color: 'red', score: 3 }
};