import { useAtom, useSetAtom } from "jotai";
import { FormEvent, useEffect, useState } from "react";
import { Button, Header, Icon, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import PasswordField from "@/components/password-field";
import { useLogout } from "@/hooks/use-logout";
import { errorText, FIELD, MESSAGES, NO_VERIFIED_EMAIL_NOTE } from "@/services/acs/messages";
import { changePassword, sendPasswordCode } from "@/services/acs/password";
import { getProfile } from "@/services/acs/profile";
import { isValidPassword } from "@/services/acs/validation";
import { resendCode } from "@/services/acs/verification";
import { isApiError } from "@/services/api/errors";
import { flashMessageAtom } from "@/state/session";
import { passwordCodeTokenAtom, pendingVerificationAtom } from "@/state/verification";

type Props = {
  /** Sau mật khẩu tạm: chặn toàn bộ app, không có Hủy, chỉ có Đăng xuất. */
  forced?: boolean;
};

/**
 * ACS-04 đổi mật khẩu. Chứng minh bằng mật khẩu hiện tại, hoặc bằng mã gửi về email đã xác minh
 * (màn xác minh dùng chung trả token qua `passwordCodeTokenAtom`). Chế độ bắt buộc dùng cho cổng
 * mật khẩu tạm; khi đó không đọc được hồ sơ nên nút gửi mã luôn hiện và server trả lời email có hợp lệ không.
 */
function ChangePasswordPage({ forced = false }: Props) {
  const navigate = useNavigate();
  const [codeToken, setCodeToken] = useAtom(passwordCodeTokenAtom);
  const setPending = useSetAtom(pendingVerificationAtom);
  const setFlash = useSetAtom(flashMessageAtom);
  const { logout, busy: loggingOut } = useLogout();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const selfPath = forced ? "/gate/password" : "/account/password";

  useEffect(() => {
    if (forced) return;
    getProfile()
      .then((p) => setEmailVerified(p.emailVerified))
      .catch(() => setEmailVerified(null));
  }, [forced]);

  useEffect(() => () => setCodeToken(null), [setCodeToken]);

  const sendCode = async () => {
    setSending(true);
    setError("");
    try {
      const started = await sendPasswordCode();
      setPending({
        purpose: "ChangePassword",
        channel: "Email",
        maskedTarget: started.maskedTarget,
        verificationId: started.verificationId,
        sentAt: Date.now(),
        sendsLeft: started.sendsLeft,
        resend: () => resendCode(started.verificationId, true),
        onVerified: async (token, go) => {
          setCodeToken(token);
          go(selfPath, { replace: true });
        },
      });
      navigate("/verify");
    } catch (err) {
      if (isApiError(err, "NO_VERIFIED_EMAIL")) setEmailNote(NO_VERIFIED_EMAIL_NOTE);
      else setError(errorText(err));
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!codeToken && !currentPassword) {
      setError(MESSAGES.MSG01(FIELD.currentPassword));
      return;
    }
    if (!isValidPassword(password) || password !== confirm) {
      setError(MESSAGES.MSG01(FIELD.password));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await changePassword(codeToken ? { verificationToken: codeToken } : { currentPassword }, password);
      setCodeToken(null);
      setFlash({ text: result.message || MESSAGES.MSG18, type: "success" });
      navigate(forced ? "/" : "/account", { replace: true });
    } catch (err) {
      if (isApiError(err, "MSG16")) setCodeToken(null);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const showEmailOption = forced || emailVerified !== false;

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Đổi mật khẩu" className="detail-header" showBackIcon={!forced} />
      <form className="screen__body form" onSubmit={submit} noValidate>
        {forced && <p className="form-note form-note--warning">Bạn đang dùng mật khẩu tạm. Hãy đặt mật khẩu mới để tiếp tục dùng OMTS.</p>}

        {codeToken ? (
          <p className="form-note form-note--success">
            <Icon icon="zi-check-circle-solid" /> Đã xác minh bằng mã gửi về email. Nhập mật khẩu mới bên dưới.
          </p>
        ) : (
          <>
            <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} disabled={busy} />
            {showEmailOption && (
              <button type="button" className="link-button link-button--inline" disabled={sending} onClick={() => void sendCode()}>
                {sending ? "Đang gửi mã…" : "Không nhớ mật khẩu? Gửi mã đến email của tôi"}
              </button>
            )}
            {(emailNote || emailVerified === false) && <p className="form-note">{NO_VERIFIED_EMAIL_NOTE}</p>}
          </>
        )}

        <PasswordField label="Mật khẩu mới" value={password} onChange={setPassword} isNew disabled={busy} />
        <PasswordField label="Nhập lại mật khẩu mới" value={confirm} onChange={setConfirm} autoComplete="new-password" disabled={busy} />
        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
          Lưu mật khẩu
        </Button>
        {forced ? (
          <Button fullWidth size="large" variant="tertiary" loading={loggingOut} disabled={loggingOut} onClick={() => void logout()}>
            Đăng xuất
          </Button>
        ) : (
          <Button fullWidth size="large" variant="tertiary" disabled={busy} onClick={() => navigate(-1)}>
            Hủy
          </Button>
        )}
      </form>
    </Page>
  );
}

export default ChangePasswordPage;
