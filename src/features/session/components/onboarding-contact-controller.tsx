import { useState } from "react";
import {
  VerificationScreen,
  type VerificationPendingAction,
  type VerificationScreenProps,
} from "@/features/verification/screens/verification-screen";
import { useVerificationCountdown } from "@/features/verification/hooks/use-verification-countdown";
import type {
  VerificationChallenge,
  VerificationChannel,
} from "@/features/verification/domain/verification-contract";
import { useRequestScope } from "@/shared/hooks/use-request-scope";
import { AppButton } from "@/shared/ui/app-button";
import { MessageBanner } from "@/shared/ui/message-banner";
import type { ResolvedMessage } from "@/shared/messages/message-catalog";
import { SessionFailure, type MobileSession } from "../domain/mobile-session";
import { sessionFeedback } from "../services/session-feedback";
import { useMobileSession } from "../state/mobile-session-provider";
import { SessionPage } from "./session-page";
import { SessionLogoutAction } from "./session-logout-action";

function TimedVerification(props: Omit<VerificationScreenProps, "timing">) {
  const timing = useVerificationCountdown(props.challenge);
  return <VerificationScreen {...props} timing={timing} />;
}

export function OnboardingContactController({
  session,
}: {
  session: MobileSession;
}) {
  const { store } = useMobileSession();
  const scope = useRequestScope(store ?? {});
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(
    null,
  );
  const [choosing, setChoosing] = useState(true);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<ResolvedMessage | null>(null);
  const [pending, setPending] = useState<VerificationPendingAction>(null);

  async function run(
    action: "resend" | "verify",
    channel?: VerificationChannel,
  ) {
    if (!store || scope.isBlocked()) return;
    const request = scope.begin();
    if (!request) return;
    setPending(action);
    setFeedback(null);
    try {
      if (action === "verify" && challenge) {
        await store.verifyCode(challenge.id, code);
      } else if (channel) {
        const next = await store.sendCode(channel);
        if (request.isActive()) {
          setChallenge(next);
          setChoosing(false);
        }
      }
    } catch (error) {
      if (request.isActive()) {
        setFeedback(sessionFeedback(error));
        if (error instanceof SessionFailure && error.challenge)
          setChallenge(error.challenge);
      }
    } finally {
      request.finish();
      if (request.isActive()) {
        setCode("");
        setPending(null);
      }
    }
  }

  if (!choosing && challenge)
    return (
      <>
        <TimedVerification
          challenge={challenge}
          code={code}
          feedback={feedback}
          pendingAction={pending}
          resendAllowed
          onBack={() => {
            if (!scope.isBlocked()) {
              setChoosing(true);
              setCode("");
              setFeedback(null);
            }
          }}
          onChangeCode={(value) => {
            if (!scope.isBlocked()) {
              setCode(value);
              setFeedback(null);
            }
          }}
          onResend={() => void run("resend", challenge.channel)}
          onVerify={() => void run("verify")}
        />
        <SessionLogoutAction docked />
      </>
    );

  return (
    <SessionPage
      title="Xác minh liên hệ"
      description="Chọn một email hoặc số điện thoại đã được Chủ hợp tác xã khai báo. Chỉ cần xác minh một thông tin để tiếp tục."
    >
      {feedback ? (
        <MessageBanner
          message={feedback.message}
          title={feedback.title}
          variant={feedback.severity}
        />
      ) : null}
      {session.contacts.map((contact) => (
        <AppButton
          key={contact.channel}
          label={`${contact.channel === "email" ? "Email" : "Số điện thoại"}: ${contact.maskedRecipient}`}
          disabled={pending !== null}
          loading={pending === "resend"}
          variant="secondary"
          onPress={() => {
            if (challenge?.channel === contact.channel) {
              setChoosing(false);
              setFeedback(null);
            } else void run("resend", contact.channel);
          }}
        />
      ))}
      <SessionLogoutAction />
    </SessionPage>
  );
}
