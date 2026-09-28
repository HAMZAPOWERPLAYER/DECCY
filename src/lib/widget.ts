import { NativeModules, Platform } from 'react-native';

import type { StageIndex } from '@/lib/decay';

type DecayWidgetNative = {
  setStage(stage: number): void;
  refresh(): void;
};

const native =
  Platform.OS === 'android'
    ? (NativeModules.DecayWidget as DecayWidgetNative | undefined)
    : undefined;

/**
 * Mirror the current decay stage onto the home screen widget. The widget is
 * the part of Decay people see when the app is closed, so it is kept in step
 * whenever the app is opened or the companion changes state.
 */
export function syncWidget(stage: StageIndex): void {
  if (!native) return;
  try {
    native.setStage(stage);
  } catch {
    // Running in Expo Go or on a build without the widget module.
  }
}
