import type { MobileSession } from "@/features/session/domain/mobile-session";
import type { NotificationPreferenceSettings } from "../domain/notification-preferences";

// Synthetic field-use examples, NOT the pending BA catalog or backend wire IDs.
// Push/Zalo delivery and device permissions are intentionally not simulated.
export function createMockNotificationCatalog(
  session: MobileSession,
): NotificationPreferenceSettings {
  const emailVerified = session.contacts.some(
    (contact) => contact.channel === "email" && contact.verified,
  );
  return {
    channels: [
      { id: "mock-in-app", label: "Trong ứng dụng" },
      { id: "mock-email", label: "Email" },
    ],
    items: [
      {
        id: "mock-water-alert",
        label: "Cảnh báo chất lượng nước",
        mandatory: true,
      },
      { id: "mock-water-reminder", label: "Nhắc đo nước", mandatory: false },
    ].map((item) => ({
      ...item,
      channels: [
        item.mandatory
          ? {
              channelId: "mock-in-app",
              enabled: true,
              editable: false,
              reason: { code: "MSG23" },
            }
          : { channelId: "mock-in-app", enabled: true, editable: true },
        emailVerified
          ? { channelId: "mock-email", enabled: false, editable: true }
          : {
              channelId: "mock-email",
              enabled: false,
              editable: false,
              reason: { code: "MSG21", channelName: "Email" },
            },
      ],
    })),
  };
}
