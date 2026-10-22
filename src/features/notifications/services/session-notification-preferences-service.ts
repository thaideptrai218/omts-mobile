import {
  SessionFailure,
  type AccountSessionScope,
} from "@/features/session/domain/mobile-session";
import type { NotificationPreferencesGateway } from "./notification-preferences-gateway";
import type { NotificationPreferencesService } from "./notification-preferences-service";

export function createSessionNotificationPreferencesService(
  scope: AccountSessionScope,
  gateway: NotificationPreferencesGateway,
): NotificationPreferencesService {
  return {
    async load() {
      try {
        return await scope.run(async (credential) => {
          const result = await gateway.load(credential);
          if (result.status === "session-expired")
            throw new SessionFailure("expired");
          return result;
        });
      } catch (error) {
        if (error instanceof SessionFailure && error.code === "expired")
          return { status: "session-expired", message: { code: "MSG19" } };
        if (error instanceof SessionFailure && error.code === "offline")
          return { status: "offline" };
        throw error;
      }
    },
    async save(input) {
      try {
        return await scope.run(async (credential) => {
          const result = await gateway.save(credential, input);
          if (result.status === "session-expired")
            throw new SessionFailure("expired");
          return result;
        });
      } catch (error) {
        if (error instanceof SessionFailure && error.code === "expired")
          return { status: "session-expired", message: { code: "MSG19" } };
        if (error instanceof SessionFailure && error.code === "offline")
          return { status: "offline" };
        throw error;
      }
    },
  };
}
