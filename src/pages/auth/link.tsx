import { useSetAtom } from "jotai";
import { useState } from "react";
import { Button, Header, Icon, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import { linkZaloAccount } from "@/services/acs/link";
import { maskPhone } from "@/services/acs/masking";
import { errorText, LINK } from "@/services/acs/messages";
import { isApiError } from "@/services/api/errors";
import { NotInZalo, openZaloPermissionSetting, PhonePermissionDeclined } from "@/services/zalo";
import { flashMessageAtom } from "@/state/session";

/**
 * "Liên kết tài khoản": cách duy nhất để vào phần quản trị (CLAUDE.md mục 5). Giải thích lý do trước; bấm nút
 * thì Zalo hỏi chia sẻ số điện thoại ngay (đã đồng ý trước đó thì Zalo không hỏi lại), rồi backend khớp số với
 * hồ sơ HTX đã tạo và phát phiên. Zalo đã liên kết sẵn thì backend cũng chỉ phát phiên. Không có mật khẩu, mã
 * xác minh, quên mật khẩu hay tự tạo tài khoản: số chưa có trong OMTS thì người dùng nhờ HTX nhập số.
 */
function LinkAccountPage() {
  const navigate = useNavigate();
  const setFlash = useSetAtom(flashMessageAtom);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);

  const finish = (notice: string | null) => {
    setFlash(notice ? { text: notice, type: "warning", duration: 8000 } : { text: LINK.linked, type: "success" });
    navigate("/", { replace: true });
  };

  const link = async () => {
    setBusy(true);
    setError("");
    setDeclined(false);
    try {
      finish(await linkZaloAccount());
    } catch (err) {
      if (err instanceof NotInZalo) setError(LINK.notInZalo);
      else if (err instanceof PhonePermissionDeclined) {
        setError(LINK.declined);
        setDeclined(true);
      } else if (isApiError(err, "ZALO_PHONE_NOT_FOUND")) {
        setError(LINK.phoneNotFound(String(err.details.maskedPhone ?? maskPhone(String(err.details.phone ?? "")))));
      }
      // Backend chưa có api/auth/zalo/* (docs/zalo-account-linking.md): server trả 404 không kèm mã.
      else if (isApiError(err, "HTTP_404")) setError(LINK.notSupported);
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Liên kết tài khoản" className="detail-header" />
      <div className="screen__body form">
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
        {declined && (
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void openZaloPermissionSetting()}>
            Mở cài đặt quyền của Zalo
          </Button>
        )}
        <p className="form__hint">Liên kết một lần; những lần sau mở app sẽ vào thẳng.</p>
        <div className="form__links">
          <button type="button" className="link-button" onClick={() => navigate("/", { replace: true })}>
            Để sau, chỉ tra cứu truy xuất
          </button>
        </div>
      </div>
    </Page>
  );
}

export default LinkAccountPage;
