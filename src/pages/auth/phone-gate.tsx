import { useAtomValue, useSetAtom } from "jotai";
import { FormEvent, useEffect, useState } from "react";
import { Button, Header, Input, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import { useLogout } from "@/hooks/use-logout";
import { maskPhone } from "@/services/acs/masking";
import { errorText, FIELD, MESSAGES } from "@/services/acs/messages";
import { confirmPhoneVerification, getProfile, startPhoneVerification } from "@/services/acs/profile";
import type { ProfileView } from "@/services/acs/types";
import { normalizePhone } from "@/services/acs/validation";
import { resendCode } from "@/services/acs/verification";
import { flashMessageAtom, sessionAtom } from "@/state/session";
import { pendingVerificationAtom } from "@/state/verification";

/**
 * Cổng số điện thoại sau đăng nhập (ACS-02, MSG67): thương lái nhập số; nhân viên xác nhận số Chủ HTX
 * đã nhập (che bớt) hoặc nhập số khác. Chặn toàn bộ app cho tới khi xác minh xong; chỉ còn Đăng xuất.
 */
function PhoneGatePage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const setPending = useSetAtom(pendingVerificationAtom);
  const setFlash = useSetAtom(flashMessageAtom);
  const { logout, busy: loggingOut } = useLogout();
  const isTrader = session?.subjectType === "Trader";
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [useOther, setUseOther] = useState(isTrader);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Nhân viên: lấy số Chủ HTX đã nhập để xác nhận. Thương lái không có số sẵn.
  useEffect(() => {
    if (isTrader) return;
    getProfile()
      .then((p) => {
        setProfile(p);
        if (!p.phoneNumber) setUseOther(true);
      })
      .catch((err) => setError(errorText(err)));
  }, [isTrader]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const entered = useOther ? normalizePhone(phone) : null;
    if (useOther && !entered) {
      setError(MESSAGES.MSG01(FIELD.phone));
      return;
    }
    const number = entered ?? profile?.phoneNumber ?? "";
    setBusy(true);
    setError("");
    try {
      const started = await startPhoneVerification(entered);
      setPending({
        purpose: "VerifyPhone",
        channel: "Sms",
        maskedTarget: maskPhone(number) || started.maskedTarget,
        verificationId: started.verificationId,
        sentAt: Date.now(),
        sendsLeft: started.sendsLeft,
        resend: () => resendCode(started.verificationId, true),
        onVerified: async (token, go) => {
          const confirmed = await confirmPhoneVerification(token);
          if (confirmed.oldDocumentsHidden) setFlash({ text: confirmed.notice ?? MESSAGES.MSG57, type: "warning", duration: 8000 });
          go("/", { replace: true });
        },
      });
      navigate("/verify");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const masked = maskPhone(profile?.phoneNumber);

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Xác minh số điện thoại" className="detail-header" showBackIcon={false} />
      <form className="screen__body form" onSubmit={submit} noValidate>
        <p className="form-note form-note--warning">{MESSAGES.MSG67}</p>

        {!isTrader && profile?.phoneNumber && (
          <div className="segmented" role="radiogroup" aria-label="Số điện thoại">
            <button type="button" role="radio" aria-checked={!useOther} className={`segmented__item${!useOther ? " is-active" : ""}`} onClick={() => setUseOther(false)}>
              Dùng số {masked}
            </button>
            <button type="button" role="radio" aria-checked={useOther} className={`segmented__item${useOther ? " is-active" : ""}`} onClick={() => setUseOther(true)}>
              Nhập số khác
            </button>
          </div>
        )}

        {useOther ? (
          <Input
            label="Số điện thoại nhận mã SMS"
            size="large"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0912345678"
            disabled={busy}
          />
        ) : (
          <p className="form__intro">
            Mã SMS sẽ được gửi đến số <strong className="nowrap">{masked}</strong> mà Chủ HTX đã nhập cho bạn.
          </p>
        )}

        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy || (!useOther && !profile)}>
          Gửi mã xác minh
        </Button>
        <Button fullWidth size="large" variant="tertiary" loading={loggingOut} disabled={loggingOut} onClick={() => void logout()}>
          Đăng xuất
        </Button>
      </form>
    </Page>
  );
}

export default PhoneGatePage;
