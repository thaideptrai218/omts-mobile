import { ProfileLoadState } from "@/features/profile/components/profile-load-state";
import { useProfileController } from "@/features/profile/hooks/use-profile-controller";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import type { ProfileService } from "@/features/profile/services/profile-service";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

type ProfileControllerProps = Readonly<{
  onChangeEmail?: () => void;
  onChangePhone?: () => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
  onOpenPasswordChange: () => void;
  onSessionExpired: () => void;
  service: ProfileService;
}>;

export function ProfileController({
  service,
  onSessionExpired,
  ...actions
}: ProfileControllerProps) {
  const controller = useProfileController({ service, onSessionExpired });
  const { state } = controller;

  if (state.status === "loading")
    return <ProfileLoadState status="loading" onLogout={actions.onLogout} />;
  if (state.status === "error") {
    return (
      <ProfileLoadState
        message={state.message}
        onRetry={controller.reload}
        onLogout={actions.onLogout}
        retrying={state.retrying}
        status="error"
      />
    );
  }
  if (state.status === "session-expired") {
    return (
      <ProfileLoadState
        message={resolveKnownMessage("MSG19").message}
        status="session-expired"
      />
    );
  }

  return (
    <ProfileScreen
      {...actions}
      account={state.profile.account}
      displayName={state.profile.displayName}
      conflict={
        state.conflict
          ? { onReload: controller.reload, reloading: state.reloading }
          : undefined
      }
      errors={state.errors}
      feedback={state.feedback}
      onChangeDisplayName={controller.changeDisplayName}
      onSaveProfile={() => void controller.save()}
      pending={state.saving || state.reloading}
      values={state.values}
    />
  );
}
