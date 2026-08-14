import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BINS, VEHICLE, type StopStatus } from "./driver-data";

type Collected = Record<string, { at: string; photo: string | null }>;

type DriverState = {
  onDuty: boolean;
  routeStarted: boolean;
  loadKg: number;
  collected: Collected;
  dutyStartedAt: string | null;
};

const STORAGE_KEY = "civicsync-driver-state";

const initialState: DriverState = {
  onDuty: false,
  routeStarted: false,
  loadKg: 0,
  collected: {},
  dutyStartedAt: null,
};

type Ctx = {
  state: DriverState;
  hydrated: boolean;
  setOnDuty: (value: boolean) => void;
  startRoute: () => void;
  markCollected: (binId: string, photo: string | null) => void;
  stopStatus: (binId: string) => StopStatus;
  nextBinId: string | null;
  collectedCount: number;
  distanceDoneKm: number;
};

const DriverContext = createContext<Ctx | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DriverState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setOnDuty = useCallback((value: boolean) => {
    setState((s) => ({
      ...s,
      onDuty: value,
      dutyStartedAt: value ? new Date().toISOString() : null,
      routeStarted: value ? s.routeStarted : false,
    }));
  }, []);

  const startRoute = useCallback(() => {
    setState((s) => ({ ...s, onDuty: true, routeStarted: true }));
  }, []);

  const markCollected = useCallback((binId: string, photo: string | null) => {
    setState((s) => {
      if (s.collected[binId]) return s;
      const bin = BINS.find((b) => b.id === binId);
      return {
        ...s,
        loadKg: Math.min(VEHICLE.maxCapacityKg, s.loadKg + (bin?.weightKg ?? 0)),
        collected: { ...s.collected, [binId]: { at: new Date().toISOString(), photo } },
      };
    });
  }, []);

  const nextBinId = useMemo(
    () => BINS.find((b) => !state.collected[b.id])?.id ?? null,
    [state.collected],
  );

  const stopStatus = useCallback(
    (binId: string): StopStatus => {
      if (state.collected[binId]) return "collected";
      if (binId === nextBinId) return "current";
      return "pending";
    },
    [state.collected, nextBinId],
  );

  const collectedCount = Object.keys(state.collected).length;

  const value: Ctx = {
    state,
    hydrated,
    setOnDuty,
    startRoute,
    markCollected,
    stopStatus,
    nextBinId,
    collectedCount,
    distanceDoneKm: Math.round((VEHICLE.routeDistanceKm / BINS.length) * collectedCount * 10) / 10,
  };

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used inside DriverProvider");
  return ctx;
}
