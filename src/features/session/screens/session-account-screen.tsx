import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useConnectivity } from "@/features/connectivity/state/connectivity-provider";
import { ProfileController } from "@/features/profile/components/profile-controller";
import { createSessionProfileService } from "@/features/profile/services/session-profile-service";
import { createContactChangeService } from "@/features/profile/services/contact-change-service";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { useMobileSession } from "../state/mobile-session-provider";
import { LogoutConfirmationDialog } from "../components/logout-confirmation-dialog";
import { SessionLogoutAction } from "../components/session-logout-action";

export function SessionAccountScreen() {
  const {
    store,
    snapshot,
    profileGateway,
    notificationGateway,
    contactChangeGateway,
  } = useMobileSession();
  const { status } = useConnectivity();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const accountId =
    snapshot.status === "active" && snapshot.session.nextAction === "ready"
      ? snapshot.session.accountId
      : null;
  const binding = useMemo(() => {
    if (!store || !profileGateway || !accountId) return null;
    const scope = store.createAccountScope(accountId);
    return {
      service: createSessionProfileService(scope, profileGateway),
      expire: scope.expire,
      createContactChange: contactChangeGateway
        ? () =>
            createContactChangeService(
              scope,
              contactChangeGateway,
              profileGateway,
            )
        : undefined,
    };
  }, [store, profileGateway, accountId, contactChangeGateway]);

  if (!accountId) return null;
  if (!binding)
    return (
      <ScreenContainer>
        <ContentState
          title="Chưa thể tải hồ sơ"
          description="Dịch vụ hồ sơ hiện chưa khả dụng. Vui lòng thử lại sau."
          variant="error"
        />
        <SessionLogoutAction />
      </ScreenContainer>
    );

  return (
    <View style={{ flex: 1 }}>
      <ProfileController
        key={accountId}
        service={binding.service}
        createContactChange={binding.createContactChange}
        onSessionExpired={() => void binding.expire()}
        onOpenPasswordChange={() => router.push("/security")}
        onOpenNotifications={
          notificationGateway &&
          snapshot.status === "active" &&
          snapshot.session.subjectType === "Staff"
            ? () => router.push("/notification-preferences")
            : undefined
        }
        onLogout={() => setLogoutVisible(true)}
      />
      <LogoutConfirmationDialog
        visible={logoutVisible}
        confirming={false}
        connectivity={status}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          void store?.logout();
        }}
      />
    </View>
  );
}
