import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { PushPermissionCard } from "@/features/notifications/components/push-permission-card";
import {
  changeNotificationPreference,
  type LockedNotificationPreferenceReason,
  type NotificationPreferenceSelection,
  type NotificationPreferenceSettings,
} from "@/features/notifications/domain/notification-preferences";
import type { PushPermissionState } from "@/features/notifications/domain/push-permission";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { ContentState } from "@/shared/ui/content-state";
import { InlineStatus } from "@/shared/ui/inline-status";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { Skeleton, SkeletonGroup } from "@/shared/ui/skeleton";

type NotificationPreferencesScreenProps = Readonly<{ onClose?: () => void }> &
  (
    | Readonly<{
        status: "loading";
      }>
    | Readonly<{
        message: string;
        onRetry: () => void;
        retrying?: boolean;
        status: "error";
      }>
    | Readonly<{
        feedback?: ResolvedMessage | null;
        onCancel: () => void;
        onChange: (selection: NotificationPreferenceSelection) => void;
        onRequestPushPermission: () => void;
        onSave: () => void;
        pushPermission: PushPermissionState;
        requestingPushPermission?: boolean;
        saving?: boolean;
        settings: NotificationPreferenceSettings;
        status: "ready";
      }>
  );

function resolveLockedReason(
  reason: LockedNotificationPreferenceReason,
): ResolvedMessage {
  if (reason.code === "MSG21") {
    return resolveKnownMessage("MSG21", { channelName: reason.channelName });
  }

  return resolveKnownMessage(reason.code);
}

function LoadingContent() {
  const theme = useAppTheme();

  return (
    <SkeletonGroup style={{ gap: theme.spacing.lg }}>
      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton height={32} width="64%" />
        <Skeleton height={20} width="92%" />
      </View>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
              gap: theme.spacing.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Skeleton height={24} width="70%" />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function NotificationPreferencesScreen(
  props: NotificationPreferencesScreenProps,
) {
  const theme = useAppTheme();

  if (props.status === "loading") {
    return (
      <ScreenContainer testID="notification-preferences-loading">
        {props.onClose ? (
          <AppButton
            label="Quay lại hồ sơ"
            onPress={props.onClose}
            variant="ghost"
          />
        ) : null}
        <LoadingContent />
      </ScreenContainer>
    );
  }

  if (props.status === "error") {
    return (
      <ScreenContainer testID="notification-preferences-error">
        {props.onClose ? (
          <AppButton
            label="Quay lại hồ sơ"
            onPress={props.onClose}
            variant="ghost"
          />
        ) : null}
        <ContentState
          actionLabel="Thử lại"
          actionLoading={props.retrying}
          description={props.message}
          onAction={props.onRetry}
          title="Chưa tải được tùy chọn"
          variant="error"
        />
      </ScreenContainer>
    );
  }

  const {
    feedback,
    onCancel,
    onChange,
    onRequestPushPermission,
    onSave,
    pushPermission,
    requestingPushPermission = false,
    saving = false,
    settings,
  } = props;
  const channelsById = new Map(
    settings.channels.map((channel) => [channel.id, channel]),
  );

  function handleChange(selection: NotificationPreferenceSelection) {
    const result = changeNotificationPreference(settings, selection);
    if (result.status === "changed") onChange(result.selection);
  }

  return (
    <ScreenContainer padded={false} testID="notification-preferences-screen">
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            gap: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
          },
        ]}
      >
        {props.onClose ? (
          <AppButton
            label="Quay lại hồ sơ"
            onPress={props.onClose}
            disabled={saving}
            variant="ghost"
            fullWidth={false}
          />
        ) : null}
        <View style={{ gap: theme.spacing.xs }}>
          <Text
            accessibilityRole="header"
            style={[
              theme.typography.title,
              { color: theme.colors.textPrimary },
            ]}
          >
            Tùy chọn thông báo
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary },
            ]}
          >
            Chọn cách bạn muốn nhận từng loại thông báo. Một số thông báo quan
            trọng luôn được giữ bật để bảo đảm quy trình vận hành.
          </Text>
        </View>

        {feedback ? (
          <MessageBanner
            message={feedback.message}
            title={feedback.title}
            variant={feedback.severity}
          />
        ) : null}

        <PushPermissionCard
          onRequestPermission={onRequestPushPermission}
          permission={pushPermission}
          requesting={requestingPushPermission}
        />

        {settings.items.length === 0 ? (
          <ContentState
            description="Tài khoản hiện chưa có loại thông báo nào áp dụng."
            title="Chưa có tùy chọn"
          />
        ) : (
          settings.items.map((item) => (
            <View
              key={item.id}
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
              <View style={{ gap: theme.spacing.xs }}>
                <View style={[styles.itemHeading, { gap: theme.spacing.sm }]}>
                  <Text
                    accessibilityRole="header"
                    style={[
                      styles.itemTitle,
                      theme.typography.heading,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.mandatory ? (
                    <InlineStatus label="Bắt buộc" variant="warning" />
                  ) : null}
                </View>
                {item.description ? (
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: theme.spacing.sm }}>
                {item.channels.map((cell) => {
                  const channel = channelsById.get(cell.channelId);
                  if (!channel) return null;

                  const reason = cell.editable
                    ? null
                    : resolveLockedReason(cell.reason);
                  const accessibleLabel = `${channel.label} cho ${item.label}`;

                  return (
                    <View
                      key={cell.channelId}
                      style={[
                        styles.channelRow,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderRadius: theme.radii.lg,
                          gap: theme.spacing.sm,
                          padding: theme.spacing.md,
                        },
                      ]}
                    >
                      <View style={styles.channelCopy}>
                        <Text
                          style={[
                            theme.typography.bodyStrong,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {channel.label}
                        </Text>
                        {reason ? (
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {reason.message}
                          </Text>
                        ) : null}
                      </View>
                      <Switch
                        accessibilityHint={reason?.message}
                        accessibilityLabel={accessibleLabel}
                        accessibilityState={{
                          checked: cell.enabled,
                          disabled: !cell.editable || saving,
                        }}
                        disabled={!cell.editable || saving}
                        onValueChange={(enabled) =>
                          handleChange({
                            channelId: cell.channelId,
                            enabled,
                            notificationTypeId: item.id,
                          })
                        }
                        thumbColor={
                          cell.enabled
                            ? theme.colors.onBrand
                            : theme.colors.textMuted
                        }
                        trackColor={{
                          false: theme.colors.borderStrong,
                          true: theme.colors.brand,
                        }}
                        value={cell.enabled}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={{ gap: theme.spacing.sm }}>
          <AppButton
            disabled={settings.items.length === 0}
            label="Lưu tùy chọn"
            loading={saving}
            loadingLabel="Đang lưu"
            onPress={onSave}
          />
          <AppButton
            disabled={saving}
            label="Hủy thay đổi"
            onPress={onCancel}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: "100%",
  },
  channelCopy: {
    flex: 1,
    minWidth: 0,
  },
  channelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
  },
  itemHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemTitle: {
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    paddingBottom: 48,
  },
});
