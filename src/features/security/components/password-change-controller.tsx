import type { PasswordChangeService } from "@/features/security/services/password-change-service";
import { usePasswordChangeController } from "@/features/security/hooks/use-password-change-controller";
import { PasswordChangeScreen } from "@/features/security/screens/password-change-screen";

type BasePasswordChangeControllerProps = Readonly<{
  onChanged: () => void;
  onSessionExpired: () => void;
  service: PasswordChangeService;
}>;

type PasswordChangeControllerProps = BasePasswordChangeControllerProps &
  (
    | Readonly<{ mode: "forced"; onCancel?: never }>
    | Readonly<{ mode: "standard"; onCancel: () => void }>
  );

export function PasswordChangeController(
  props: PasswordChangeControllerProps,
) {
  const controller = usePasswordChangeController({
    onChanged: props.onChanged,
    onSessionExpired: props.onSessionExpired,
    service: props.service,
  });
  const sharedProps = {
    errors: controller.errors,
    feedback: controller.feedback,
    onChangeCurrentPassword: controller.onChangeCurrentPassword,
    onChangePassword: controller.onChangePassword,
    onChangePasswordConfirmation: controller.onChangePasswordConfirmation,
    onSave: () => void controller.submit(),
    pending: controller.pending,
    values: controller.values,
  } as const;

  if (props.mode === "forced") {
    return <PasswordChangeScreen {...sharedProps} mode="forced" />;
  }

  return (
    <PasswordChangeScreen
      {...sharedProps}
      mode="standard"
      onCancel={() => {
        if (controller.reset()) props.onCancel();
      }}
    />
  );
}
