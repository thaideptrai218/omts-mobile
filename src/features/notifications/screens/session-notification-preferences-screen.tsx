import { useMemo } from "react";
import { router } from "expo-router";
import { useMobileSession } from "@/features/session/state/mobile-session-provider";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { NotificationPreferencesController } from "../components/notification-preferences-controller";
import { unavailablePushPermissionRepository } from "../repositories/unavailable-push-permission-repository";
import { createSessionNotificationPreferencesService } from "../services/session-notification-preferences-service";

function closePreferences() {
  router.replace("/account");
}

export function SessionNotificationPreferencesScreen() {
  const { store, snapshot, notificationGateway } = useMobileSession();
  const accountId =
    snapshot.status === "active" && snapshot.session.nextAction === "ready"
      ? snapshot.session.accountId
      : null;
  const binding = useMemo(() => {
    if (!store || !notificationGateway || !accountId) return null;
    const scope = store.createAccountScope(accountId);
    return {
      service: createSessionNotificationPreferencesService(
        scope,
        notificationGateway,
      ),
      expire: scope.expire,
    };
  }, [store, notificationGateway, accountId]);

  if (!accountId) return null;
  if (!binding)
    return (
      <ScreenContainer>
        <ContentState
          title="Chưa thể tải tùy chọn"
          description="Dịch vụ tùy chọn thông báo hiện chưa khả dụng."
          variant="error"
          actionLabel="Quay lại hồ sơ"
          onAction={closePreferences}
        />
      </ScreenContainer>
    );
  return (
    <NotificationPreferencesController
      key={accountId}
      preferencesService={binding.service}
      pushPermissionRepository={unavailablePushPermissionRepository}
      onSessionExpired={() => void binding.expire()}
      onClose={closePreferences}
    />
  );
}
