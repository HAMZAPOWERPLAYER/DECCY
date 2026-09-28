import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Visit } from './decay';

const KEY = 'decay.state.v1';

export type CompanionState = {
  version: 1;
  plantedAt: number | null;
  visits: Visit[];
  ambientOn: boolean;
  gentleReminderOn: boolean;
  onboarded: boolean;
  passedAt: number | null;
  seed: number;
};

export const EMPTY_STATE: CompanionState = {
  version: 1,
  plantedAt: null,
  visits: [],
  ambientOn: false,
  gentleReminderOn: false,
  onboarded: false,
  passedAt: null,
  seed: 0,
};

function isVisit(value: unknown): value is Visit {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Visit>;
  return typeof v.t === 'number' && typeof v.present === 'boolean' && typeof v.ms === 'number';
}

function sanitize(raw: string | null): CompanionState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<CompanionState>;
    if (!parsed || typeof parsed !== 'object') return EMPTY_STATE;
    return {
      version: 1,
      plantedAt: typeof parsed.plantedAt === 'number' ? parsed.plantedAt : null,
      visits: Array.isArray(parsed.visits) ? parsed.visits.filter(isVisit) : [],
      ambientOn: parsed.ambientOn === true,
      gentleReminderOn: parsed.gentleReminderOn === true,
      onboarded: parsed.onboarded === true,
      passedAt: typeof parsed.passedAt === 'number' ? parsed.passedAt : null,
      seed: typeof parsed.seed === 'number' && parsed.seed !== 0 ? parsed.seed : 0,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export async function loadState(): Promise<CompanionState> {
  try {
    return sanitize(await AsyncStorage.getItem(KEY));
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveState(state: CompanionState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // The app is fully offline; a failed write simply means the next read wins.
  }
}
