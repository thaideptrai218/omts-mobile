import { StyleSheet, Text, View } from "react-native";

import { RegistrationMethodSelector } from "@/features/registration/components/registration-method-selector";
import type {
  RegistrationFormErrors,
  RegistrationFormValues,
  RegistrationMethod,
} from "@/features/registration/domain/registration-form";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { newPasswordRequirement } from "@/shared/security/new-password-policy";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { PasswordField } from "@/shared/ui/password-field";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { TextField } from "@/shared/ui/text-field";

type RegistrationScreenProps = Readonly<{
  errors?: RegistrationFormErrors;
  feedback?: ResolvedMessage | null;
  onChangeIdentifier: (value: string) => void;
  onChangeMethod: (method: RegistrationMethod) => void;
  onChangePassword: (value: string) => void;
  onChangePasswordConfirmation: (value: string) => void;
  onContinue: () => void;
  onOpenLogin: () => void;
  pending?: boolean;
  values: RegistrationFormValues;
}>;

export function RegistrationScreen({
  errors = {},
  feedback,
  onChangeIdentifier,
  onChangeMethod,
  onChangePassword,
  onChangePasswordConfirmation,
  onContinue,
  onOpenLogin,
  pending = false,
  values,
}: RegistrationScreenProps) {
  const theme = useAppTheme();
  const isEmail = values.method === "email";
  const identifierLabel = isEmail ? "Email" : "Số điện thoại";

  return (
    <ScreenContainer padded={false} testID="registration-screen">
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
              style={[theme.typography.title, { color: theme.colors.textPrimary }]}
            >
              Tạo tài khoản thương lái
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Đăng ký để theo dõi đơn hàng, phiếu bán và công nợ của bạn tại
              hợp tác xã.
            </Text>
          </View>

          <RegistrationMethodSelector
            disabled={pending}
            onChange={onChangeMethod}
            value={values.method}
          />

          <View style={{ gap: theme.spacing.md }}>
            <TextField
              autoCapitalize="none"
              autoComplete={isEmail ? "email" : "tel"}
              autoCorrect={false}
              disabled={pending}
              errorMessage={errors.identifier}
              inputMode={isEmail ? "email" : "tel"}
              keyboardType={isEmail ? "email-address" : "phone-pad"}
              label={identifierLabel}
              onChangeText={onChangeIdentifier}
              placeholder={
                isEmail ? "ten@example.com" : "Nhập số điện thoại"
              }
              textContentType={isEmail ? "emailAddress" : "telephoneNumber"}
              value={values.identifier}
            />

            <PasswordField
              autoComplete="new-password"
              disabled={pending}
              errorMessage={errors.password}
              helperText={newPasswordRequirement}
              label="Mật khẩu"
              onChangeText={onChangePassword}
              textContentType="newPassword"
              value={values.password}
            />

            <PasswordField
              autoComplete="new-password"
              disabled={pending}
              errorMessage={errors.passwordConfirmation}
              label="Nhập lại mật khẩu"
              onChangeText={onChangePasswordConfirmation}
              onSubmitEditing={onContinue}
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

          <View style={{ gap: theme.spacing.sm }}>
            <AppButton
              label="Tiếp tục xác minh"
              loading={pending}
              loadingLabel="Đang kiểm tra"
              onPress={onContinue}
            />
            <AppButton
              disabled={pending}
              label="Đã có tài khoản? Đăng nhập"
              onPress={onOpenLogin}
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
