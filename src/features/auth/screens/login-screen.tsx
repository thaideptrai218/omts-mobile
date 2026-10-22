import { StyleSheet, Text, View } from "react-native";

import type {
  LoginFormErrors,
  LoginFormValues,
} from "@/features/auth/domain/login-form";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { PasswordField } from "@/shared/ui/password-field";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { TextField } from "@/shared/ui/text-field";

type LoginScreenProps = Readonly<{
  errors?: LoginFormErrors;
  feedback?: ResolvedMessage | null;
  onChangeIdentifier: (value: string) => void;
  onChangePassword: (value: string) => void;
  onLogin: () => void;
  onOpenPublicQr?: () => void;
  onOpenRecovery?: () => void;
  onOpenRegistration?: () => void;
  pending?: boolean;
  values: LoginFormValues;
}>;

export function LoginScreen({
  errors = {},
  feedback,
  onChangeIdentifier,
  onChangePassword,
  onLogin,
  onOpenPublicQr,
  onOpenRecovery,
  onOpenRegistration,
  pending = false,
  values,
}: LoginScreenProps) {
  const theme = useAppTheme();

  return (
    <ScreenContainer padded={false} testID="login-screen">
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
              style={[theme.typography.label, { color: theme.colors.brand }]}
            >
              OMTS MOBILE
            </Text>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              Đăng nhập
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Sử dụng tên đăng nhập, số điện thoại hoặc email đã xác minh.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <TextField
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              disabled={pending}
              errorMessage={errors.identifier}
              label="Tên đăng nhập, số điện thoại hoặc email"
              onChangeText={onChangeIdentifier}
              placeholder="Nhập thông tin đăng nhập"
              textContentType="username"
              value={values.identifier}
            />
            <PasswordField
              autoComplete="current-password"
              disabled={pending}
              errorMessage={errors.password}
              label="Mật khẩu"
              onChangeText={onChangePassword}
              onSubmitEditing={onLogin}
              returnKeyType="done"
              textContentType="password"
              value={values.password}
            />
          </View>

          {feedback ? (
            <MessageBanner
              message={feedback.message}
              title={feedback.title}
              variant={feedback.severity}
            />
          ) : null}

          <View style={{ gap: theme.spacing.sm }}>
            <AppButton
              label="Đăng nhập"
              loading={pending}
              loadingLabel="Đang đăng nhập"
              onPress={onLogin}
            />
            {onOpenRecovery ? (
              <AppButton
                disabled={pending}
                label="Quên mật khẩu"
                onPress={onOpenRecovery}
                variant="ghost"
              />
            ) : null}
          </View>

          {onOpenRegistration || onOpenPublicQr ? (
            <View
              style={[
                styles.secondaryActions,
                {
                  borderTopColor: theme.colors.border,
                  gap: theme.spacing.xs,
                  paddingTop: theme.spacing.md,
                },
              ]}
            >
              {onOpenRegistration ? (
                <AppButton
                  disabled={pending}
                  label="Đăng ký tài khoản thương lái"
                  onPress={onOpenRegistration}
                  variant="secondary"
                />
              ) : null}
              {onOpenPublicQr ? (
                <AppButton
                  disabled={pending}
                  label="Tra cứu nguồn gốc bằng QR"
                  onPress={onOpenPublicQr}
                  variant="ghost"
                />
              ) : null}
              {onOpenPublicQr ? (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textMuted, textAlign: "center" },
                  ]}
                >
                  Tra cứu QR không yêu cầu tài khoản.
                </Text>
              ) : null}
            </View>
          ) : null}
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
  secondaryActions: {
    borderTopWidth: 1,
  },
});
