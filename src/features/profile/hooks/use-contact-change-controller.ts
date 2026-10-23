import { useEffect, useEffectEvent, useState } from "react";
import { SessionFailure } from "@/features/session/domain/mobile-session";
import type {
  VerificationChannel,
  VerificationChallenge,
} from "@/features/verification/domain/verification-contract";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import {
  resolveKnownMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";
import type { ContactChangeService } from "../services/contact-change-service";
import type { ProfileSnapshot } from "../services/profile-service";

type Action = "start" | "verify" | "resend" | "reload";
type Phase =
  | { kind: "form" }
  | { kind: "verification"; challenge: VerificationChallenge }
  | { kind: "completed" };
export function useContactChangeController({
  service,
  channel,
  initialProfile,
  onSaved,
  onSessionExpired,
}: {
  service: ContactChangeService;
  channel: VerificationChannel;
  initialProfile: ProfileSnapshot;
  onSaved: (profile: ProfileSnapshot) => void;
  onSessionExpired: () => void;
}) {
  const scope = useRequestScope(service);
  const [profile, setProfile] = useState(initialProfile);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [conflict, setConflict] = useState(false);
  const [expired, setExpired] = useState(false);
  const notifySaved = useEffectEvent(onSaved);
  const notifyExpired = useEffectEvent(onSessionExpired);
  useEffect(() => {
    service.activate();
    return () => service.dispose();
  }, [service]);
  useEffect(() => {
    if (phase.kind === "completed") notifySaved(profile);
  }, [phase, profile]);
  useEffect(() => {
    if (expired) notifyExpired();
  }, [expired]);
  const label = channel === "email" ? "Email" : "Số điện thoại";
  function showConflict() {
    setConflict(true);
    setPhase({ kind: "form" });
    setFeedback(resolveKnownMessage("MSG06", {}));
  }
  async function run(action: Action) {
    if (scope.isBlocked() || expired || phase.kind === "completed") return;
    if (action === "start" && (phase.kind !== "form" || conflict)) return;
    if (
      (action === "verify" || action === "resend") &&
      phase.kind !== "verification"
    )
      return;
    if (action === "reload" && !conflict) return;
    if (action === "start" && !identifier.trim()) {
      setFieldError(`Vui lòng nhập ${label.toLocaleLowerCase("vi-VN")} mới.`);
      return;
    }
    const request = scope.begin();
    if (!request) return;
    setPending(action);
    setFeedback(null);
    setFieldError(undefined);
    setCode("");
    try {
      if (action === "reload") {
        const fresh = await service.load();
        if (!request.isActive()) return;
        service.reset();
        setProfile(fresh);
        setIdentifier("");
        setConflict(false);
        setPhase({ kind: "form" });
      } else if (action === "start") {
        const result = await service.start({
          channel,
          identifier: identifier.trim(),
          expectedRevision: profile.revision,
        });
        if (!request.isActive()) return;
        if (result.status === "started")
          setPhase({ kind: "verification", challenge: result.challenge });
        else if (result.status === "conflict") showConflict();
        else setFeedback(resolveKnownMessage("MSG01", { fieldName: label }));
      } else if (action === "resend") {
        const challenge = await service.resend();
        if (request.isActive()) setPhase({ kind: "verification", challenge });
      } else {
        const result = await service.verify(code);
        if (!request.isActive()) return;
        if (result.status === "saved") {
          setProfile(result.profile);
          setIdentifier("");
          setPhase({ kind: "completed" });
        } else if (result.status === "conflict") showConflict();
        else if (result.status === "contact-invalid") {
          setPhase({ kind: "form" });
          setFeedback(resolveKnownMessage("MSG01", { fieldName: label }));
        } else {
          if (result.challenge)
            setPhase({ kind: "verification", challenge: result.challenge });
          setFeedback(resolveKnownMessage("MSG16"));
        }
      }
    } catch (error) {
      if (!request.isActive()) return;
      if (error instanceof SessionFailure && error.code === "expired")
        setExpired(true);
      else if (error instanceof SessionFailure && error.code === "offline")
        setFeedback(resolveKnownMessage("MSG07"));
      else if (error instanceof SessionFailure && error.code === "verification")
        setFeedback(
          action === "start"
            ? {
                ...resolveKnownMessage("MSG16"),
                title: "Chưa thể gửi mã",
                message: "Vui lòng chờ rồi thử gửi mã xác minh lại.",
              }
            : resolveKnownMessage("MSG16"),
        );
      else
        setFeedback(
          resolveKnownMessage("MSG04", {
            serviceName: "Dịch vụ xác minh liên hệ",
          }),
        );
    } finally {
      request.finish();
      if (request.isActive()) setPending(null);
    }
  }
  return {
    phase,
    profile,
    identifier,
    code,
    fieldError,
    feedback,
    pending,
    conflict,
    expired,
    run,
    changeIdentifier(value: string) {
      if (!scope.isBlocked()) {
        setIdentifier(value);
        setFieldError(undefined);
        setFeedback(null);
      }
    },
    changeCode(value: string) {
      if (!scope.isBlocked()) {
        setCode(value);
        setFeedback(null);
      }
    },
    restart() {
      if (!scope.isBlocked()) {
        service.reset();
        setCode("");
        setIdentifier("");
        setFeedback(null);
        setPhase({ kind: "form" });
      }
    },
  };
}
