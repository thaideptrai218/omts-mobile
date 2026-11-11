import type { DevRole, TestRole, TestRoleAvailability } from "@/features/development/models/TestRole";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, Select, useNavigate } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { errorText } from "@/utils/errorText";
import { roleKeyFor } from "@/utils/featureAccess";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { returnToLinkedAccount, switchTestRole, switchToDemoAccountant, testRoleAvailability } from "@/features/development/services/testRoleService";

const LABEL: Record<DevRole, string> = {
  Owner: "Chủ HTX", ZoneManager: "Quản lý vùng", Employee: "Nhân viên", Accountant: "Kế toán", Trader: "Thương lái",
};

/** Chỉ có trong bản dev; backend còn kiểm tra Development, bật công cụ và đúng tài khoản Zalo được cho phép. */
export default function TestRoleSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <Switcher />;
}

function Switcher() {
  const permissions = useAtomValue(permissionsAtom);
  const isDemoAccountant = !!permissions && roleKeyFor(permissions) === "accountant";
  const [available, setAvailable] = useState<TestRoleAvailability | null>(null);
  const [role, setRole] = useState<DevRole>("Owner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoAccountant) return;
    let active = true;
    void testRoleAvailability().then(value => {
      if (active) { setAvailable(value); setRole(value.currentRole); }
    }).catch(() => { /* Tài khoản khác hoặc server tắt công cụ: không hiện bộ chuyển vai trò. */ });
    return () => { active = false; };
  }, [isDemoAccountant]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try {
      await action();
      navigate("/", { replace: true, animate: false });
    } catch (e) {
      setError(e instanceof Error && !("status" in e) ? e.message : errorText(e));
    } finally { setBusy(false); }
  };

  if (isDemoAccountant) {
    return <section className="card form">
      <h2 className="block__title">Thử vai trò · bản dev</h2>
      <p className="form__hint">Đang dùng tài khoản Kế toán của dữ liệu demo.</p>
      <FormError text={error} />
      <Button fullWidth size="large" disabled={busy} loading={busy} onClick={() => void run(returnToLinkedAccount)}>Trở về tài khoản của tôi</Button>
    </section>;
  }

  if (!available) return null;
  const roles: DevRole[] = [...available.roles, "Accountant"];
  const change = () => {
    if (busy || role === available.currentRole) return;
    void run(() => (role === "Accountant" ? switchToDemoAccountant() : switchTestRole(role as TestRole)));
  };

  return <section className="card form">
    <h2 className="block__title">Thử vai trò · bản dev</h2>
    <p className="form__hint">Một tài khoản Zalo thử được nhiều vai trò. Đang là: {LABEL[available.currentRole]}.</p>
    <Select label="Vai trò muốn thử" value={role} disabled={busy} onChange={value => setRole(value as DevRole)} closeOnSelect>
      {roles.map(value => <Select.Option key={value} value={value} title={LABEL[value]} />)}
    </Select>
    <FormError text={error} />
    <Button fullWidth size="large" disabled={busy || role === available.currentRole} loading={busy} onClick={change}>Chuyển sang {LABEL[role]}</Button>
    <p className="form__hint">Hồ sơ thật của bạn được giữ nguyên. Các màn ghi "dữ liệu mẫu" chưa nối máy chủ.</p>
  </section>;
}
