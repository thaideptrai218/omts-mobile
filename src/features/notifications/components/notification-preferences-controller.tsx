import { NotificationPreferencesScreen } from "@/features/notifications/screens/notification-preferences-screen";
import type { PushPermissionRepository } from "@/features/notifications/repositories/push-permission-repository";
import type { NotificationPreferencesService } from "@/features/notifications/services/notification-preferences-service";
import { useNotificationPreferencesController } from "@/features/notifications/hooks/use-notification-preferences-controller";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";

type NotificationPreferencesControllerProps = Readonly<{
  onClose: () => void;
  onSessionExpired: () => void;
  preferencesService: NotificationPreferencesService;
  pushPermissionRepository: PushPermissionRepository;
}>;

export function NotificationPreferencesController({
  onClose,
  onSessionExpired,
  preferencesService,
  pushPermissionRepository,
}: NotificationPreferencesControllerProps) {
  const controller = useNotificationPreferencesController({
    onSessionExpired,
    preferencesService,
    pushPermissionRepository,
  });

  if (controller.state.status === "loading") {
    return <NotificationPreferencesScreen status="loading" />;
  }

  if (controller.state.status === "session-expired") {
    return (
      <ScreenContainer>
        <ContentState
          description={resolveKnownMessage("MSG19").message}
          title="Cần đăng nhập lại"
          variant="error"
        />
      </ScreenContainer>
    );
  }

  if (controller.state.status === "error") {
    return (
      <NotificationPreferencesScreen
        message={controller.state.message}
        onRetry={() => void controller.load()}
        retrying={controller.state.retrying}
        status="error"
      />
    );
  }

  return (
    <NotificationPreferencesScreen
      feedback={controller.state.feedback}
      onCancel={() => {
        if (controller.cancel()) onClose();
      }}
      onChange={controller.change}
      onRequestPushPermission={() => void controller.requestPushPermission()}
      onSave={() => void controller.save()}
      pushPermission={controller.state.pushPermission}
      requestingPushPermission={controller.state.requestingPushPermission}
      saving={controller.state.saving}
      settings={controller.state.settings}
      status="ready"
    />
  );
}
