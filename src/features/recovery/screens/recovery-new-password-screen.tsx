import { StyleSheet, Text, View } from "react-native";

import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import {
  newPasswordRequirement,
  type NewPasswordErrors,
  type NewPasswordFormValues,
} from "@/shared/security/new-password-policy";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { PasswordField } from "@/shared/ui/password-field";
import { ScreenContainer } from "@/shared/ui/screen-container";

type RecoveryNewPasswordScreenProps = Readonly<{
  errors?: NewPasswordErrors;
  feedback?: ResolvedMessage | null;
  onBackToLogin: () => void;
  onChangePassword: (value: string) => void;
  onChangePasswordConfirmation: (value: string) => void;
  onResetPassword: () => void;
  pending?: boolean;
  values: NewPasswordFormValues;
}>;

export function RecoveryNewPasswordScreen({
  errors = {},
  feedback,
  onBackToLogin,
  onChangePassword,
  onChangePasswordConfirmation,
  onResetPassword,
  pending = false,
  values,
}: RecoveryNewPasswordScreenProps) {
  const theme = useAppTheme();

  return (
    <ScreenContainer padded={false} testID="recovery-new-password-screen">
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
              Đặt mật khẩu mới
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Thông tin liên hệ đã được xác minh. Hãy tạo mật khẩu mới để lấy
              lại quyền truy cập tài khoản.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <PasswordField
              autoComplete="new-password"
              disabled={pending}
              errorMessage={errors.password}
              helperText={newPasswordRequirement}
              label="Mật khẩu mới"
              onChangeText={onChangePassword}
              textContentType="newPassword"
              value={values.password}
            />

            <PasswordField
              autoComplete="new-password"
              disabled={pending}
              errorMessage={errors.passwordConfirmation}
              label="Nhập lại mật khẩu mới"
              onChangeText={onChangePasswordConfirmation}
              onSubmitEditing={onResetPassword}
              returnKeyType="done"
              textContentType="newPassword"
              value={values.passwordConfirmation}
            />
          </View>

          {feedback ? (
            <MessageBanner
              message={feedback.message}
              title={feedback.title}
              variant={feedback.severity}
            />
          ) : null}

          <MessageBanner
            message="Sau khi đặt lại thành công, các phiên đăng nhập cũ sẽ bị thu hồi và bạn cần đăng nhập lại."
            title="Bảo vệ tài khoản"
            variant="info"
          />

          <View style={{ gap: theme.spacing.sm }}>
            <AppButton
              label="Đặt lại mật khẩu"
              loading={pending}
              loadingLabel="Đang đặt lại"
              onPress={onResetPassword}
            />
            <AppButton
              disabled={pending}
              label="Quay lại đăng nhập"
              onPress={onBackToLogin}
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
  scrollContent: {
    justifyContent: "center",
  },
});
