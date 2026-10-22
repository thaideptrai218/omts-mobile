import {
  applyNotificationPreferenceSelection,
  changeNotificationPreference,
  listNotificationPreferenceSelections,
  type NotificationPreferenceSettings,
} from "@/features/notifications/domain/notification-preferences";

const settings: NotificationPreferenceSettings = {
  channels: [
    { id: "in-app", label: "Trong ứng dụng" },
    { id: "push", label: "Thông báo đẩy" },
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
        {
          channelId: "push",
          editable: false,
          enabled: false,
          reason: { code: "MSG22" },
        },
      ],
      id: "required-test-item",
      label: "Mục bắt buộc dùng trong test",
      mandatory: true,
    },
  ],
};

describe("notification preference domain", () => {
  test("accepts a selection that does not violate a locked cell", () => {
    expect(
      changeNotificationPreference(settings, {
        channelId: "in-app",
        enabled: true,
        notificationTypeId: "required-test-item",
      }),
    ).toEqual({
      selection: {
        channelId: "in-app",
        enabled: true,
        notificationTypeId: "required-test-item",
      },
      status: "changed",
    });
  });

  test.each([
    ["in-app", false, "MSG23"],
    ["push", true, "MSG22"],
  ] as const)(
    "blocks an invalid change to %s with its reason",
    (channelId, enabled, code) => {
      expect(
        changeNotificationPreference(settings, {
          channelId,
          enabled,
          notificationTypeId: "required-test-item",
        }),
      ).toEqual({ reason: { code }, status: "blocked" });
    },
  );

  test("rejects an unknown cell as a client contract error", () => {
    expect(() =>
      changeNotificationPreference(settings, {
        channelId: "email",
        enabled: true,
        notificationTypeId: "required-test-item",
      }),
    ).toThrow("Unknown notification preference: required-test-item:email");
  });

  test("applies an editable selection without mutating the source settings", () => {
    const editableSettings: NotificationPreferenceSettings = {
      ...settings,
      items: [
        {
          ...settings.items[0],
          channels: [{ channelId: "in-app", editable: true, enabled: true }],
        },
      ],
    };

    const changed = applyNotificationPreferenceSelection(editableSettings, {
      channelId: "in-app",
      enabled: false,
      notificationTypeId: "required-test-item",
    });

    expect(changed.items[0].channels[0].enabled).toBe(false);
    expect(editableSettings.items[0].channels[0].enabled).toBe(true);
  });

  test("flattens canonical settings into an explicit save payload", () => {
    expect(listNotificationPreferenceSelections(settings)).toEqual([
      {
        channelId: "in-app",
        enabled: true,
        notificationTypeId: "required-test-item",
      },
      {
        channelId: "push",
        enabled: false,
        notificationTypeId: "required-test-item",
      },
    ]);
  });
});
