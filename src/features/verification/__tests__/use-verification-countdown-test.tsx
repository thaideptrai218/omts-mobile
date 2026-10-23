import { act, renderHook } from "@testing-library/react-native";

import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import {
  type AppActivitySource,
  type VerificationClock,
  shouldTickForAppState,
  useVerificationCountdown,
} from "@/features/verification/hooks/use-verification-countdown";

const initialNowEpochMs = 1_798_000_000_000;
const challenge: VerificationChallenge = {
  attemptsRemaining: 4,
  channel: "sms",
  expiresAtEpochMs: initialNowEpochMs + 5 * 60_000,
  id: "challenge-1",
  maskedRecipient: "******6789",
  purpose: "accountOnboarding",
  resendAvailableAtEpochMs: initialNowEpochMs + 60_000,
  sendsRemaining: 2,
};

function createActivitySource(initiallyActive = true) {
  let active = initiallyActive;
  let listener: ((isActive: boolean) => void) | undefined;
  const unsubscribe = jest.fn();
  const source: AppActivitySource = {
    isActive: () => active,
    subscribe: (nextListener) => {
      listener = nextListener;
      return unsubscribe;
    },
  };

  return {
    emit(nextActive: boolean) {
      active = nextActive;
      listener?.(nextActive);
    },
    source,
    unsubscribe,
  };
}

describe("useVerificationCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("recalculates from the clock on each foreground tick", async () => {
    let nowEpochMs = initialNowEpochMs;
    const clock: VerificationClock = { now: () => nowEpochMs };
    const activity = createActivitySource();
    const { result } = await renderHook(() =>
      useVerificationCountdown(challenge, {
        activitySource: activity.source,
        clock,
      }),
    );

    expect(result.current.secondsUntilResend).toBe(60);

    nowEpochMs += 1_000;
    await act(() => jest.advanceTimersByTime(1_000));

    expect(result.current.secondsUntilResend).toBe(59);
  });

  test("default clock follows the current Date implementation rather than an import-time reference", async () => {
    jest.setSystemTime(initialNowEpochMs);
    const activity = createActivitySource();
    const { result } = await renderHook(() =>
      useVerificationCountdown(challenge, { activitySource: activity.source }),
    );
    expect(result.current.secondsUntilResend).toBe(60);

    await act(() => jest.advanceTimersByTime(60_000));

    expect(result.current.secondsUntilResend).toBe(0);
    expect(result.current.isResendCooldownComplete).toBe(true);
    expect(result.current.secondsUntilExpiration).toBe(240);
  });

  test("stops in background and catches up immediately on foreground", async () => {
    let nowEpochMs = initialNowEpochMs;
    const clock: VerificationClock = { now: () => nowEpochMs };
    const activity = createActivitySource();
    const { result } = await renderHook(() =>
      useVerificationCountdown(challenge, {
        activitySource: activity.source,
        clock,
      }),
    );

    await act(() => activity.emit(false));
    nowEpochMs += 20_000;
    await act(() => jest.advanceTimersByTime(20_000));
    expect(result.current.secondsUntilResend).toBe(60);

    await act(() => activity.emit(true));
    expect(result.current.secondsUntilResend).toBe(40);
  });

  test("does not start an interval while initially inactive", async () => {
    let nowEpochMs = initialNowEpochMs;
    const clock: VerificationClock = { now: () => nowEpochMs };
    const activity = createActivitySource(false);
    const { result } = await renderHook(() =>
      useVerificationCountdown(challenge, {
        activitySource: activity.source,
        clock,
      }),
    );

    nowEpochMs += 5_000;
    await act(() => jest.advanceTimersByTime(5_000));

    expect(result.current.secondsUntilResend).toBe(60);
  });

  test("cleans up the native activity subscription", async () => {
    const activity = createActivitySource();
    const { unmount } = await renderHook(() =>
      useVerificationCountdown(challenge, {
        activitySource: activity.source,
      }),
    );

    await unmount();

    expect(activity.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("shouldTickForAppState", () => {
  test.each(["active", "unknown", null] as const)(
    "keeps time moving for startup-visible state %s",
    (appState) => {
      expect(shouldTickForAppState(appState)).toBe(true);
    },
  );

  test.each(["background", "inactive", "extension"] as const)(
    "pauses time updates for non-visible state %s",
    (appState) => {
      expect(shouldTickForAppState(appState)).toBe(false);
    },
  );
});
