import {
  SessionFailure,
  type AccountSessionScope,
} from "@/features/session/domain/mobile-session";
import type { ProfileGateway } from "./profile-gateway";
import type { ProfileService } from "./profile-service";

export function createSessionProfileService(
  scope: AccountSessionScope,
  gateway: ProfileGateway,
): ProfileService {
  return {
    async load() {
      try {
        const profile = await scope.run((credential) =>
          gateway.load(credential),
        );
        scope.acceptDisplayName(profile.displayName);
        return { status: "loaded", profile };
      } catch (error) {
        if (error instanceof SessionFailure && error.code === "expired")
          return { status: "session-expired" };
        if (error instanceof SessionFailure && error.code === "offline")
          return { status: "offline" };
        throw error;
      }
    },
    async save(input) {
      try {
        const result = await scope.run(async (credential) => {
          const response = await gateway.save(credential, input);
          if (response.status === "session-expired")
            throw new SessionFailure("expired");
          return response;
        });
        if (result.status === "saved")
          scope.acceptDisplayName(result.profile.displayName);
        return result;
      } catch (error) {
        if (error instanceof SessionFailure && error.code === "expired")
          return { status: "session-expired" };
        if (error instanceof SessionFailure && error.code === "offline")
          return { status: "offline" };
        throw error;
      }
    },
  };
}
