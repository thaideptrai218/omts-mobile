import { useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { DEMO_ACCOUNTS } from "@/features/auth/data/demoAccounts";
import { loginWithDemoAccount } from "@/features/auth/services/demoLoginService";
import { errorText } from "@/utils/errorText";
import "@/features/auth/components/DemoLogin/DemoLogin.scss";

/**
 * Bản dev trên trình duyệt: chọn một trong năm tài khoản demo để vào, thay cho "Liên kết tài khoản" vốn cần Zalo.
 * Ra ngoài thì vào Tài khoản, bấm Đăng xuất rồi chọn tài khoản khác. Tải lại trang là mất phiên (không có nativeStorage).
 */
export default function DemoLogin() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const login = async (username: string) => {
    if (busy) return;
    setBusy(username);
    setError("");
    try {
      await loginWithDemoAccount(username);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ManagePage title="Đăng nhập tài khoản demo">
      <p className="form__intro">Bản chạy trên trình duyệt không liên kết được Zalo. Chọn người muốn đóng vai để thử luồng đặt hàng đến truy xuất.</p>
      <FormError text={error} />
      <div className="sheet-actions">
        {DEMO_ACCOUNTS.map((account) => (
          <Button key={account.username} fullWidth size="large" variant={account.username === "owner" ? "primary" : "secondary"}
            loading={busy === account.username} disabled={busy !== null} onClick={() => void login(account.username)}>
            {account.role}: {account.name}
          </Button>
        ))}
      </div>
      <ul className="demo-login__hints">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.username}>
            <strong>{account.role}</strong> ({account.username}): {account.hint}
          </li>
        ))}
      </ul>
      <p className="form__hint">Đổi người: vào Tài khoản, bấm Đăng xuất rồi chọn lại. Tải lại trang thì phải chọn lại.</p>
    </ManagePage>
  );
}
