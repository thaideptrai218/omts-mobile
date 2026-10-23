import { useMemo } from "react";
import { router } from "expo-router";
import { useMobileSession } from "@/features/session/state/mobile-session-provider";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { RecoveryFlowController } from "../components/recovery-flow-controller";

function closeRecovery() {
  router.replace("/login");
}

export function SessionRecoveryScreen() {
  const { createRecoveryFlow } = useMobileSession();
  const service = useMemo(
    () => createRecoveryFlow?.() ?? null,
    [createRecoveryFlow],
  );
  if (!service)
    return (
      <ScreenContainer>
        <ContentState
          title="Chưa thể khôi phục tài khoản"
          description="Dịch vụ khôi phục hiện chưa khả dụng."
          variant="error"
          actionLabel="Về đăng nhập"
          onAction={closeRecovery}
        />
      </ScreenContainer>
    );
  return <RecoveryFlowController service={service} onClose={closeRecovery} />;
}
