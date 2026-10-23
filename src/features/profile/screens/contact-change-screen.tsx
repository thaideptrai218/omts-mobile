import { Text, View } from "react-native";
import type { VerificationChannel } from "@/features/verification/domain/verification-contract";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { TextField } from "@/shared/ui/text-field";

export function ContactChangeScreen({
  channel,
  currentContact,
  identifier,
  pending,
  conflict,
  fieldError,
  feedback,
  onChange,
  onStart,
  onReload,
  onClose,
}: {
  channel: VerificationChannel;
  currentContact: string | null;
  identifier: string;
  pending: boolean;
  conflict: boolean;
  fieldError?: string;
  feedback: ResolvedMessage | null;
  onChange: (value: string) => void;
  onStart: () => void;
  onReload: () => void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const isEmail = channel === "email";
  const label = isEmail ? "Email" : "Số điện thoại";
  return (
    <ScreenContainer padded={false}>
      <KeyboardSafeForm contentContainerStyle={{ justifyContent: "center" }}>
        <View
          style={{
            ...theme.elevation.card,
            backgroundColor: theme.colors.surfaceRaised,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <Text
            accessibilityRole="header"
            style={[
              theme.typography.title,
              { color: theme.colors.textPrimary },
            ]}
          >
            {currentContact
              ? `Thay đổi ${label.toLocaleLowerCase("vi-VN")}`
              : `Thêm ${label.toLocaleLowerCase("vi-VN")}`}
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary },
            ]}
          >
            {currentContact
              ? `${label} hiện tại: ${currentContact}. Thông tin này vẫn được sử dụng đến khi bạn xác minh thông tin mới thành công.`
              : `Nhập ${label.toLocaleLowerCase("vi-VN")} bạn đang sử dụng để nhận mã xác minh.`}
          </Text>
          <TextField
            label={`${label} mới`}
            value={identifier}
            disabled={pending || conflict}
            errorMessage={fieldError}
            onChangeText={onChange}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "tel"}
            keyboardType={isEmail ? "email-address" : "phone-pad"}
            textContentType={isEmail ? "emailAddress" : "telephoneNumber"}
            onSubmitEditing={onStart}
          />
          {feedback ? (
            <MessageBanner
              title={feedback.title}
              message={feedback.message}
              variant={feedback.severity}
            />
          ) : null}
          {conflict ? (
            <AppButton
              label="Tải lại và nhập lại liên hệ"
              loading={pending}
              onPress={onReload}
            />
          ) : (
            <AppButton
              label="Gửi mã xác minh"
              loading={pending}
              loadingLabel="Đang gửi mã"
              onPress={onStart}
            />
          )}
          <AppButton
            label="Về hồ sơ"
            variant="ghost"
            disabled={pending}
            onPress={onClose}
          />
        </View>
      </KeyboardSafeForm>
    </ScreenContainer>
  );
}
