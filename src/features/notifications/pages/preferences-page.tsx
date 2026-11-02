import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Header, Page, Switch } from "zmp-ui";
import FormError from "@/shared/ui/form-error";
import { errorText } from "@/shared/lib/messages";
import { getNotificationPreferences, saveNotificationPreferences } from "../api/notifications";
import { openPushSettings, pushAvailable, requestPushPermission } from "../api/push";
import { pushChanges, type PushCatalog } from "../model/push-contract";
const labels: Record<string, string> = { WATER_ALERT: "Cảnh báo nước", WATER_ALERT_WITHDRAWN: "Thu hồi cảnh báo nước", WATER_MEASUREMENT_OVERDUE: "Nhắc đo nước", ZONE_LICENSE_EXPIRY: "Nhắc hạn giấy phép vùng", WORK_ASSIGNMENT: "Phân công công việc", NEW_ORDER: "Yêu cầu mua mới", TRADER_ACCESS_REQUESTED: "Yêu cầu tài khoản thương lái", TRADER_ACCESS_APPROVED: "Duyệt tài khoản thương lái", PURCHASE_REQUEST_RESPONDED: "Phản hồi yêu cầu mua", PURCHASE_REQUEST_CANCELLED: "Hủy yêu cầu mua", EMPLOYEE_LEAVE_REQUESTED: "Yêu cầu nghỉ phép", EMPLOYEE_LEAVE_REVIEWED: "Kết quả nghỉ phép" };
export default function NotificationPreferencesPage() {
  const [catalog, setCatalog] = useState<PushCatalog>(), [values, setValues] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false), [blocked, setBlocked] = useState(false);
  const saving = useRef(false);
  const apply = useCallback((next: PushCatalog) => { setCatalog(next); setValues(Object.fromEntries(next.types.map((row) => [row.type, row.push]))); }, []);
  const load = useCallback(async () => { setError(""); try { apply(await getNotificationPreferences()); } catch (err) { setError(errorText(err)); } }, [apply]);
  useEffect(() => { void load(); }, [load]);
  const changes = catalog ? pushChanges(catalog, values) : [];
  const save = async () => {
    if (!changes.length || saving.current || blocked) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try { const saved = await saveNotificationPreferences(changes); apply(saved); setNotice(saved.notice ?? "Đã lưu tùy chọn thông báo."); }
    catch (err) { setError(errorText(err)); setBlocked(true); }
    finally { saving.current = false; setBusy(false); }
  };
  return <Page className="screen screen--detail" hideScrollbar><Header title="Tùy chọn thông báo" className="detail-header" /><div className="screen__body form">
    {!catalog && !error && <div className="skeleton skeleton--form" aria-busy />}
    <FormError text={error} />{notice && <p role="status">{notice}</p>}
    {catalog && <><p>Mọi thông báo được lưu trong hộp thư. Chọn các loại bạn muốn nhận thêm qua Push.</p>
      {!catalog.pushAllowedOnDevice && <p>Chưa có thiết bị cho phép nhận Push. Bạn vẫn có thể lưu lựa chọn.</p>}
      {pushAvailable() && <Button variant="secondary" disabled={busy} onClick={async () => {
        if (saving.current) return;
        saving.current = true; setBusy(true);
        try {
          if (catalog.pushAllowedOnDevice) await openPushSettings();
          else { const result = await requestPushPermission(); if (result === "denied") setNotice("Thiết bị chưa cho phép nhận thông báo Push."); }
          const current = await getNotificationPreferences(); setCatalog((previous) => previous ? { ...previous, pushAllowedOnDevice: current.pushAllowedOnDevice } : current);
        } catch (err) { setError(errorText(err)); }
        finally { saving.current = false; setBusy(false); }
      }}>{catalog.pushAllowedOnDevice ? "Cài đặt thông báo thiết bị" : "Cho phép thiết bị nhận Push"}</Button>}
      {!catalog.types.length && <p>Chưa có tùy chọn dành cho tài khoản này.</p>}
      {catalog.types.map((row) => <section className="card pref" key={row.type}><label className="pref__row"><span>{labels[row.type] ?? row.name}{row.mandatory && <small className="pref__reason">Bắt buộc nhận Push</small>}</span>
        <Switch checked={values[row.type] ?? row.push} disabled={row.mandatory || busy || blocked} aria-label={labels[row.type] ?? row.name} onChange={(event) => { setValues({ ...values, [row.type]: event.target.checked }); setNotice(""); }} /></label></section>)}
      <Button fullWidth size="large" loading={busy} disabled={busy || blocked || !changes.length} onClick={() => void save()}>Lưu tùy chọn</Button></>}
    {blocked && <p>Chưa xác định được kết quả lưu. Đối chiếu thiết lập rồi mở lại màn hình trước khi thực hiện lượt mới.</p>}
    {error && <Button disabled={busy} variant="secondary" onClick={() => void load()}>Tải lại thiết lập để đối chiếu</Button>}
  </div></Page>;
}
