import { StyleSheet, Text, View } from "react-native";

import { VerificationCodeField } from "@/features/verification/components/verification-code-field";
import { isCompleteVerificationCode } from "@/features/verification/domain/verification-code";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import type { VerificationTiming } from "@/features/verification/domain/verification-timing";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";

export type VerificationPendingAction = "resend" | "verify" | null;

export type VerificationScreenProps = Readonly<{
  challenge: VerificationChallenge;
  code: string;
  feedback?: ResolvedMessage | null;
  fieldError?: string;
  onBack: () => void;
  onChangeCode: (code: string) => void;
  onResend: () => void;
  onVerify: () => void;
  pendingAction?: VerificationPendingAction;
  resendAllowed: boolean;
  timing: VerificationTiming;
}>;

export function formatVerificationCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VerificationScreen({
  challenge,
  code,
  feedback,
  fieldError,
  onBack,
  onChangeCode,
  onResend,
  onVerify,
  pendingAction = null,
  resendAllowed,
  timing,
}: VerificationScreenProps) {
  const theme = useAppTheme();
  const isPending = pendingAction !== null;
  const canVerify =
    isCompleteVerificationCode(code) &&
    challenge.attemptsRemaining > 0 &&
    !timing.isExpired &&
    !isPending;
  const canResend =
    resendAllowed &&
    timing.hasRemainingSends &&
    timing.isResendCooldownComplete &&
    !isPending;
  const recipientKind = challenge.channel === "sms" ? "số điện thoại" : "email";
  const resendLabel = timing.isResendCooldownComplete
    ? "Gửi lại mã"
    : `Gửi lại sau ${formatVerificationCountdown(timing.secondsUntilResend)}`;

  return (
    <ScreenContainer padded={false} testID="verification-screen">
      <KeyboardSafeForm contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.card,
            theme.elevation.card,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
              gap: theme.spacing.lg,
              padding: theme.spacing.lg,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              Xác minh thông tin liên hệ
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Nhập mã gồm 6 chữ số đã gửi tới {recipientKind} bên dưới.
            </Text>
          </View>

          <View
            accessible
            accessibilityLabel={`${recipientKind}: ${challenge.maskedRecipient}`}
            style={[
              styles.recipient,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radii.lg,
                gap: theme.spacing.xxs,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              Mã đã được gửi tới {recipientKind}
            </Text>
            <Text
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              {challenge.maskedRecipient}
            </Text>
          </View>

          <VerificationCodeField
            disabled={isPending}
            errorMessage={fieldError}
            onChangeCode={onChangeCode}
            value={code}
          />

          {feedback ? (
            <MessageBanner
              message={feedback.message}
              title={feedback.title}
              variant={feedback.severity}
            />
          ) : null}

          <View style={{ gap: theme.spacing.xxs }}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                theme.typography.bodyStrong,
                {
                  color: timing.isExpired
                    ? theme.colors.danger
                    : theme.colors.textPrimary,
                },
              ]}
            >
              {timing.isExpired
                ? "Mã hiện tại đã hết hạn."
                : `Mã còn hiệu lực trong ${formatVerificationCountdown(timing.secondsUntilExpiration)}.`}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Còn {challenge.attemptsRemaining} lần nhập mã và{" "}
              {challenge.sendsRemaining} lần gửi lại.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <AppButton
              disabled={!canVerify}
              label="Xác minh"
              loading={pendingAction === "verify"}
              loadingLabel="Đang xác minh"
              onPress={onVerify}
            />
            <AppButton
              disabled={!canResend}
              label={resendLabel}
              loading={pendingAction === "resend"}
              loadingLabel="Đang gửi mã"
              onPress={onResend}
              variant="secondary"
            />
            <AppButton
              disabled={isPending}
              label="Quay lại"
              onPress={onBack}
              variant="ghost"
            />
          </View>
        </View>
      </KeyboardSafeForm>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: "100%",
  },
  recipient: {
    width: "100%",
  },
  scrollContent: {
    justifyContent: "center",
  },
});
