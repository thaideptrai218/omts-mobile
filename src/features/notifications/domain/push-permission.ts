export type PushPermissionStatus = "denied" | "granted" | "undetermined";

export type PushPermissionState = Readonly<{
  canAskAgain: boolean;
  status: PushPermissionStatus;
}>;
