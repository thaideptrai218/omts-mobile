import { StyleSheet, Text, View } from "react-native";

import type {
  ProfileAccountSummary,
  ProfileContact,
  ProfileFormErrors,
  ProfileFormValues,
} from "@/features/profile/domain/profile-form";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { InlineStatus } from "@/shared/ui/inline-status";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { TextField } from "@/shared/ui/text-field";

type ProfileScreenProps = Readonly<{
  account: ProfileAccountSummary;
  conflict?: Readonly<{ onReload: () => void; reloading: boolean }>;
  errors?: ProfileFormErrors;
  feedback?: ResolvedMessage | null;
  onChangeDisplayName: (value: string) => void;
  onChangeEmail: () => void;
  onChangePhone: () => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onOpenPasswordChange: () => void;
  onSaveProfile: () => void;
  pending?: boolean;
  values: ProfileFormValues;
}>;

type ContactCardProps = Readonly<{
  contact: ProfileContact;
  disabled: boolean;
  label: string;
  onChange: () => void;
}>;

function ContactCard({
  contact,
  disabled,
  label,
  onChange,
}: ContactCardProps) {
  const theme = useAppTheme();
  const statusLabel = !contact.value
    ? "Chưa cập nhật"
    : contact.verified
      ? "Đã xác minh"
      : "Chưa xác minh";
  const statusVariant = !contact.value
    ? "neutral"
    : contact.verified
      ? "success"
      : "warning";

  return (
    <View
      style={[
        styles.contactCard,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View style={[styles.contactHeader, { gap: theme.spacing.sm }]}>
        <View style={styles.contactCopy}>
          <Text
            style={[theme.typography.label, { color: theme.colors.textMuted }]}
          >
            {label}
          </Text>
          <Text
            style={[
              theme.typography.bodyStrong,
              { color: theme.colors.textPrimary },
            ]}
          >
            {contact.value ?? "Chưa có thông tin"}
          </Text>
        </View>
        <InlineStatus label={statusLabel} variant={statusVariant} />
      </View>
      <AppButton
        disabled={disabled}
        fullWidth={false}
        label={`Thay đổi ${label.toLocaleLowerCase("vi-VN")}`}
        onPress={onChange}
        variant="secondary"
      />
    </View>
  );
}

export function ProfileScreen({
  account,
  conflict,
  errors = {},
  feedback,
  onChangeDisplayName,
  onChangeEmail,
  onChangePhone,
  onLogout,
  onOpenNotifications,
  onOpenPasswordChange,
  onSaveProfile,
  pending = false,
  values,
}: ProfileScreenProps) {
  const theme = useAppTheme();

  return (
    <ScreenContainer padded={false} testID="profile-screen">
      <KeyboardSafeForm contentContainerStyle={styles.scrollContent}>
        <View style={{ gap: theme.spacing.lg }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              Tài khoản của tôi
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Quản lý thông tin cá nhân và các lựa chọn bảo mật của tài khoản.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              theme.elevation.card,
              {
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
                gap: theme.spacing.md,
                padding: theme.spacing.lg,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              Thông tin tài khoản
            </Text>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                Mã tài khoản: {account.accountCode}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                Tên đăng nhập: {account.username}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                Loại tài khoản: {account.accountTypeLabel}
              </Text>
            </View>

            {account.accessSummary.length > 0 ? (
              <View style={{ gap: theme.spacing.xs }}>
                <Text
                  style={[
                    theme.typography.label,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Phạm vi đang được cấp
                </Text>
                {account.accessSummary.map((line, index) => (
                  <Text
                    key={`${index}-${line}`}
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    • {line}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
                gap: theme.spacing.md,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              Thông tin cá nhân
            </Text>
            <TextField
              disabled={pending}
              errorMessage={errors.displayName}
              label="Tên hiển thị"
              onChangeText={onChangeDisplayName}
              value={values.displayName}
            />
            {feedback ? (
              <MessageBanner
                message={feedback.message}
                title={feedback.title}
                variant={feedback.severity}
              />
            ) : null}
            <AppButton
              disabled={Boolean(conflict)}
              label="Lưu tên hiển thị"
              loading={pending && !conflict?.reloading}
              loadingLabel="Đang lưu"
              onPress={onSaveProfile}
            />
            {conflict ? (
              <View style={{ gap: theme.spacing.sm }}>
                <Text
                  style={[theme.typography.body, { color: theme.colors.textSecondary }]}
                >
                  Tên bạn đang nhập được giữ lại để đối chiếu. Tải lại thành công
                  sẽ thay thế tên này bằng thông tin đang lưu trên hệ thống.
                </Text>
                <AppButton
                  label="Tải lại và bỏ thay đổi"
                  loading={conflict.reloading}
                  loadingLabel="Đang tải lại"
                  onPress={conflict.onReload}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              Thông tin liên hệ
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              Thông tin hiện tại vẫn được sử dụng cho đến khi thông tin mới xác
              minh thành công.
            </Text>
            <ContactCard
              contact={account.email}
              disabled={pending}
              label="Email"
              onChange={onChangeEmail}
            />
            <ContactCard
              contact={account.phone}
              disabled={pending}
              label="Số điện thoại"
              onChange={onChangePhone}
            />
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surfaceRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.xl,
                gap: theme.spacing.sm,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              Bảo mật và tùy chọn
            </Text>
            <AppButton
              disabled={pending}
              label="Đổi mật khẩu"
              onPress={onOpenPasswordChange}
              variant="secondary"
            />
            <AppButton
              disabled={pending}
              label="Tùy chọn thông báo"
              onPress={onOpenNotifications}
              variant="secondary"
            />
            <AppButton
              disabled={pending}
              label="Đăng xuất"
              onPress={onLogout}
              variant="danger"
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
  contactCard: {
    borderWidth: 1,
    width: "100%",
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
  },
  contactHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  scrollContent: {
    paddingBottom: 48,
  },
});
