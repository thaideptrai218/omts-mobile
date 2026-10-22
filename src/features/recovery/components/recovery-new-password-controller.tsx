import { useRecoveryNewPasswordController } from "@/features/recovery/hooks/use-recovery-new-password-controller";
import { RecoveryNewPasswordScreen } from "@/features/recovery/screens/recovery-new-password-screen";
import type { RecoveryCompletionService } from "@/features/recovery/services/recovery-completion-service";

type RecoveryNewPasswordControllerProps = Readonly<{
  onBackToLogin: () => void;
  onCompleted: () => void;
  service: RecoveryCompletionService;
}>;

export function RecoveryNewPasswordController({
  onBackToLogin,
  onCompleted,
  service,
}: RecoveryNewPasswordControllerProps) {
  const controller = useRecoveryNewPasswordController({ onCompleted, service });

  return (
    <RecoveryNewPasswordScreen
      errors={controller.errors}
      feedback={controller.feedback}
      onBackToLogin={() => {
        if (controller.reset()) onBackToLogin();
      }}
      onChangePassword={controller.onChangePassword}
      onChangePasswordConfirmation={controller.onChangePasswordConfirmation}
      onResetPassword={() => void controller.submit()}
      pending={controller.pending}
      values={controller.values}
    />
  );
}
