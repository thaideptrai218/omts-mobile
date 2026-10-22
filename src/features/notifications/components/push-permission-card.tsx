import { StyleSheet, Text, View } from "react-native";

import type { PushPermissionState } from "@/features/notifications/domain/push-permission";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import {
  InlineStatus,
  type InlineStatusVariant,
} from "@/shared/ui/inline-status";

type PushPermissionCardProps = Readonly<{
  onRequestPermission: () => void;
  permission: PushPermissionState;
  requesting?: boolean;
}>;

type PermissionPresentation = Readonly<{
  description: string;
  label: string;
  variant: InlineStatusVariant;
}>;

function getPermissionPresentation(
  permission: PushPermissionState,
): PermissionPresentation {
  switch (permission.status) {
    case "unavailable":
      return {
        description:
          "Bản trải nghiệm chưa kết nối quyền thông báo đẩy của thiết bị. Lưu tùy chọn không gửi thông báo.",
        label: "Chưa kết nối",
        variant: "neutral",
      };
    case "granted":
      return {
        description: "Thiết bị đang cho phép OMTS hiển thị thông báo đẩy.",
        label: "Đã cho phép",
        variant: "success",
      };
    case "denied":
      return {
        description: permission.canAskAgain
          ? "Thiết bị đang tắt thông báo đẩy. Bạn vẫn có thể chọn và lưu các kênh đủ điều kiện khác."
          : "Thiết bị đang tắt thông báo đẩy. Bạn có thể bật lại trong Cài đặt của thiết bị và vẫn có thể chọn các kênh đủ điều kiện khác.",
        label: "Đã từ chối",
        variant: "warning",
      };
    case "undetermined":
    default:
      return {
        description:
          "OMTS chưa xin quyền gửi thông báo trên thiết bị này. Bạn chỉ thấy hộp thoại hệ thống sau khi chọn nút bên dưới.",
        label: "Chưa quyết định",
        variant: "info",
      };
  }
}

export function PushPermissionCard({
  onRequestPermission,
  permission,
  requesting = false,
}: PushPermissionCardProps) {
  const theme = useAppTheme();
  const presentation = getPermissionPresentation(permission);
  const canRequest =
    permission.status === "undetermined" ||
    (permission.status === "denied" && permission.canAskAgain);

  return (
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
      <View style={[styles.header, { gap: theme.spacing.sm }]}>
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            theme.typography.heading,
            { color: theme.colors.textPrimary },
          ]}
        >
          Quyền thông báo trên thiết bị
        </Text>
        <InlineStatus
          announce
          label={presentation.label}
          variant={presentation.variant}
        />
      </View>
      <Text
        style={[theme.typography.body, { color: theme.colors.textSecondary }]}
      >
        {presentation.description}
      </Text>
      {canRequest ? (
        <AppButton
          fullWidth={false}
          label="Cho phép thông báo"
          loading={requesting}
          loadingLabel="Đang chờ thiết bị"
          onPress={onRequestPermission}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: "100%",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
});
