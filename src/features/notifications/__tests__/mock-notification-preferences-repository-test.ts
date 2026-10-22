import type { NotificationPreferenceSettings } from "@/features/notifications/domain/notification-preferences";
import { createMockNotificationPreferencesRepository } from "@/features/notifications/repositories/mock-notification-preferences-repository";

const settings: NotificationPreferenceSettings = {
  channels: [
    { id: "in-app", label: "Trong ứng dụng" },
    { id: "push", label: "Thông báo đẩy" },
    { id: "email", label: "Email" },
  ],
  items: [
    {
      channels: [
        {
          channelId: "in-app",
          editable: false,
          enabled: true,
          reason: { code: "MSG23" },
        },
      ],
      id: "mandatory-test",
      label: "Mục bắt buộc dùng trong test",
      mandatory: true,
    },
    {
      channels: [
        { channelId: "in-app", editable: true, enabled: true },
        {
          channelId: "push",
          editable: false,
          enabled: false,
          reason: { code: "MSG22" },
        },
        {
          channelId: "email",
          editable: false,
          enabled: false,
          reason: { channelName: "Email", code: "MSG21" },
        },
      ],
      id: "optional-test",
      label: "Mục tùy chọn dùng trong test",
      mandatory: false,
    },
  ],
};

describe("mock notification preferences repository", () => {
  test("loads an isolated copy instead of exposing mutable storage", async () => {
    const repository = createMockNotificationPreferencesRepository({
      initialSettings: settings,
      latencyMs: 0,
    });

    const result = await repository.load();

    expect(result).toEqual({ settings, status: "loaded" });
    expect(result.status === "loaded" && result.settings).not.toBe(settings);
  });

  test("saves an editable cell", async () => {
    const repository = createMockNotificationPreferencesRepository({
      initialSettings: settings,
      latencyMs: 0,
    });

    const result = await repository.save({
      selections: [
        {
          channelId: "in-app",
          enabled: false,
          notificationTypeId: "optional-test",
        },
      ],
    });

    expect(result.status).toBe("saved");
    expect(
      result.status === "saved" && result.settings.items[1].channels[0].enabled,
    ).toBe(false);
  });

  test.each([
    ["mandatory-test", "in-app", false, "MSG23"],
    ["optional-test", "email", true, "MSG21"],
  ] as const)(
    "rejects invalid selection %s:%s=%s with %s",
    async (notificationTypeId, channelId, enabled, code) => {
      const repository = createMockNotificationPreferencesRepository({
        initialSettings: settings,
        latencyMs: 0,
      });

      const result = await repository.save({
        selections: [{ channelId, enabled, notificationTypeId }],
      });

      expect(result.status).toBe("invalid-preference");
      expect(result.status === "invalid-preference" && result.message.code).toBe(
        code,
      );
    },
  );

  test("saves valid cells while leaving denied push inactive", async () => {
    const repository = createMockNotificationPreferencesRepository({
      initialSettings: settings,
      latencyMs: 0,
    });

    const result = await repository.save({
      selections: [
        {
          channelId: "in-app",
          enabled: false,
          notificationTypeId: "optional-test",
        },
        {
          channelId: "push",
          enabled: true,
          notificationTypeId: "optional-test",
        },
      ],
    });

    expect(result.status).toBe("saved");
    expect(result.status === "saved" && result.warning).toEqual({ code: "MSG22" });
    expect(
      result.status === "saved" && result.settings.items[1].channels[0].enabled,
    ).toBe(false);
    expect(
      result.status === "saved" && result.settings.items[1].channels[1].enabled,
    ).toBe(false);
  });

  test("returns session expiry without mutating settings", async () => {
    const repository = createMockNotificationPreferencesRepository({
      initialSettings: settings,
      isSessionActive: () => false,
      latencyMs: 0,
    });

    await expect(repository.load()).resolves.toEqual({
      message: { code: "MSG19" },
      status: "session-expired",
    });
  });
});
