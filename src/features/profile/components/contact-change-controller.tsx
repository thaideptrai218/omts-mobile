import type { VerificationChannel } from "@/features/verification/domain/verification-contract";
import { useVerificationCountdown } from "@/features/verification/hooks/use-verification-countdown";
import {
  VerificationScreen,
  type VerificationScreenProps,
} from "@/features/verification/screens/verification-screen";
import { ContentState } from "@/shared/ui/content-state";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { useContactChangeController } from "../hooks/use-contact-change-controller";
import { ContactChangeScreen } from "../screens/contact-change-screen";
import type { ContactChangeService } from "../services/contact-change-service";
import type { ProfileSnapshot } from "../services/profile-service";

function TimedVerification(props: Omit<VerificationScreenProps, "timing">) {
  const timing = useVerificationCountdown(props.challenge);
  return <VerificationScreen {...props} timing={timing} />;
}
export function ContactChangeController(props: {
  channel: VerificationChannel;
  initialProfile: ProfileSnapshot;
  service: ContactChangeService;
  onClose: () => void;
  onSaved: (profile: ProfileSnapshot) => void;
  onSessionExpired: () => void;
}) {
  const flow = useContactChangeController(props);
  if (flow.expired)
    return (
      <ScreenContainer>
        <ContentState
          title="Phiên đăng nhập đã hết hạn"
          description="Vui lòng đăng nhập lại để tiếp tục."
          variant="error"
        />
      </ScreenContainer>
    );
  if (flow.phase.kind === "verification")
    return (
      <TimedVerification
        challenge={flow.phase.challenge}
        code={flow.code}
        feedback={
          flow.feedback ??
          (props.channel === "email"
            ? resolveKnownMessage("MSG62", {
                maskedEmail: flow.phase.challenge.maskedRecipient,
              })
            : null)
        }
        description="Nhập mã gồm 6 chữ số để lưu thông tin liên hệ mới. Liên hệ hiện tại chưa thay đổi."
        recipientLabel="Liên hệ mới cần xác minh"
        backLabel="Nhập lại liên hệ mới"
        onBack={flow.restart}
        onChangeCode={flow.changeCode}
        onResend={() => void flow.run("resend")}
        onVerify={() => void flow.run("verify")}
        resendAllowed={flow.phase.challenge.attemptsRemaining > 0}
        pendingAction={
          flow.pending === "verify" || flow.pending === "resend"
            ? flow.pending
            : null
        }
      />
    );
  const contact =
    props.channel === "email"
      ? flow.profile.account.email
      : flow.profile.account.phone;
  if (flow.phase.kind === "completed")
    return (
      <ScreenContainer>
        <ContentState
          title="Đã cập nhật liên hệ"
          description={`${contact.value ?? "Thông tin liên hệ"} đã được xác minh và lưu vào hồ sơ.`}
          actionLabel="Về hồ sơ"
          onAction={props.onClose}
        />
      </ScreenContainer>
    );
  return (
    <ContactChangeScreen
      channel={props.channel}
      currentContact={contact.value}
      identifier={flow.identifier}
      fieldError={flow.fieldError}
      feedback={flow.feedback}
      conflict={flow.conflict}
      pending={flow.pending !== null}
      onChange={flow.changeIdentifier}
      onStart={() => void flow.run("start")}
      onReload={() => void flow.run("reload")}
      onClose={props.onClose}
    />
  );
}
