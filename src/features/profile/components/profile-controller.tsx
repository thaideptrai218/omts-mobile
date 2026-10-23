import { useMemo, useState } from "react";
import type { VerificationChannel } from "@/features/verification/domain/verification-contract";
import { ContactChangeController } from "./contact-change-controller";
import type { ContactChangeService } from "../services/contact-change-service";
import { ProfileLoadState } from "@/features/profile/components/profile-load-state";
import { useProfileController } from "@/features/profile/hooks/use-profile-controller";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import type { ProfileService } from "@/features/profile/services/profile-service";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

type ProfileControllerProps = Readonly<{
  createContactChange?: () => ContactChangeService;
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
  createContactChange,
  ...actions
}: ProfileControllerProps) {
  const [contactChannel, setContactChannel] =
    useState<VerificationChannel | null>(null);
  const contactService = useMemo(
    () => (contactChannel ? (createContactChange?.() ?? null) : null),
    [contactChannel, createContactChange],
  );
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

  if (contactChannel && contactService)
    return (
      <ContactChangeController
        key={contactChannel}
        service={contactService}
        channel={contactChannel}
        initialProfile={state.profile}
        onSaved={controller.acceptContactUpdate}
        onClose={() => setContactChannel(null)}
        onSessionExpired={onSessionExpired}
      />
    );

  return (
    <ProfileScreen
      {...actions}
      onChangeEmail={
        createContactChange
          ? () => setContactChannel("email")
          : actions.onChangeEmail
      }
      onChangePhone={
        createContactChange
          ? () => setContactChannel("sms")
          : actions.onChangePhone
      }
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
