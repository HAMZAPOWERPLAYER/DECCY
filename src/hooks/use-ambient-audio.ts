import { useEffect, useRef, useCallback } from 'react';
import { Audio, useAudioPlayer } from 'expo-av';
import { useCompanion } from '@/state/companion';
import { SEGMENTS, STAGE_VOLUME, STAGE_RATE, PIANO_SOURCE } from '@/lib/stage-sound';

/**
 * Stage-based piano sound — single source loop, runtime segments.
 * Rules preserved: opt-in only (state.ambientOn), silent-mode respected,
 * crossfade 2-3s between stages, visual parity when muted.
 */
export function useAmbientAudio(active: boolean): void {
  const { state } = useCompanion();
  const stage = state?.stage ?? 0;
  const ambientOn = state?.ambientOn ?? false;

  // Main stage player (source loop, trimmed per stage via position management)
  const main = useAudioPlayer(PIANO_SOURCE, { loop: true, volume: 0.7 });
  // Second player for crossfade shadow / death sequence overlay
  const shadow = useAudioPlayer(PIANO_SOURCE, { loop: true, volume: 0.0 });

  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Preload both at launch — no stutter on stage change
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(() => {});
  }, []);

  // Crossfade + stage sound control
  useEffect(() => {
    if (!main || !shadow) return;

    const s = stageRef.current;
    const vol = STAGE_VOLUME[s] ?? 0.4;
    const rate = STAGE_RATE[s] ?? 1.0;

    // If sound disabled or screen not active, fade both out gently
    if (!ambientOn || !active) {
      main.volume = 0;
      shadow.volume = 0;
      try { main.pause(); shadow.pause(); } catch {}
      return;
    }

    // Play / resume with correct segment start
    try {
      if (main.status?.isLoaded && !main.isPlaying) main.play();
      if (shadow.status?.isLoaded && !shadow.isPlaying) shadow.play();
    } catch {}

    // Rate / volume per stage
    try {
      main.setRateAsync?.(rate)?.catch(() => {});
      main.volume = vol;
      shadow.volume = 0; // shadow inactive unless death sequence
    } catch {}

    // Position to segment start when stage changes (approximate phrase begin)
    const seg = SEGMENTS[s >= 5 ? 'deathFull' : (s === 0 ? 'vibrant' : s === 1 ? 'dimming' : s === 2 ? 'fading' : s === 3 ? 'cracking' : 'barely')];
    const startSec = seg.start ?? 0;
    try { if (main.status?.isLoaded) main.setPositionAsync(startSec * 1000); } catch {}
  }, [main, shadow, stage, ambientOn, active]);

  // Death sequence: Barely → 3s silence → full fade-in under cert (handled externally via state.passedAt)
  useEffect(() => {
    if (!main || !shadow || stage < 5) return;
    // Stage 5 (Passing): silence first 3s, then fade full
    const timer = setTimeout(() => {
      try {
        // Fade in full original at slightly elevated volume under cert
        shadow.setRateAsync?.(1.05)?.catch(() => {});
        shadow.volume = 0.7;
        shadow.play();
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [main, shadow, stage]);

  // Loop full at low volume on Certificate screen; fade clean on navigate away
  useEffect(() => {
    if (!main || !shadow) return;
    const isCert = active; // caller passes active=true when on cert; false when leaving
    // When on cert after death, keep shadow (full) low and fading in; when leaving, fade both
    if (isCert && stage >= 5) {
      try { shadow.volume = Math.min(0.5, (shadow.volume ?? 0) + 0.05); } catch {}
    } else {
      // Fading out clean — not a cut
      try { main.volume = Math.max(0, (main.volume ?? 0) - 0.05); shadow.volume = Math.max(0, (shadow.volume ?? 0) - 0.05); } catch {}
      if ((main.volume ?? 1) <= 0.05) try { main.pause(); } catch {}
      if ((shadow.volume ?? 1) <= 0.05) try { shadow.pause(); } catch {}
    }
  }, [main, shadow, active, stage]);

  // Cleanup on unmount
  useEffect(() => () => { try { main.pause(); shadow.pause(); } catch {} }, [main, shadow]);
}
