import type { StageIndex } from '@/lib/decay';

export const colors = {
  /** deep charcoal-black → deep navy, almost void */
  voidTop: '#0B0D12',
  voidBottom: '#12151C',
  /** warm off-white, never pure white */
  ink: '#F0EDE6',
  inkDim: 'rgba(240, 237, 230, 0.60)',
  inkFaint: 'rgba(240, 237, 230, 0.36)',
  inkGhost: 'rgba(240, 237, 230, 0.16)',
  hairline: 'rgba(240, 237, 230, 0.10)',
  gold: '#E8C888',
  amber: '#D9A86A',
  teal: '#8FA3B0',
  lavender: '#A594C4',
} as const;

export const fonts = {
  serif: 'Fraunces_400Regular',
  serifLight: 'Fraunces_300Light',
  serifMedium: 'Fraunces_500Medium',
  serifItalic: 'Fraunces_400Regular_Italic',
  serifSemi: 'Fraunces_600SemiBold',
  sans: 'SourceSans3_400Regular',
  sansLight: 'SourceSans3_300Light',
  sansMedium: 'SourceSans3_500Medium',
  sansSemi: 'SourceSans3_600SemiBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  huge: 72,
} as const;

export type StageVisual = {
  stage: StageIndex;
  name: string;
  /** colour the glow is tinted toward */
  tint: string;
  /** colour of the bright centre */
  core: string;
  opacity: number;
  scale: number;
  /** seconds for one full breath */
  breath: number;
  /** how much the form swells with each breath */
  breathAmplitude: number;
  /** opacity of the fracture overlay */
  cracks: number;
  flicker: boolean;
};

export const STAGE_VISUALS: StageVisual[] = [
  {
    stage: 0,
    name: 'Vibrant',
    tint: colors.gold,
    core: '#FFF7E8',
    opacity: 1,
    scale: 1,
    breath: 5.5,
    breathAmplitude: 0.05,
    cracks: 0,
    flicker: false,
  },
  {
    stage: 1,
    name: 'Dimming',
    tint: '#D8C1A2',
    core: '#F6E9D8',
    opacity: 0.88,
    scale: 0.97,
    breath: 6.5,
    breathAmplitude: 0.038,
    cracks: 0,
    flicker: false,
  },
  {
    stage: 2,
    name: 'Fading',
    tint: '#B3B9B6',
    core: '#E8E9E6',
    opacity: 0.7,
    scale: 0.93,
    breath: 7.5,
    breathAmplitude: 0.028,
    cracks: 0.12,
    flicker: false,
  },
  {
    stage: 3,
    name: 'Cracking',
    tint: colors.teal,
    core: '#D5DEE4',
    opacity: 0.55,
    scale: 0.88,
    breath: 8.5,
    breathAmplitude: 0.02,
    cracks: 0.6,
    flicker: false,
  },
  {
    stage: 4,
    name: 'Barely Holding On',
    tint: colors.lavender,
    core: '#DCD4EA',
    opacity: 0.34,
    scale: 0.8,
    breath: 10,
    breathAmplitude: 0.014,
    cracks: 0.3,
    flicker: true,
  },
  {
    stage: 5,
    name: 'Passing',
    tint: '#7A7488',
    core: '#B8B2C4',
    opacity: 0.12,
    scale: 0.72,
    breath: 12,
    breathAmplitude: 0.01,
    cracks: 0.18,
    flicker: true,
  },
];

export function stageVisual(stage: StageIndex): StageVisual {
  return STAGE_VISUALS[Math.max(0, Math.min(stage, STAGE_VISUALS.length - 1))];
}

/** Seasons of Light — extremely subtle time-of-day tint on background glow */
export function seasonTint(): string {
  const hour = new Date().getHours();
  // Warm amber around sunset (17-20), cool lavender at late night (0-4), neutral else
  if (hour >= 17 && hour <= 20) return 'rgba(232, 200, 136, 0.06)';
  if (hour >= 0 && hour <= 4) return 'rgba(165, 148, 196, 0.05)';
  return 'rgba(240, 237, 230, 0.03)';
}
