import { useCallback, useState } from "react";

import {
  validatePasswordChange,
  type PasswordChangeFormErrors,
  type PasswordChangeFormValues,
} from "@/features/security/domain/password-change-form";
import type {
  PasswordChangeResult,
  PasswordChangeService,
} from "@/features/security/services/password-change-service";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

const emptyValues: PasswordChangeFormValues = {
  currentPassword: "",
  password: "",
  passwordConfirmation: "",
};

type PasswordChangeControllerDependencies = Readonly<{
  onChanged: () => void;
  onSessionExpired: () => void;
  service: PasswordChangeService;
}>;

export function usePasswordChangeController({
  onChanged,
  onSessionExpired,
  service,
}: PasswordChangeControllerDependencies) {
  const requestScope = useRequestScope(service);
  const [errors, setErrors] = useState<PasswordChangeFormErrors>({});
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<PasswordChangeFormValues>(emptyValues);

  const changeField = useCallback(
    (field: keyof PasswordChangeFormValues, value: string) => {
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

    const validation = validatePasswordChange(values);
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

    let result: PasswordChangeResult;
    try {
      result = await service.change(validation.data);
    } catch {
      if (!request.isActive()) return;
      setPending(false);
      setValues(emptyValues);
      setFeedback(
        resolveKnownMessage("MSG04", { serviceName: "Dịch vụ đổi mật khẩu" }),
      );
      return;
    } finally {
      request.finish();
    }
    if (!request.isActive()) return;
    setPending(false);
    setValues(emptyValues);

    if (result.status === "changed") {
      setFeedback(resolveKnownMessage("MSG18"));
      onChanged();
    } else if (result.status === "session-expired") {
      setFeedback(resolveKnownMessage("MSG19"));
      onSessionExpired();
    } else if (result.status === "offline") {
      setFeedback(resolveKnownMessage("MSG07"));
    } else {
      setFeedback(resolveKnownMessage("MSG17"));
    }
  }, [onChanged, onSessionExpired, requestScope, service, values]);

  return {
    errors,
    feedback,
    onChangeCurrentPassword: (value: string) =>
      changeField("currentPassword", value),
    onChangePassword: (value: string) => changeField("password", value),
    onChangePasswordConfirmation: (value: string) =>
      changeField("passwordConfirmation", value),
    pending,
    reset,
    submit,
    values,
  } as const;
}
