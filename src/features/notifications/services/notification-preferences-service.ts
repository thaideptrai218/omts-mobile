import type { SaveNotificationPreferencesInput } from "@/features/notifications/domain/notification-preferences";
import type { NotificationPreferencesRepository } from "@/features/notifications/repositories/notification-preferences-repository";

export function createNotificationPreferencesService(
  repository: NotificationPreferencesRepository,
) {
  return {
    load: () => repository.load(),
    save: (input: SaveNotificationPreferencesInput) => repository.save(input),
  } as const;
}

export type NotificationPreferencesService = ReturnType<
  typeof createNotificationPreferencesService
>;
