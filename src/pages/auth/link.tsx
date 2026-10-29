import { useSetAtom } from "jotai";
import { FormEvent, useState } from "react";
import { Button, Header, Icon, Input, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import { linkZaloAccount, requestTraderAccess } from "@/services/acs/link";
import { maskPhone } from "@/services/acs/masking";
import { errorText, FIELD, LINK, MESSAGES } from "@/services/acs/messages";
import { isApiError } from "@/services/api/errors";
import { NotInZalo, openZaloPermissionSetting, PhonePermissionDeclined } from "@/services/zalo";
import { flashMessageAtom } from "@/state/session";

const MAX_NAME = 200;
const MAX_NOTE = 500;

/** Bước của màn: bấm liên kết; số chưa có tài khoản thì gửi yêu cầu; yêu cầu đang chờ hoặc bị từ chối. */
type Step = { kind: "link" } | { kind: "request"; maskedPhone: string } | { kind: "pending"; name: string } | { kind: "rejected"; reason: string | null };

/**
 * "Liên kết tài khoản": cách duy nhất để vào phần quản trị (CLAUDE.md mục 5). Giải thích lý do trước; bấm nút
 * thì Zalo hỏi chia sẻ số điện thoại ngay (đã đồng ý trước đó thì Zalo không hỏi lại), rồi backend khớp số với
 * hồ sơ HTX đã tạo và phát phiên. Số chưa có tài khoản: thương lái nhập tên, gửi yêu cầu và chờ Chủ HTX duyệt.
 * Không có mật khẩu, mã xác minh hay quên mật khẩu.
 */
function LinkAccountPage() {
  const navigate = useNavigate();
  const setFlash = useSetAtom(flashMessageAtom);
  const [step, setStep] = useState<Step>({ kind: "link" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  /** Lỗi chung của cả liên kết lẫn gửi yêu cầu (quyền số điện thoại, ngoài Zalo, đang chờ, bị từ chối). */
  const handle = (err: unknown) => {
    if (err instanceof NotInZalo) setError(LINK.notInZalo);
    else if (err instanceof PhonePermissionDeclined) {
      setError(LINK.declined);
      setDeclined(true);
    } else if (isApiError(err, "ZALO_APPROVAL_PENDING")) setStep({ kind: "pending", name });
    else if (isApiError(err, "ZALO_REQUEST_REJECTED")) setStep({ kind: "rejected", reason: (err.details.reason as string | null) ?? null });
    // Hỗ trợ báo lỗi khi môi trường triển khai chưa có endpoint liên kết Zalo.
    else if (isApiError(err, "HTTP_404")) setError(LINK.notSupported);
    else setError(errorText(err));
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setDeclined(false);
    try {
      await action();
    } catch (err) {
      handle(err);
    } finally {
      setBusy(false);
    }
  };

  const link = () =>
    run(async () => {
      try {
        const notice = await linkZaloAccount();
        setFlash(notice ? { text: notice, type: "warning", duration: 8000 } : { text: LINK.linked, type: "success" });
        navigate("/", { replace: true });
      } catch (err) {
        if (!isApiError(err, "ZALO_PHONE_NOT_FOUND")) throw err;
        setStep({ kind: "request", maskedPhone: String(err.details.maskedPhone ?? maskPhone(String(err.details.phone ?? ""))) });
      }
    });

  const sendRequest = (e: FormEvent) => {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName || displayName.length > MAX_NAME) {
      setError(MESSAGES.MSG01(FIELD.displayName));
      return;
    }
    void run(async () => {
      const sent = await requestTraderAccess({ displayName, note: note.trim() });
      setFlash({ text: LINK.requestSent, type: "success" });
      setStep({ kind: "pending", name: sent.displayName });
    });
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title={step.kind === "request" ? "Gửi yêu cầu cho HTX" : "Liên kết tài khoản"} className="detail-header" />
      <div className="screen__body form">
        {step.kind === "link" && (
          <>
            <div className="empty empty--compact">
              <span className="empty__badge">
                <Icon icon="zi-user-circle" size={32} />
              </span>
              <p className="empty__title">Dùng Zalo để vào OMTS</p>
              <p className="empty__text">{LINK.why}</p>
            </div>
            <FormError text={error} />
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void link()}>
              Liên kết bằng số điện thoại Zalo
            </Button>
          </>
        )}

        {step.kind === "request" && (
          <form className="form" onSubmit={sendRequest} noValidate>
            {step.maskedPhone && <p className="form__intro">{LINK.phoneNotFound(step.maskedPhone)}</p>}
            <p className="form__hint">{LINK.requestIntro}</p>
            <Input label="Họ và tên" size="large" value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME} autoComplete="name" disabled={busy} />
            <Input.TextArea
              label="Lời nhắn cho HTX (không bắt buộc)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_NOTE}
              showCount
              placeholder="Ví dụ: tôi thường mua hàu ở vùng Vân Đồn"
              disabled={busy}
            />
            <FormError text={error} />
            <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
              Gửi yêu cầu
            </Button>
          </form>
        )}

        {step.kind === "pending" && (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon="zi-clock-1" size={32} />
            </span>
            <p className="empty__title">Đang chờ HTX duyệt</p>
            <p className="empty__text">{LINK.pending(step.name)}</p>
          </div>
        )}

        {step.kind === "rejected" && (
          <>
            <div className="empty empty--compact">
              <span className="empty__badge">
                <Icon icon="zi-close-circle" size={32} />
              </span>
              <p className="empty__title">Yêu cầu chưa được duyệt</p>
              <p className="empty__text">{LINK.rejected(step.reason)}</p>
            </div>
            <Button fullWidth size="large" onClick={() => setStep({ kind: "request", maskedPhone: "" })}>
              Gửi lại yêu cầu
            </Button>
          </>
        )}

        {declined && (
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void openZaloPermissionSetting()}>
            Mở cài đặt quyền của Zalo
          </Button>
        )}
        {step.kind === "link" && <p className="form__hint">Liên kết một lần; những lần sau mở app sẽ vào thẳng.</p>}
        <div className="form__links">
          <button type="button" className="link-button" onClick={() => navigate("/", { replace: true })}>
            {step.kind === "link" ? "Để sau, chỉ tra cứu truy xuất" : "Về trang chủ"}
          </button>
        </div>
      </div>
    </Page>
  );
}

export default LinkAccountPage;
