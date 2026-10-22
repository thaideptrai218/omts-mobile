import { SessionFailure } from "../domain/mobile-session";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

export function sessionFeedback(error: unknown) {
  if (error instanceof SessionFailure) {
    switch (error.code) {
      case "credentials":
        return resolveKnownMessage("MSG12");
      case "expired":
        return resolveKnownMessage("MSG19");
      case "offline":
        return resolveKnownMessage("MSG07");
      case "verification":
        return resolveKnownMessage("MSG16");
    }
  }
  return resolveKnownMessage("MSG04", { serviceName: "Dịch vụ tài khoản" });
}
