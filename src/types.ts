export type SquishyShape = 'bun' | 'cheese' | 'cat' | 'toast' | 'peach' | 'avocado' | 'tomato';

export type SquishyMaterialType = 'matte' | 'glossy' | 'velvet';

export type FaceExpression = 'happy' | 'winking' | 'shocked' | 'sleepy' | 'sparkle' | 'none';

export type InteractionMode = 'poke' | 'squish' | 'stretch' | 'rotate';

export type RecoverySpeed = 'super_slow' | 'slow' | 'medium' | 'fast';

export interface BackgroundConfig {
  type: 'color' | 'image';
  color: string;
  imageUrl: string | null;
  blur: number; // in pixels
}

export interface SquishyConfig {
  shape: SquishyShape;
  color: string;
  materialType: SquishyMaterialType;
  expression: FaceExpression;
  recoverySpeed: RecoverySpeed;
  soundEnabled: boolean;
  soundVolume: number;
}

export interface StressStats {
  stressLevel: number; // 0 - 100
  totalSquishes: number;
  comboCount: number;
  maxCombo: number;
  zenUnlocked: boolean;
}

export interface ShapeInfo {
  id: SquishyShape;
  name: string;
  vietnameseName: string;
  defaultColor: string;
  description: string;
  emoji: string;
}
