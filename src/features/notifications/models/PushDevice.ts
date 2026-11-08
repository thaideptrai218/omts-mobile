export type RegisterPushDeviceRequest = {
  token: string;
  platform: "ios" | "android" | "web";
  permissionGranted: boolean;
};

export type PushPermissionResult = "granted" | "denied";
