import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Button, Header, Page, useNavigate } from "zmp-ui";

import CodeInput, { CODE_LENGTH } from "@/components/code-input";
import FormError from "@/components/form-error";
import { useRemainingSeconds } from "@/hooks/use-countdown";
import { CODE_VALIDITY_NOTE, errorText, MESSAGES } from "@/services/acs/messages";
import { verifyCode } from "@/services/acs/verification";
import { pendingVerificationAtom, type VerificationPurpose } from "@/state/verification";

const RESEND_INTERVAL_MS = 60_000;

const TITLES: Record<VerificationPurpose, string> = {
  Registration: "Xác minh để đăng ký",
  AccountRecovery: "Xác minh để khôi phục",
  VerifyPhone: "Xác minh số điện thoại",
  VerifyEmail: "Xác minh email",
  ChangePhone: "Xác minh số điện thoại mới",
  ChangeEmail: "Xác minh email mới",
  ChangePassword: "Xác minh để đổi mật khẩu",
};

/**
 * ACS-06 màn xác minh dùng chung: đọc yêu cầu đang chờ từ `pendingVerificationAtom`, nhận mã 6 số,
 * gửi lại sau 60 giây (tối đa 3 lần gửi) và gọi bước kế tiếp của luồng khi mã đúng. Đếm ngược tính
 * theo mốc thời gian tuyệt đối nên vẫn đúng khi Mini App vào nền.
 */
function VerifyPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useAtom(pendingVerificationAtom);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const finishedRef = useRef(false);

  const sentAt = pending?.sentAt ?? 0;
  const resendWait = useRemainingSeconds(sentAt + RESEND_INTERVAL_MS);

  // Mở thẳng /verify mà không có yêu cầu nào (hoặc đã đăng xuất) thì không có gì để làm.
  useEffect(() => {
    if (!pending && !finishedRef.current) navigate("/link", { replace: true, animate: false });
  }, [pending, navigate]);

  if (!pending) return null;

  const needsAuth = pending.purpose !== "Registration" && pending.purpose !== "AccountRecovery";

  const verify = async (value = code) => {
    if (busy) return;
    if (!/^\d{6}$/.test(value)) {
      setError(MESSAGES.MSG01("Verification code"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const issued = await verifyCode(pending.verificationId, value, needsAuth);
      finishedRef.current = true;
      await pending.onVerified(issued.verificationToken, navigate);
      setPending(null);
    } catch (err) {
      finishedRef.current = false;
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resending || resendWait > 0) return;
    setResending(true);
    setError("");
    try {
      const started = await pending.resend();
      setPending({ ...pending, verificationId: started.verificationId, sentAt: Date.now(), sendsLeft: started.sendsLeft });
      setCode("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title={TITLES[pending.purpose]} className="detail-header" />
      <div className="screen__body form">
        <p className="form__intro">
          Mã xác minh gồm {CODE_LENGTH} số đã được gửi đến <strong className="nowrap">{pending.maskedTarget}</strong>.
        </p>
        {pending.notice && <p className="form-note">{pending.notice}</p>}

        <CodeInput value={code} onChange={setCode} disabled={busy} onComplete={(value) => void verify(value)} />
        <p className="form__hint">{CODE_VALIDITY_NOTE}</p>
        <FormError text={error} />

        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void verify()}>
          Xác nhận
        </Button>
        {pending.sendsLeft > 0 && (
          <Button fullWidth size="large" variant="secondary" loading={resending} disabled={resending || resendWait > 0} onClick={() => void resend()}>
            {resendWait > 0 ? `Gửi lại mã sau ${resendWait} giây` : `Gửi lại mã (còn ${pending.sendsLeft} lần)`}
          </Button>
        )}
        <div className="form__links">
          {pending.changeMethodTo && (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setPending(null);
                finishedRef.current = true;
                navigate(pending.changeMethodTo!, { replace: true });
              }}
            >
              Đổi cách nhận mã
            </button>
          )}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              finishedRef.current = true;
              setPending(null);
              navigate(-1);
            }}
          >
            Quay lại
          </button>
        </div>
      </div>

    </Page>
  );
}

export default VerifyPage;
