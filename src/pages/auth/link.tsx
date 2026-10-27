import { useSetAtom } from "jotai";
import { useState } from "react";
import { Button, Header, Icon, Modal, Page, useNavigate } from "zmp-ui";

import FormError from "@/components/form-error";
import { linkZaloAccount, loginWithZalo } from "@/services/acs/link";
import { maskPhone } from "@/services/acs/masking";
import { errorText, LINK } from "@/services/acs/messages";
import { isApiError } from "@/services/api/errors";
import { NotInZalo, PhonePermissionDeclined } from "@/services/zalo";
import { flashMessageAtom } from "@/state/session";

/**
 * "Liên kết tài khoản" thay cho màn đăng nhập (ACS-02 theo hướng Zalo, CLAUDE.md mục 5): giải thích lý
 * do trước, rồi mới xin số điện thoại Zalo; backend khớp số với hồ sơ và phát phiên. Số chưa có tài
 * khoản: hỏi rõ rồi mới tạo tài khoản thương lái (ACS-01 theo hướng Zalo). Sau khi có phiên,
 * `SessionGuard` tự đưa vào cổng đổi mật khẩu tạm nếu tài khoản cần.
 */
function LinkAccountPage() {
  const navigate = useNavigate();
  const setFlash = useSetAtom(flashMessageAtom);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState<string | null>(null);

  const finish = (notice: string | null, created: boolean, gated: boolean) => {
    // Khi còn cổng (mật khẩu tạm) thì màn cổng tự giải thích, không chồng thêm thông báo.
    if (notice) setFlash({ text: notice, type: "warning", duration: 8000 });
    else if (!gated) setFlash({ text: created ? LINK.created : LINK.linked, type: "success" });
    navigate("/", { replace: true });
  };

  /** Zalo này đã liên kết từ trước (ví dụ sau khi đăng xuất): vào lại ngay, không hỏi số điện thoại. */
  const tryLogin = async () => {
    try {
      const tokens = await loginWithZalo();
      finish(null, false, tokens.mustChangePassword || tokens.phoneVerificationRequired);
      return true;
    } catch (err) {
      if (isApiError(err, "ZALO_NOT_LINKED")) return false;
      throw err;
    }
  };

  const link = async (createTrader = false) => {
    setBusy(true);
    setError("");
    setNotFound(null);
    try {
      if (!createTrader && (await tryLogin())) return;
      const outcome = await linkZaloAccount({ createTrader });
      finish(outcome.notice, outcome.created, outcome.tokens.mustChangePassword || outcome.tokens.phoneVerificationRequired);
    } catch (err) {
      if (err instanceof NotInZalo) setError(LINK.notInZalo);
      else if (err instanceof PhonePermissionDeclined) setError(LINK.declined);
      else if (isApiError(err, "ZALO_PHONE_NOT_FOUND")) setNotFound(String(err.details.maskedPhone ?? maskPhone(String(err.details.phone ?? ""))));
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
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void link(false)}>
          Liên kết bằng số điện thoại Zalo
        </Button>
        <p className="form__hint">
          Liên kết một lần; những lần sau mở app sẽ vào thẳng. Mật khẩu chỉ cần khi dùng bản web; nếu quên, dùng mục bên dưới.
        </p>
        <div className="form__links">
          <button type="button" className="link-button" onClick={() => navigate("/recover")}>
            Quên mật khẩu bản web
          </button>
          <button type="button" className="link-button" onClick={() => navigate("/", { replace: true })}>
            Để sau, chỉ tra cứu truy xuất
          </button>
        </div>
      </div>

      <Modal
        visible={notFound !== null}
        title="Chưa có tài khoản"
        description={notFound !== null ? LINK.phoneNotFound(notFound) : ""}
        onClose={() => setNotFound(null)}
        verticalActions
        actions={[
          { text: "Tạo tài khoản thương lái", highLight: true, onClick: () => void link(true) },
          { text: "Tôi là nhân viên HTX, để sau", close: true },
        ]}
      />
    </Page>
  );
}

export default LinkAccountPage;
