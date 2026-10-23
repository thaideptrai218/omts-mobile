import { useEffect, useState } from "react";
import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";
import {
  validateTraderRegistration,
  type RegistrationFormErrors,
  type RegistrationFormValues,
  type RegistrationMethod,
} from "../domain/registration-form";
import type { RegistrationFlowService } from "../services/registration-flow-service";

type State =
  | { phase: "form"; values: RegistrationFormValues }
  | { phase: "verification"; challenge: VerificationChallenge; code: string }
  | { phase: "confirmation"; challenge: VerificationChallenge }
  | { phase: "completed" };
type Action = "start" | "verify" | "resend" | "complete";
const initial = (): State => ({
  phase: "form",
  values: {
    method: "email",
    identifier: "",
    password: "",
    passwordConfirmation: "",
  },
});
function message(error: unknown, action: Action) {
  if (error instanceof SessionFailure) {
    if (error.code === "offline") return resolveKnownMessage("MSG07");
    if (error.code === "verification") {
      const feedback = resolveKnownMessage("MSG16");
      return action === "start"
        ? {
            ...feedback,
            title: "Chưa thể gửi mã xác minh",
            message:
              "Chưa thể gửi mã mới lúc này. Vui lòng chờ rồi thử đăng ký lại.",
          }
        : feedback;
    }
  }
  return resolveKnownMessage("MSG04", {
    serviceName: "Dịch vụ đăng ký tài khoản",
  });
}
export function useRegistrationFlowController(
  service: RegistrationFlowService,
) {
  const scope = useRequestScope(service);
  const [state, setState] = useState<State>(initial);
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [identifiers, setIdentifiers] = useState({ email: "", phone: "" });
  useEffect(() => {
    service.activate();
    return () => service.dispose();
  }, [service]);
  async function run(action: Action) {
    if (scope.isBlocked()) return;
    if (
      (action === "start" && state.phase !== "form") ||
      ((action === "verify" || action === "resend") &&
        state.phase !== "verification") ||
      (action === "complete" && state.phase !== "confirmation")
    )
      return;
    const validation =
      state.phase === "form" ? validateTraderRegistration(state.values) : null;
    if (validation && !validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    const request = scope.begin();
    if (!request) return;
    setPending(action);
    setErrors({});
    setFeedback(null);
    try {
      if (state.phase === "form" && validation?.isValid) {
        setState({
          ...state,
          values: { ...state.values, password: "", passwordConfirmation: "" },
        });
        const result = await service.start(validation.data);
        if (!request.isActive()) return;
        if (result.status === "started")
          setState({
            phase: "verification",
            challenge: result.challenge,
            code: "",
          });
        else setFeedback(resolveKnownMessage("MSG14"));
      } else if (state.phase === "verification") {
        setState({ ...state, code: "" });
        if (action === "resend") {
          const challenge = await service.resend();
          if (request.isActive()) setState({ ...state, challenge, code: "" });
        } else {
          const result = await service.verify(state.code);
          if (!request.isActive()) return;
          if (result.status === "verified")
            setState({ phase: "confirmation", challenge: state.challenge });
          else {
            setState({
              ...state,
              code: "",
              challenge: result.challenge ?? state.challenge,
            });
            setFeedback(resolveKnownMessage("MSG16"));
          }
        }
      } else if (state.phase === "confirmation") {
        const result = await service.complete();
        if (!request.isActive()) return;
        if (result.status === "created") setState({ phase: "completed" });
        else if (result.status === "offline")
          setFeedback(resolveKnownMessage("MSG07"));
        else {
          setState(initial());
          setIdentifiers({ email: "", phone: "" });
          setFeedback(
            result.status === "unavailable"
              ? resolveKnownMessage("MSG14")
              : {
                  ...resolveKnownMessage("MSG16"),
                  title: "Cần đăng ký lại",
                  message:
                    "Xác nhận đăng ký không còn hiệu lực. Vui lòng nhập lại thông tin và xác minh để tiếp tục.",
                },
          );
        }
      }
    } catch (error) {
      if (request.isActive()) setFeedback(message(error, action));
    } finally {
      request.finish();
      if (request.isActive()) setPending(null);
    }
  }
  return {
    state,
    errors,
    feedback,
    pending,
    run,
    change(
      field: "identifier" | "password" | "passwordConfirmation",
      value: string,
    ) {
      if (scope.isBlocked() || state.phase !== "form") return;
      setState({ ...state, values: { ...state.values, [field]: value } });
      if (field === "identifier")
        setIdentifiers({ ...identifiers, [state.values.method]: value });
      setErrors({});
      setFeedback(null);
    },
    changeMethod(method: RegistrationMethod) {
      if (scope.isBlocked() || state.phase !== "form") return;
      setState({
        ...state,
        values: { ...state.values, method, identifier: identifiers[method] },
      });
      setErrors({});
      setFeedback(null);
    },
    changeCode(code: string) {
      if (!scope.isBlocked() && state.phase === "verification") {
        setState({ ...state, code });
        setFeedback(null);
      }
    },
    restart() {
      if (scope.isBlocked()) return;
      service.reset();
      setState(initial());
      setIdentifiers({ email: "", phone: "" });
      setErrors({});
      setFeedback(null);
    },
  };
}
