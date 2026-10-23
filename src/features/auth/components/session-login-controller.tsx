import { useState } from "react";
import { router } from "expo-router";
import { LoginScreen } from "../screens/login-screen";
import { validateLoginForm, type LoginFormErrors } from "../domain/login-form";
import { useMobileSession } from "@/features/session/state/mobile-session-provider";
import { sessionFeedback } from "@/features/session/services/session-feedback";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

export function SessionLoginController() {
  const { store, snapshot, createRecoveryFlow } = useMobileSession();
  const scope = useRequestScope(store ?? {});
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState(false);

  async function login() {
    if (!store || scope.isBlocked()) return;
    const validation = validateLoginForm(values);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    const request = scope.begin();
    if (!request) return;
    setPending(true);
    setFeedback(null);
    setErrors({});
    try {
      await store.login(
        validation.credentials.identifier,
        validation.credentials.password,
      );
    } catch (error) {
      if (request.isActive()) setFeedback(sessionFeedback(error));
    } finally {
      request.finish();
      if (request.isActive()) {
        setPending(false);
        setValues((current) => ({ ...current, password: "" }));
      }
    }
  }

  function change(field: "identifier" | "password", value: string) {
    if (scope.isBlocked()) return;
    store?.acknowledgeSignOutReason();
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }
  return (
    <LoginScreen
      values={values}
      errors={errors}
      feedback={
        feedback ??
        (snapshot.status === "signedOut" && snapshot.reason === "sessionExpired"
          ? resolveKnownMessage("MSG19")
          : null)
      }
      pending={pending}
      onChangeIdentifier={(value) => change("identifier", value)}
      onChangePassword={(value) => change("password", value)}
      onLogin={() => void login()}
      onOpenRecovery={
        createRecoveryFlow
          ? () => {
              if (scope.isBlocked()) return;
              store?.acknowledgeSignOutReason();
              setValues((current) => ({ ...current, password: "" }));
              router.push("/recovery");
            }
          : undefined
      }
    />
  );
}
