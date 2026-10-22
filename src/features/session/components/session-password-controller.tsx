import { useMemo } from "react";
import { router } from "expo-router";
import { PasswordChangeController } from "@/features/security/components/password-change-controller";
import type { PasswordChangeService } from "@/features/security/services/password-change-service";
import { SessionFailure } from "../domain/mobile-session";
import { useMobileSession } from "../state/mobile-session-provider";

export function SessionPasswordController({ forced }: { forced: boolean }) {
  const { store } = useMobileSession();
  const service = useMemo<PasswordChangeService>(
    () => ({
      async change(input) {
        if (!store) return { status: "session-expired" };
        try {
          const changed = await store.changePassword(
            input.currentPassword,
            input.newPassword,
          );
          if (!changed) return { status: "current-password-invalid" };
          return { status: "changed" };
        } catch (error) {
          if (error instanceof SessionFailure && error.code === "expired")
            return { status: "session-expired" };
          if (error instanceof SessionFailure && error.code === "offline")
            return { status: "offline" };
          throw error;
        }
      },
    }),
    [store],
  );

  const shared = {
    service,
    onChanged: () => router.replace("/"),
    onSessionExpired: () => router.replace("/"),
  };
  return forced ? (
    <PasswordChangeController {...shared} mode="forced" />
  ) : (
    <PasswordChangeController
      {...shared}
      mode="standard"
      onCancel={() => router.replace("/account")}
    />
  );
}
