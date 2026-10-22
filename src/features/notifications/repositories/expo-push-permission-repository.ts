import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { PushPermissionState } from "@/features/notifications/domain/push-permission";
import type { PushPermissionRepository } from "@/features/notifications/repositories/push-permission-repository";

type ExpoNotificationPermissionGateway = Pick<
  typeof Notifications,
  | "getPermissionsAsync"
  | "requestPermissionsAsync"
  | "setNotificationChannelAsync"
>;

type ExpoPushPermissionRepositoryOptions = Readonly<{
  gateway?: ExpoNotificationPermissionGateway;
  platform?: typeof Platform.OS;
}>;

export function mapExpoPushPermission(
  permission: Notifications.NotificationPermissionsStatus,
): PushPermissionState {
  const provisionalIosPermission =
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (permission.granted || provisionalIosPermission) {
    return { canAskAgain: permission.canAskAgain, status: "granted" };
  }

  if (permission.status === Notifications.PermissionStatus.DENIED) {
    return { canAskAgain: permission.canAskAgain, status: "denied" };
  }

  return { canAskAgain: permission.canAskAgain, status: "undetermined" };
}

export function createExpoPushPermissionRepository({
  gateway = Notifications,
  platform = Platform.OS,
}: ExpoPushPermissionRepositoryOptions = {}): PushPermissionRepository {
  return {
    async read() {
      return mapExpoPushPermission(await gateway.getPermissionsAsync());
    },

    async request() {
      if (platform === "android") {
        await gateway.setNotificationChannelAsync("general", {
          importance: Notifications.AndroidImportance.DEFAULT,
          name: "Thông báo chung",
        });
      }

      const permission = await gateway.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      return mapExpoPushPermission(permission);
    },
  };
}
