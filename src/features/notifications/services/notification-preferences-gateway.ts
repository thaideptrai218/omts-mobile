import type { SessionCredential } from "@/features/session/domain/mobile-session";
import type {
  LoadNotificationPreferencesResult,
  SaveNotificationPreferencesInput,
  SaveNotificationPreferencesResult,
} from "../domain/notification-preferences";

// Application boundary only; not a confirmed backend endpoint/DTO.
export type NotificationPreferencesGateway = Readonly<{
  load(
    credential: SessionCredential,
  ): Promise<LoadNotificationPreferencesResult>;
  save(
    credential: SessionCredential,
    input: SaveNotificationPreferencesInput,
  ): Promise<SaveNotificationPreferencesResult>;
}>;
