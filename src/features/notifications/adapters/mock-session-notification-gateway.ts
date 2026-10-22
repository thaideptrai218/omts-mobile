import {
  SessionFailure,
  type MobileSession,
  type SessionCredential,
} from "@/features/session/domain/mobile-session";
import type { NotificationPreferencesRepository } from "../repositories/notification-preferences-repository";
import { createMockNotificationPreferencesRepository } from "../repositories/mock-notification-preferences-repository";
import type { NotificationPreferencesGateway } from "../services/notification-preferences-gateway";
import { createMockNotificationCatalog } from "./mock-notification-catalog";

export function createMockSessionNotificationGateway(
  resolveSession: (credential: SessionCredential) => MobileSession,
): NotificationPreferencesGateway {
  const accounts = new Map<string, NotificationPreferencesRepository>();
  function repository(credential: SessionCredential) {
    const session = resolveSession(credential);
    if (session.nextAction !== "ready") throw new SessionFailure("unavailable");
    let result = accounts.get(session.accountId);
    if (!result) {
      result = createMockNotificationPreferencesRepository({
        initialSettings: createMockNotificationCatalog(session),
        latencyMs: 0,
      });
      accounts.set(session.accountId, result);
    }
    return result;
  }
  return {
    load: (credential) => repository(credential).load(),
    save: (credential, input) => repository(credential).save(input),
  };
}
