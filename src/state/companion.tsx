import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { computeDecay, type DecayState, type Visit } from '@/lib/decay';
import { EMPTY_STATE, loadState, saveState, type CompanionState } from '@/lib/storage';
import { syncWidget } from '@/lib/widget';

type CompanionContextValue = {
  status: 'loading' | 'ready';
  state: CompanionState;
  decay: DecayState;
  now: number;
  plant: () => void;
  registerVisit: (visit: Visit) => void;
  setAmbient: (on: boolean) => void;
};

const CompanionContext = createContext<CompanionContextValue | null>(null);

const IDLE_DECAY: DecayState = {
  ageDays: 0,
  neglectDays: 0,
  horizonDays: 170,
  stage: 0,
  dead: false,
};

function newSeed(): number {
  const n = Math.floor(Math.random() * 0xffffffff);
  return n === 0 ? 1 : n;
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CompanionState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    loadState().then((loaded) => {
      if (!cancelled) setState(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  // The world keeps turning while the app is open, too.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  // The home screen widget always mirrors what the app last saw.
  const decay = useMemo<DecayState>(() => {
    if (!state?.plantedAt) return IDLE_DECAY;
    return computeDecay({ plantedAt: state.plantedAt, visits: state.visits, now });
  }, [state, now]);

  useEffect(() => {
    if (!state || state.plantedAt === null) return;
    syncWidget(decay.stage);
  }, [decay.stage, state]);

  // The passing is recorded the first moment it is noticed.
  useEffect(() => {
    if (!state?.plantedAt) return;
    if (state.passedAt !== null) return;
    if (!decay.dead) return;
    setState((prev) => (prev && prev.passedAt === null ? { ...prev, passedAt: now } : prev));
  }, [state, decay.dead, now]);

  const plant = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setState((prev) =>
      prev
        ? {
            ...prev,
            onboarded: true,
            plantedAt: prev.plantedAt ?? at,
            passedAt: null,
            seed: prev.seed || newSeed(),
          }
        : { ...EMPTY_STATE, onboarded: true, plantedAt: at, passedAt: null, seed: newSeed() },
    );
  }, []);

  const registerVisit = useCallback((visit: Visit) => {
    setState((prev) => {
      if (!prev?.plantedAt) return prev;
      if (prev.passedAt !== null) return prev;
      const visits = prev.visits.filter((v) => v.t !== visit.t);
      visits.push(visit);
      visits.sort((a, b) => a.t - b.t);
      return { ...prev, visits };
    });
    setNow(Date.now());
  }, []);

  const setAmbient = useCallback((on: boolean) => {
    setState((prev) => (prev ? { ...prev, ambientOn: on } : prev));
  }, []);

  const value = useMemo<CompanionContextValue>(
    () => ({
      status: state ? 'ready' : 'loading',
      state: state ?? EMPTY_STATE,
      decay,
      now,
      plant,
      registerVisit,
      setAmbient,
    }),
    [state, decay, now, plant, registerVisit, setAmbient],
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}

export function useCompanion(): CompanionContextValue {
  const context = useContext(CompanionContext);
  if (!context) throw new Error('useCompanion must be used inside CompanionProvider');
  return context;
}
