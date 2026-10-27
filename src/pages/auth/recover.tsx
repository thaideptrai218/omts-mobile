import { useAtom, useSetAtom } from "jotai";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, Header, Input, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import PasswordField from "@/components/password-field";
import { maskContact } from "@/services/acs/masking";
import { errorText, FIELD, MESSAGES, RECOVERY_STAFF_NOTE } from "@/services/acs/messages";
import { resetPassword, startRecovery } from "@/services/acs/recovery";
import type { VerificationStarted } from "@/services/acs/types";
import { identifierChannel, isValidPassword, normalizeContact } from "@/services/acs/validation";
import { isApiError } from "@/services/api/errors";
import { flashMessageAtom } from "@/state/session";
import { pendingVerificationAtom, recoveryTokenAtom } from "@/state/verification";

/** Số lần gửi tối đa cho một định danh (giống ACS-06: 3 lần, kể cả lần đầu). */
const MAX_SENDS = 3;

/**
 * ACS-03 bước 1: nhập email hoặc số điện thoại đã xác minh. Server luôn trả MSG15 dù có tài khoản hay
 * không, nên app không kiểm tra gì ngoài ô trống. Khôi phục không có API gửi lại: "Gửi lại mã" trên
 * màn xác minh gọi lại bước này với cùng định danh.
 */
function RecoverPage() {
  const navigate = useNavigate();
  const setPending = useSetAtom(pendingVerificationAtom);
  const setRecoveryToken = useSetAtom(recoveryTokenAtom);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError(MESSAGES.MSG01("Email or phone number"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const channel = identifierChannel(value) ?? "Email";
      const target = normalizeContact(channel, value) ?? value;
      const masked = maskContact(channel, target);
      let sends = 1;
      const send = async (): Promise<VerificationStarted> => {
        const started = await startRecovery(value);
        sends += 1;
        return { verificationId: started.requestId, maskedTarget: masked, expiresAt: "", sendsLeft: Math.max(0, MAX_SENDS - sends), nextResendAt: "" };
      };
      const started = await startRecovery(value);
      setRecoveryToken(null);
      setPending({
        purpose: "AccountRecovery",
        channel,
        maskedTarget: masked,
        verificationId: started.requestId,
        sentAt: Date.now(),
        sendsLeft: MAX_SENDS - sends,
        notice: started.message,
        resend: send,
        changeMethodTo: "/recover",
        onVerified: async (token, go) => {
          setRecoveryToken(token);
          go("/recover/reset", { replace: true });
        },
      });
      navigate("/verify");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Quên mật khẩu" className="detail-header" />
      <form className="screen__body form" onSubmit={submit} noValidate>
        <p className="form__intro">Nhập email hoặc số điện thoại đã xác minh của tài khoản. Mã xác minh sẽ được gửi tới đó.</p>
        <Input
          label="Email hoặc số điện thoại đã xác minh"
          size="large"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoCapitalize="none"
          autoComplete="username"
          disabled={busy}
        />
        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
          Gửi mã
        </Button>
        <p className="form-note">{RECOVERY_STAFF_NOTE}</p>
        <div className="form__links">
          <button type="button" className="link-button" onClick={() => navigate("/link", { replace: true })}>
            Quay lại liên kết tài khoản
          </button>
        </div>
      </form>
    </Page>
  );
}

/** ACS-03 bước 2: đặt mật khẩu mới bằng token của bước xác minh; xong thì về màn liên kết tài khoản. */
export function RecoverResetPage() {
  const navigate = useNavigate();
  const [token, setToken] = useAtom(recoveryTokenAtom);
  const setFlash = useSetAtom(flashMessageAtom);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [tokenDead, setTokenDead] = useState(false);
  const [busy, setBusy] = useState(false);
  // Trang đang rời đi (đã xong hoặc hủy): AnimationRoutes còn giữ trang trong lúc chuyển cảnh, không điều hướng nữa.
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!token && !leavingRef.current) navigate("/recover", { replace: true, animate: false });
  }, [token, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!isValidPassword(password) || password !== confirm) {
      setError(MESSAGES.MSG01(FIELD.password));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await resetPassword(token, password);
      leavingRef.current = true;
      setToken(null);
      setFlash({ text: result.message || MESSAGES.MSG18, type: "success" });
      navigate("/link", { replace: true });
    } catch (err) {
      // Mật khẩu không hợp lệ (MSG01): giữ nguyên trạng thái đã xác minh để nhập lại.
      if (isApiError(err, "MSG16")) setTokenDead(true);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Đặt mật khẩu mới" className="detail-header" showBackIcon={false} />
      <form className="screen__body form" onSubmit={submit} noValidate>
        <p className="form__intro">Đã xác minh. Nhập mật khẩu mới cho tài khoản của bạn.</p>
        <PasswordField label="Mật khẩu mới" value={password} onChange={setPassword} isNew disabled={busy || tokenDead} />
        <PasswordField label="Nhập lại mật khẩu mới" value={confirm} onChange={setConfirm} autoComplete="new-password" disabled={busy || tokenDead} />
        <FormError text={error} />
        {tokenDead ? (
          <Button fullWidth size="large" onClick={() => navigate("/recover", { replace: true })}>
            Gửi mã mới
          </Button>
        ) : (
          <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
            Đặt lại mật khẩu
          </Button>
        )}
        <div className="form__links">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              leavingRef.current = true;
              setToken(null);
              navigate("/link", { replace: true });
            }}
          >
            Hủy
          </button>
        </div>
      </form>
    </Page>
  );
}

export default RecoverPage;
