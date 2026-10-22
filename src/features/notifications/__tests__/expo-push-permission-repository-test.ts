import * as Notifications from "expo-notifications";

import { createExpoPushPermissionRepository } from "@/features/notifications/repositories/expo-push-permission-repository";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  IosAlertStyle: { BANNER: 1 },
  IosAllowsPreviews: { ALWAYS: 1 },
  IosAuthorizationStatus: {
    AUTHORIZED: 2,
    DENIED: 1,
    EPHEMERAL: 4,
    NOT_DETERMINED: 0,
    PROVISIONAL: 3,
  },
  PermissionStatus: {
    DENIED: "denied",
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

function permission(
  status: Notifications.PermissionStatus,
  overrides: Partial<Notifications.NotificationPermissionsStatus> = {},
): Notifications.NotificationPermissionsStatus {
  return {
    canAskAgain: status !== Notifications.PermissionStatus.DENIED,
    expires: "never",
    granted: status === Notifications.PermissionStatus.GRANTED,
    status,
    ...overrides,
  };
}

describe("Expo push permission repository", () => {
  test("reads permission without opening a system prompt", async () => {
    const gateway = {
      getPermissionsAsync: jest
        .fn()
        .mockResolvedValue(permission(Notifications.PermissionStatus.UNDETERMINED)),
      requestPermissionsAsync: jest.fn(),
      setNotificationChannelAsync: jest.fn(),
    };
    const repository = createExpoPushPermissionRepository({ gateway });

    await expect(repository.read()).resolves.toEqual({
      canAskAgain: true,
      status: "undetermined",
    });
    expect(gateway.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test("creates the Android channel before the explicit permission request", async () => {
    const gateway = {
      getPermissionsAsync: jest.fn(),
      requestPermissionsAsync: jest
        .fn()
        .mockResolvedValue(permission(Notifications.PermissionStatus.GRANTED)),
      setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    };
    const repository = createExpoPushPermissionRepository({
      gateway,
      platform: "android",
    });

    await expect(repository.request()).resolves.toEqual({
      canAskAgain: true,
      status: "granted",
    });
    expect(gateway.setNotificationChannelAsync).toHaveBeenCalledWith(
      "general",
      expect.objectContaining({ name: "Thông báo chung" }),
    );
    expect(
      gateway.setNotificationChannelAsync.mock.invocationCallOrder[0],
    ).toBeLessThan(gateway.requestPermissionsAsync.mock.invocationCallOrder[0]);
  });

  test("maps a denied OS response without pretending push is active", async () => {
    const gateway = {
      getPermissionsAsync: jest.fn(),
      requestPermissionsAsync: jest
        .fn()
        .mockResolvedValue(permission(Notifications.PermissionStatus.DENIED)),
      setNotificationChannelAsync: jest.fn(),
    };
    const repository = createExpoPushPermissionRepository({
      gateway,
      platform: "ios",
    });

    await expect(repository.request()).resolves.toEqual({
      canAskAgain: false,
      status: "denied",
    });
    expect(gateway.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  test("treats iOS provisional authorization as usable", async () => {
    const gateway = {
      getPermissionsAsync: jest.fn().mockResolvedValue(
        permission(Notifications.PermissionStatus.UNDETERMINED, {
          ios: {
            alertStyle: Notifications.IosAlertStyle.BANNER,
            allowsAlert: true,
            allowsAnnouncements: null,
            allowsBadge: true,
            allowsCriticalAlerts: false,
            allowsDisplayInCarPlay: false,
            allowsDisplayInNotificationCenter: true,
            allowsDisplayOnLockScreen: true,
            allowsPreviews: Notifications.IosAllowsPreviews.ALWAYS,
            allowsSound: true,
            providesAppNotificationSettings: false,
            status: Notifications.IosAuthorizationStatus.PROVISIONAL,
          },
        }),
      ),
      requestPermissionsAsync: jest.fn(),
      setNotificationChannelAsync: jest.fn(),
    };
    const repository = createExpoPushPermissionRepository({ gateway });

    await expect(repository.read()).resolves.toMatchObject({ status: "granted" });
  });
});
