export type PushPermissionStatus =
  | "denied"
  | "granted"
  | "undetermined"
  | "unavailable";

export type PushPermissionState = Readonly<{
  canAskAgain: boolean;
  status: PushPermissionStatus;
}>;
