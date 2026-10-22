import { useCallback, useState } from "react";

import type { RecoveryCompletionResult, RecoveryCompletionService } from "@/features/recovery/services/recovery-completion-service";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";
import {
  validateNewPassword,
  type NewPasswordErrors,
  type NewPasswordFormValues,
} from "@/shared/security/new-password-policy";

const emptyValues: NewPasswordFormValues = {
  password: "",
  passwordConfirmation: "",
};

type RecoveryNewPasswordControllerDependencies = Readonly<{
  onCompleted: () => void;
  service: RecoveryCompletionService;
}>;

export function useRecoveryNewPasswordController({
  onCompleted,
  service,
}: RecoveryNewPasswordControllerDependencies) {
  const requestScope = useRequestScope(service);
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<NewPasswordFormValues>(emptyValues);

  const changeField = useCallback(
    (field: keyof NewPasswordFormValues, value: string) => {
      if (requestScope.isBlocked()) return;
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFeedback(null);
    },
    [requestScope],
  );

  const reset = useCallback(() => {
    if (requestScope.isBlocked()) return false;
    setErrors({});
    setFeedback(null);
    setValues(emptyValues);
    return true;
  }, [requestScope]);

  const submit = useCallback(async () => {
    if (requestScope.isBlocked()) return;

    const validation = validateNewPassword(values);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setFeedback(null);
      return;
    }

    const request = requestScope.begin();
    if (!request) return;
    setErrors({});
    setFeedback(null);
    setPending(true);

    let result: RecoveryCompletionResult;
    try {
      result = await service.complete({
        newPassword: validation.data.password,
      });
    } catch {
      if (!request.isActive()) return;
      setPending(false);
      setValues(emptyValues);
      setFeedback(
        resolveKnownMessage("MSG04", {
          serviceName: "Dịch vụ khôi phục tài khoản",
        }),
      );
      return;
    } finally {
      request.finish();
    }
    if (!request.isActive()) return;
    setPending(false);
    setValues(emptyValues);
    if (result.status === "completed") {
      onCompleted();
    } else {
      setFeedback(resolveKnownMessage("MSG16"));
    }
  }, [onCompleted, requestScope, service, values]);

  return {
    errors,
    feedback,
    onChangePassword: (value: string) => changeField("password", value),
    onChangePasswordConfirmation: (value: string) =>
      changeField("passwordConfirmation", value),
    pending,
    reset,
    submit,
    values,
  } as const;
}
