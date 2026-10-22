import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import type { VerificationTiming } from "@/features/verification/domain/verification-timing";
import {
  formatVerificationCountdown,
  VerificationScreen,
} from "@/features/verification/screens/verification-screen";

const challenge: VerificationChallenge = {
  attemptsRemaining: 4,
  channel: "sms",
  expiresAtEpochMs: 1_798_000_300_000,
  id: "challenge-1",
  maskedRecipient: "******6789",
  purpose: "accountOnboarding",
  resendAvailableAtEpochMs: 1_798_000_060_000,
  sendsRemaining: 2,
};

const timing: VerificationTiming = {
  hasRemainingSends: true,
  isExpired: false,
  isResendCooldownComplete: false,
  secondsUntilExpiration: 299,
  secondsUntilResend: 59,
};

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const defaultProps = {
  challenge,
  code: "",
  onBack: jest.fn(),
  onChangeCode: jest.fn(),
  onResend: jest.fn(),
  onVerify: jest.fn(),
  resendAllowed: true,
  timing,
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof VerificationScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <VerificationScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("VerificationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows only the masked recipient and server-derived limits", async () => {
    await renderScreen();

    expect(screen.getByText("******6789")).toBeOnTheScreen();
    expect(screen.getByText("Mã còn hiệu lực trong 4:59.")).toBeOnTheScreen();
    expect(
      screen.getByText("Còn 4 lần nhập mã và 2 lần gửi lại."),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Xác minh" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Gửi lại sau 0:59" }),
    ).toBeDisabled();
  });

  test("submits only after a complete non-expired code", async () => {
    const user = userEvent.setup();
    const onVerify = jest.fn();

    await renderScreen({ code: "123456", onVerify });
    await user.press(screen.getByRole("button", { name: "Xác minh" }));

    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  test("blocks verification after expiry", async () => {
    await renderScreen({
      code: "123456",
      timing: {
        ...timing,
        isExpired: true,
        secondsUntilExpiration: 0,
      },
    });

    expect(screen.getByText("Mã hiện tại đã hết hạn.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Xác minh" })).toBeDisabled();
  });

  test("blocks verification after attempts are exhausted even with a complete code", async () => {
    await renderScreen({ code: "123456", challenge: { ...challenge, attemptsRemaining: 0 } });
    expect(screen.getByRole("button", { name: "Xác minh" })).toBeDisabled();
  });

  test("allows resend only when the controller and timing both allow it", async () => {
    const user = userEvent.setup();
    const onResend = jest.fn();

    await renderScreen({
      onResend,
      timing: {
        ...timing,
        isResendCooldownComplete: true,
        secondsUntilResend: 0,
      },
    });
    await user.press(screen.getByRole("button", { name: "Gửi lại mã" }));

    expect(onResend).toHaveBeenCalledTimes(1);
  });

  test("formats durations without negative or overflowing seconds", () => {
    expect(formatVerificationCountdown(-1)).toBe("0:00");
    expect(formatVerificationCountdown(61)).toBe("1:01");
  });
});
