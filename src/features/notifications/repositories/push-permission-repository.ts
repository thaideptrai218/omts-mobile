import type { PushPermissionState } from "@/features/notifications/domain/push-permission";

export type PushPermissionRepository = Readonly<{
  read(): Promise<PushPermissionState>;
  request(): Promise<PushPermissionState>;
}>;
