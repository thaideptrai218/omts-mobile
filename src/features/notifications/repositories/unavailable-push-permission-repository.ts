import type { PushPermissionRepository } from "./push-permission-repository";

// No OS call, prompt or fabricated granted/denied state in the mock flow.
export const unavailablePushPermissionRepository: PushPermissionRepository = {
  read: async () => ({ status: "unavailable", canAskAgain: false }),
  request: async () => ({ status: "unavailable", canAskAgain: false }),
};
