import { useMemo } from "react";
import { router } from "expo-router";
import { useMobileSession } from "@/features/session/state/mobile-session-provider";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { RegistrationFlowController } from "../components/registration-flow-controller";

function close() {
  router.replace("/login");
}
export function SessionRegistrationScreen() {
  const { createRegistrationFlow } = useMobileSession();
  const service = useMemo(
    () => createRegistrationFlow?.() ?? null,
    [createRegistrationFlow],
  );
  if (!service)
    return (
      <ScreenContainer>
        <ContentState
          title="Chưa thể đăng ký tài khoản"
          description="Dịch vụ đăng ký hiện chưa khả dụng."
          variant="error"
          actionLabel="Về đăng nhập"
          onAction={close}
        />
      </ScreenContainer>
    );
  return (
    <RegistrationFlowController
      service={service}
      onClose={close}
      onOpenRecovery={() => router.replace("/recovery")}
    />
  );
}
