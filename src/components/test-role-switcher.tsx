import { useEffect, useState } from "react";
import { Button, Select, useNavigate } from "zmp-ui";
import FormError from "@/components/form-error";
import { errorText } from "@/services/acs/messages";
import { switchTestRole, testRoleAvailability, type TestRole, type TestRoleAvailability } from "@/services/test-role";

const LABEL: Record<TestRole, string> = {
  Owner: "Chủ HTX", ZoneManager: "Quản lý vùng", Employee: "Nhân viên", Trader: "Thương lái",
};

/** Chỉ có trong bản dev; backend còn kiểm tra Development, bật công cụ và đúng tài khoản Zalo được cho phép. */
export default function TestRoleSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <Switcher />;
}
function Switcher() {
  const [available, setAvailable] = useState<TestRoleAvailability | null>(null);
  const [role, setRole] = useState<TestRole>("Owner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    void testRoleAvailability().then(value => {
      if (active) { setAvailable(value); setRole(value.currentRole); }
    }).catch(() => { /* Tài khoản khác hoặc server tắt công cụ: không hiện bộ chuyển vai trò. */ });
    return () => { active = false; };
  }, []);
  if (!available) return null;
  const change = async () => {
    if (busy || role === available.currentRole) return;
    setBusy(true); setError("");
    try {
      await switchTestRole(role);
      navigate("/", { replace: true, animate: false });
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  return <section className="card form">
    <h2 className="block__title">Thử vai trò · bản dev</h2>
    <p className="form__hint">Dùng cùng Zalo để lần lượt thử các vai trò. Hồ sơ thật của bạn được giữ nguyên; các hồ sơ thử dùng chung dữ liệu nghiệp vụ trên backend dev.</p>
    <Select label="Vai trò muốn thử" value={role} disabled={busy} onChange={value => setRole(value as TestRole)} closeOnSelect>
      {available.roles.map(value => <Select.Option key={value} value={value} title={LABEL[value]} />)}
    </Select>
    <FormError text={error} />
    <Button fullWidth size="large" disabled={busy || role === available.currentRole} loading={busy} onClick={() => void change()}>Chuyển sang {LABEL[role]}</Button>
    <p className="form__hint">Có thể thử gửi yêu cầu mua theo lồng và Chủ HTX phản hồi. Thu hoạch, cân hàng và QR truy xuất thật còn đang xây dựng.</p>
  </section>;
}
