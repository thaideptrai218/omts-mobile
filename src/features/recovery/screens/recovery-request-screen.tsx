import { StyleSheet, Text, View } from "react-native";

import type {
  RecoveryRequestFormErrors,
  RecoveryRequestFormValues,
} from "@/features/recovery/domain/recovery-request-form";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { TextField } from "@/shared/ui/text-field";

type RecoveryRequestScreenProps = Readonly<{
  errors?: RecoveryRequestFormErrors;
  genericResponseVisible?: boolean;
  onBackToLogin: () => void;
  onChangeIdentifier: (value: string) => void;
  onContinueToVerification: () => void;
  onSendCode: () => void;
  pending?: boolean;
  values: RecoveryRequestFormValues;
}>;

export function RecoveryRequestScreen({
  errors = {},
  genericResponseVisible = false,
  onBackToLogin,
  onChangeIdentifier,
  onContinueToVerification,
  onSendCode,
  pending = false,
  values,
}: RecoveryRequestScreenProps) {
  const theme = useAppTheme();
  const genericResponse = resolveKnownMessage("MSG15");

  return (
    <ScreenContainer padded={false} testID="recovery-request-screen">
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
              Khôi phục tài khoản
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Nhập email hoặc số điện thoại đã xác minh của tài khoản.
            </Text>
          </View>

          <TextField
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            disabled={pending || genericResponseVisible}
            errorMessage={errors.identifier}
            label="Email hoặc số điện thoại đã xác minh"
            onChangeText={onChangeIdentifier}
            onSubmitEditing={onSendCode}
            placeholder="Nhập thông tin nhận mã"
            returnKeyType="send"
            textContentType="username"
            value={values.identifier}
          />

          {genericResponseVisible ? (
            <MessageBanner
              message={genericResponse.message}
              title={genericResponse.title}
              variant={genericResponse.severity}
            />
          ) : null}

          <View style={{ gap: theme.spacing.sm }}>
            {genericResponseVisible ? (
              <AppButton
                disabled={pending}
                label="Nhập mã xác minh"
                onPress={onContinueToVerification}
              />
            ) : (
              <AppButton
                label="Gửi mã xác minh"
                loading={pending}
                loadingLabel="Đang xử lý"
                onPress={onSendCode}
              />
            )}
            <AppButton
              disabled={pending}
              label="Quay lại đăng nhập"
              onPress={onBackToLogin}
              variant="ghost"
            />
          </View>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            Nếu tài khoản chưa có email hoặc số điện thoại đã xác minh, nhân
            viên liên hệ Chủ hợp tác xã; Chủ hợp tác xã và thương lái liên hệ
            Quản trị viên hệ thống để được hỗ trợ đặt lại mật khẩu.
          </Text>
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
