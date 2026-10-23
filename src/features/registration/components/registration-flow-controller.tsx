import { View } from "react-native";
import { useVerificationCountdown } from "@/features/verification/hooks/use-verification-countdown";
import {
  VerificationScreen,
  type VerificationScreenProps,
} from "@/features/verification/screens/verification-screen";
import { AppButton } from "@/shared/ui/app-button";
import { ContentState } from "@/shared/ui/content-state";
import { MessageBanner } from "@/shared/ui/message-banner";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { useRegistrationFlowController } from "../hooks/use-registration-flow-controller";
import { RegistrationScreen } from "../screens/registration-screen";
import type { RegistrationFlowService } from "../services/registration-flow-service";

function TimedVerification(props: Omit<VerificationScreenProps, "timing">) {
  const timing = useVerificationCountdown(props.challenge);
  return <VerificationScreen {...props} timing={timing} />;
}
export function RegistrationFlowController({
  service,
  onClose,
  onOpenRecovery,
}: {
  service: RegistrationFlowService;
  onClose: () => void;
  onOpenRecovery: () => void;
}) {
  const controller = useRegistrationFlowController(service);
  const { state, pending, feedback } = controller;
  if (state.phase === "form")
    return (
      <RegistrationScreen
        values={state.values}
        errors={controller.errors}
        feedback={feedback}
        pending={pending !== null}
        onChangeMethod={controller.changeMethod}
        onChangeIdentifier={(value) => controller.change("identifier", value)}
        onChangePassword={(value) => controller.change("password", value)}
        onChangePasswordConfirmation={(value) =>
          controller.change("passwordConfirmation", value)
        }
        onContinue={() => void controller.run("start")}
        onOpenLogin={onClose}
        onOpenRecovery={onOpenRecovery}
      />
    );
  if (state.phase === "verification")
    return (
      <TimedVerification
        challenge={state.challenge}
        code={state.code}
        feedback={feedback}
        backLabel="Nhập lại thông tin đăng ký"
        onBack={controller.restart}
        onChangeCode={controller.changeCode}
        onResend={() => void controller.run("resend")}
        onVerify={() => void controller.run("verify")}
        resendAllowed={state.challenge.attemptsRemaining > 0}
        pendingAction={
          pending === "verify" || pending === "resend" ? pending : null
        }
      />
    );
  return (
    <ScreenContainer>
      <View style={{ gap: 16 }}>
        {state.phase === "completed" ? (
          <ContentState
            title="Đăng ký thành công"
            description="Tài khoản thương lái đã được tạo. Hãy đăng nhập bằng email hoặc số điện thoại vừa xác minh và mật khẩu đã đăng ký."
            actionLabel="Về đăng nhập"
            onAction={onClose}
          />
        ) : (
          <>
            <ContentState
              title="Xác nhận tạo tài khoản"
              description={`Liên hệ ${state.challenge.maskedRecipient} đã được xác minh. Xác nhận để tạo tài khoản thương lái.`}
              actionLabel="Tạo tài khoản"
              actionLoading={pending === "complete"}
              onAction={() => void controller.run("complete")}
            />
            {feedback ? (
              <MessageBanner
                title={feedback.title}
                message={feedback.message}
                variant={feedback.severity}
              />
            ) : null}
            <AppButton
              label="Quay lại đăng nhập"
              onPress={onClose}
              disabled={pending !== null}
              variant="ghost"
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
