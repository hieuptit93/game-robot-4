export interface GameState {
  score: number;
  comboStreak: number;
  isComboActive: boolean;
  timerValue: number;
  towerBlocks: TowerBlock[];
  fallenBlocks: number;
  isGameOver: boolean;
  isGameStarted: boolean;
  currentChunk: string;
  fluencyLevel: 'perfect' | 'minor' | 'failure' | 'neutral';
  feedbackText: string;
}

export interface TowerBlock {
  id: string;
  type: 'perfect' | 'minor' | 'failure';
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  glowColor: string;
}

export type InputType = 'A' | 'S' | 'D';

export interface AudioManager {
  playSound: (type: 'perfect' | 'minor' | 'failure' | 'combo' | 'collapse') => void;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}