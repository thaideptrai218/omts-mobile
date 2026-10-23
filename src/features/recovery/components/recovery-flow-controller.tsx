import { useVerificationCountdown } from "@/features/verification/hooks/use-verification-countdown";
import {
  VerificationScreen,
  type VerificationScreenProps,
} from "@/features/verification/screens/verification-screen";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { useRecoveryFlowController } from "../hooks/use-recovery-flow-controller";
import { RecoveryRequestScreen } from "../screens/recovery-request-screen";
import type { RecoveryFlowService } from "../services/recovery-flow-service";
import { RecoveryNewPasswordController } from "./recovery-new-password-controller";

function TimedRecoveryVerification(
  props: Omit<VerificationScreenProps, "timing">,
) {
  const timing = useVerificationCountdown(props.challenge);
  return <VerificationScreen {...props} timing={timing} />;
}

export function RecoveryFlowController({
  service,
  onClose,
}: {
  service: RecoveryFlowService;
  onClose: () => void;
}) {
  const controller = useRecoveryFlowController(service);
  const { state, pending } = controller;
  if (state.phase === "password")
    return (
      <RecoveryNewPasswordController
        service={service.completion}
        onCompleted={controller.completed}
        onBackToLogin={onClose}
      />
    );
  if (state.phase === "completed")
    return (
      <ScreenContainer>
        <ContentState
          title="Đặt lại mật khẩu thành công"
          description="Mật khẩu đã được cập nhật. Hãy đăng nhập lại để tiếp tục sử dụng OMTS."
          actionLabel="Về đăng nhập"
          onAction={onClose}
        />
      </ScreenContainer>
    );
  if (state.phase === "verification")
    return (
      <TimedRecoveryVerification
        challenge={state.challenge}
        code={state.code}
        feedback={state.feedback}
        description="Nếu liên hệ đủ điều kiện khôi phục, hãy nhập mã gồm 6 chữ số được gửi tới thông tin bên dưới."
        recipientLabel="Thông tin nhận mã"
        backLabel="Đổi email hoặc số điện thoại"
        pendingAction={pending === "start" ? null : pending}
        resendAllowed={state.challenge.attemptsRemaining > 0}
        onBack={controller.changeDelivery}
        onChangeCode={controller.changeCode}
        onResend={() => void controller.runCode("resend")}
        onVerify={() => void controller.runCode("verify")}
      />
    );
  return (
    <RecoveryRequestScreen
      values={{ identifier: state.identifier }}
      errors={state.errors}
      feedback={state.feedback}
      genericResponseVisible={!!state.challenge}
      pending={pending === "start"}
      onBackToLogin={onClose}
      onChangeIdentifier={controller.changeIdentifier}
      onContinueToVerification={controller.continueToVerification}
      onSendCode={() => void controller.start()}
    />
  );
}
