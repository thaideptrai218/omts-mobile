import { StyleSheet, Text, View } from "react-native";

import type {
  PasswordChangeFormErrors,
  PasswordChangeFormValues,
} from "@/features/security/domain/password-change-form";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { newPasswordRequirement } from "@/shared/security/new-password-policy";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { PasswordField } from "@/shared/ui/password-field";
import { ScreenContainer } from "@/shared/ui/screen-container";

type BasePasswordChangeScreenProps = Readonly<{
  errors?: PasswordChangeFormErrors;
  feedback?: ResolvedMessage | null;
  onChangeCurrentPassword: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangePasswordConfirmation: (value: string) => void;
  onSave: () => void;
  pending?: boolean;
  values: PasswordChangeFormValues;
}>;

export type PasswordChangeScreenProps = BasePasswordChangeScreenProps &
  (
    | Readonly<{
        mode: "forced";
        onCancel?: never;
      }>
    | Readonly<{
        mode: "standard";
        onCancel: () => void;
      }>
  );

export function PasswordChangeScreen({
  errors = {},
  feedback,
  mode,
  onCancel,
  onChangeCurrentPassword,
  onChangePassword,
  onChangePasswordConfirmation,
  onSave,
  pending = false,
  values,
}: PasswordChangeScreenProps) {
  const theme = useAppTheme();
  const isForced = mode === "forced";

  return (
    <ScreenContainer padded={false} testID="password-change-screen">
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
              {isForced ? "Tạo mật khẩu mới" : "Đổi mật khẩu"}
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              {isForced
                ? "Mật khẩu hiện tại là mật khẩu tạm thời bạn vừa dùng để đăng nhập."
                : "Xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới."}
            </Text>
          </View>

          {isForced ? (
            <MessageBanner
              message="Bạn cần đổi mật khẩu tạm thời trước khi sử dụng các chức năng khác của OMTS."
              title="Yêu cầu bảo mật"
              variant="warning"
            />
          ) : null}

          <View style={{ gap: theme.spacing.md }}>
            <PasswordField
              autoComplete="current-password"
              disabled={pending}
              errorMessage={errors.currentPassword}
              label={isForced ? "Mật khẩu tạm thời" : "Mật khẩu hiện tại"}
              onChangeText={onChangeCurrentPassword}
              textContentType="password"
              value={values.currentPassword}
            />

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
              onSubmitEditing={onSave}
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
              label={isForced ? "Tạo mật khẩu và tiếp tục" : "Lưu mật khẩu"}
              loading={pending}
              loadingLabel="Đang lưu mật khẩu"
              onPress={onSave}
            />
            {!isForced ? (
              <AppButton
                disabled={pending}
                label="Hủy"
                onPress={onCancel}
                variant="ghost"
              />
            ) : null}
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
