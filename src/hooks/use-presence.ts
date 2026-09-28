import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useCompanion } from '@/state/companion';

/**
 * How long you have to simply stay on the companion screen before it counts
 * as a real visit. Opening and leaving is not presence.
 */
export const PRESENCE_MS = 12_000;

/** Anything shorter than this is a mis-tap, not a visit worth recording. */
const MINIMUM_MS = 600;

export function usePresence(active: boolean): boolean {
  const { registerVisit } = useCompanion();
  const startRef = useRef<number | null>(null);
  const recordedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);
  const [stayed, setStayed] = useState(false);

  activeRef.current = active;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    const start = startRef.current;
    if (start === null) return;
    const elapsed = Date.now() - start;
    startRef.current = null;
    clearTimer();
    if (elapsed < MINIMUM_MS) return;
    registerVisit({ t: start, present: recordedRef.current, ms: elapsed });
  }, [clearTimer, registerVisit]);

  const begin = useCallback(() => {
    if (startRef.current !== null) return;
    const start = Date.now();
    startRef.current = start;
    recordedRef.current = false;
    setStayed(false);
    timerRef.current = setTimeout(() => {
      if (startRef.current === null) return;
      recordedRef.current = true;
      registerVisit({ t: start, present: true, ms: Date.now() - start });
      setStayed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    }, PRESENCE_MS);
  }, [registerVisit]);

  const sensorConfirm = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' || typeof Accelerometer.addListener !== 'function') return;

    // Presence Ritual: detect face-down / screen-dimmed via sensors when available
    // Fallback: always rely on time-based timer; never block visit due to missing sensors
    let accelSub: any = null;
    try {
      Accelerometer.isAvailableAsync().then((avail) => {
        if (avail) {
          Accelerometer.setUpdateInterval(500);
          accelSub = Accelerometer.addListener(({ x, y, z }) => {
            // Face-down roughly: z near -9.8, x/y near 0; screen facing down
            const zGrav = Math.round(z);
            if (zGrav <= -7 && Math.abs(x) < 3 && Math.abs(y) < 3) {
              sensorConfirm.current = true;
            }
          });
        }
      });
    } catch (e) { /* sensors unavailable — graceful fallback to timer only */ }
    return () => {
      accelSub?.remove?.();
      try { Accelerometer.removeAllListeners?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (active) begin();
    else end();
  }, [active, begin, end]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') end();
      else if (activeRef.current) begin();
    });
    return () => {
      subscription.remove();
      end();
    };
  }, [begin, end]);

  return stayed;
}
