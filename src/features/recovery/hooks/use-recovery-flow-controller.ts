import { useEffect, useState } from "react";
import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";
import {
  validateRecoveryRequest,
  type RecoveryRequestFormErrors,
} from "../domain/recovery-request-form";
import type { RecoveryFlowService } from "../services/recovery-flow-service";

type RecoveryState =
  | {
      phase: "request";
      identifier: string;
      errors: RecoveryRequestFormErrors;
      challenge: VerificationChallenge | null;
      feedback: ResolvedMessage | null;
    }
  | {
      phase: "verification";
      challenge: VerificationChallenge;
      code: string;
      feedback: ResolvedMessage | null;
    }
  | { phase: "password" }
  | { phase: "completed" };
const initialState = (): RecoveryState => ({
  phase: "request",
  identifier: "",
  errors: {},
  challenge: null,
  feedback: null,
});

function failure(error: unknown) {
  return error instanceof SessionFailure && error.code === "offline"
    ? resolveKnownMessage("MSG07")
    : resolveKnownMessage("MSG04", {
        serviceName: "Dịch vụ khôi phục tài khoản",
      });
}

export function useRecoveryFlowController(service: RecoveryFlowService) {
  const scope = useRequestScope(service);
  const [state, setState] = useState<RecoveryState>(initialState);
  const [pending, setPending] = useState<"start" | "verify" | "resend" | null>(
    null,
  );
  useEffect(() => {
    service.activate();
    return () => service.dispose();
  }, [service]);

  async function start() {
    if (state.phase !== "request" || state.challenge || scope.isBlocked())
      return;
    const validation = validateRecoveryRequest({
      identifier: state.identifier,
    });
    if (!validation.isValid) {
      setState({ ...state, errors: validation.errors });
      return;
    }
    const request = scope.begin();
    if (!request) return;
    setPending("start");
    setState({ ...state, errors: {}, feedback: null });
    try {
      const challenge = await service.start(validation.identifier);
      if (request.isActive())
        setState({ ...state, errors: {}, challenge, feedback: null });
    } catch (error) {
      if (request.isActive())
        setState({ ...state, errors: {}, feedback: failure(error) });
    } finally {
      request.finish();
      if (request.isActive()) setPending(null);
    }
  }
  async function runCode(action: "verify" | "resend") {
    if (state.phase !== "verification") return;
    const request = scope.begin();
    if (!request) return;
    setPending(action);
    setState({ ...state, feedback: null });
    try {
      if (action === "resend") {
        const challenge = await service.resend();
        if (request.isActive())
          setState({
            ...state,
            code: "",
            challenge,
            feedback: resolveKnownMessage("MSG15"),
          });
      } else {
        const result = await service.verify(state.code);
        if (!request.isActive()) return;
        setState(
          result.status === "verified"
            ? { phase: "password" }
            : {
                ...state,
                code: "",
                challenge: result.challenge ?? state.challenge,
                feedback: resolveKnownMessage("MSG16"),
              },
        );
      }
    } catch (error) {
      if (request.isActive())
        setState({ ...state, code: "", feedback: failure(error) });
    } finally {
      request.finish();
      if (request.isActive()) setPending(null);
    }
  }
  return {
    state,
    pending,
    start,
    runCode,
    changeIdentifier(identifier: string) {
      if (!scope.isBlocked() && state.phase === "request" && !state.challenge)
        setState({ ...state, identifier, errors: {}, feedback: null });
    },
    continueToVerification() {
      if (!scope.isBlocked() && state.phase === "request" && state.challenge)
        setState({
          phase: "verification",
          challenge: state.challenge,
          code: "",
          feedback: null,
        });
    },
    changeCode(code: string) {
      if (!scope.isBlocked() && state.phase === "verification")
        setState({ ...state, code, feedback: null });
    },
    changeDelivery() {
      if (scope.isBlocked()) return;
      service.reset();
      setState(initialState());
    },
    completed() {
      setState({ phase: "completed" });
    },
  };
}
