import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { getVerificationTiming } from "@/features/verification/domain/verification-timing";

export type VerificationClock = Readonly<{
  now: () => number;
}>;

export type AppActivitySource = Readonly<{
  isActive: () => boolean;
  subscribe: (listener: (isActive: boolean) => void) => () => void;
}>;

type VerificationCountdownOptions = Readonly<{
  activitySource?: AppActivitySource;
  clock?: VerificationClock;
  tickIntervalMs?: number;
}>;

const systemClock: VerificationClock = {
  now: Date.now,
};

export function shouldTickForAppState(
  appState: AppStateStatus | null,
): boolean {
  return appState === "active" || appState === "unknown" || appState === null;
}

const nativeAppActivitySource: AppActivitySource = {
  isActive: () => shouldTickForAppState(AppState.currentState),
  subscribe: (listener) => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      listener(shouldTickForAppState(nextState));
    });

    return () => subscription.remove();
  },
};

export function useVerificationCountdown(
  challenge: VerificationChallenge,
  options: VerificationCountdownOptions = {},
) {
  const {
    activitySource = nativeAppActivitySource,
    clock = systemClock,
    tickIntervalMs = 1_000,
  } = options;
  const [nowEpochMs, setNowEpochMs] = useState(() => clock.now());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const updateNow = () => setNowEpochMs(clock.now());
    const stopTicking = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const startTicking = () => {
      updateNow();

      if (intervalId === undefined) {
        intervalId = setInterval(updateNow, tickIntervalMs);
      }
    };

    if (activitySource.isActive()) {
      startTicking();
    }

    const unsubscribe = activitySource.subscribe((isActive) => {
      if (isActive) {
        startTicking();
      } else {
        stopTicking();
      }
    });

    return () => {
      stopTicking();
      unsubscribe();
    };
  }, [activitySource, clock, tickIntervalMs]);

  return getVerificationTiming(challenge, nowEpochMs);
}
