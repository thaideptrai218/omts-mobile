import { useState } from "react";
import { Button, Select, Sheet, useNavigate, useParams } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { Actions, Badge, Empty, Facts, Loadable, ManagePage, ReasonSheet, Row, Rows, Section } from "@/shared/ui/ui";
import { useAction } from "@/shared/hooks/use-action";
import { useLoad } from "@/shared/hooks/use-load";
import { MESSAGES } from "@/shared/lib/messages";
import { date, todayIso } from "@/shared/lib/format";
import { roleName, statusLabel } from "@/shared/lib/labels";
import {
  addGrant,
  getAccount,
  GRANT_STATE,
  type GrantRow,
  listGrants,
  listRoles,
  lockAccount,
  lookupZones,
  revokeGrant,
  STATUS_ID,
  type StaffAccount,
  unlockAccount,
} from "@/features/organization/api/organization";

import DateField from "@/shared/ui/date-field";

const ALL_ZONES = "all";

function grantPeriod(g: GrantRow) {
  return g.effectiveTo ? `${date(g.effectiveFrom)} – ${date(g.effectiveTo)}` : `Từ ${date(g.effectiveFrom)}`;
}

/**
 * Một tài khoản nhân viên: thông tin liên hệ, hồ sơ nhân viên đã gắn, các lần cấp vai trò theo vùng. Chủ HTX khóa
 * hoặc mở khóa, cấp thêm vai trò, thu hồi vai trò. Mỗi thao tác đều cần lý do để ghi nhật ký hệ thống.
 */
function AccountDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(async () => {
    const [account, grants] = await Promise.all([getAccount(id), listGrants(id)]);
    return { account, grants };
  }, [id]);
  const { busy, run } = useAction();
  const [locking, setLocking] = useState<"lock" | "unlock" | null>(null);
  const [revoking, setRevoking] = useState<GrantRow | null>(null);
  const [granting, setGranting] = useState(false);

  const setAccount = (account: StaffAccount) => setData((d) => (d ? { ...d, account } : d));
  const setGrants = (update: (grants: GrantRow[]) => GrantRow[]) => setData((d) => (d ? { ...d, grants: update(d.grants) } : d));

  const changeLock = async (reason: string) => {
    if (!data || !locking) return false;
    const name = data.account.displayName ?? data.account.username;
    const result = await run(
      () => (locking === "lock" ? lockAccount(id, reason) : unlockAccount(id, reason)),
      locking === "lock" ? `Đã khóa tài khoản ${name}.` : `Đã mở khóa tài khoản ${name}.`,
    );
    if (result) setAccount(result);
    return Boolean(result);
  };

  const revoke = async (reason: string) => {
    if (!revoking) return false;
    const result = await run(() => revokeGrant(id, revoking.id, reason), "Đã thu hồi vai trò.");
    if (result) setGrants((grants) => grants.map((g) => (g.id === result.id ? result : g)));
    return Boolean(result);
  };

  return (
    <ManagePage title="Tài khoản">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ account: a, grants }) => {
          const status = statusLabel(a.status);
          const locked = a.status === "Locked";
          const current = grants.filter((g) => g.state !== "Revoked" && g.state !== "Expired");
          const past = grants.filter((g) => g.state === "Revoked" || g.state === "Expired");
          return (
            <>
              <div className="card">
                <p className="request__name">{a.displayName ?? a.username}</p>
                <p className="row__badges">
                  <Badge text={status.text} tone={status.tone} />
                </p>
              </div>
              <Section title="Thông tin">
                <Facts
                  items={[
                    ["Tên đăng nhập", a.username],
                    ["Số điện thoại", a.phoneNumber ? `${a.phoneNumber}${a.phoneVerified ? " (đã xác minh)" : " (chưa xác minh)"}` : null],
                    ["Email", a.email ? `${a.email}${a.emailVerified ? " (đã xác minh)" : " (chưa xác minh)"}` : null],
                  ]}
                />
                {a.employeeId && (
                  <Button className="more" fullWidth variant="secondary" onClick={() => navigate(`/manage/employees/${a.employeeId}`)}>
                    Xem hồ sơ nhân viên
                  </Button>
                )}
              </Section>
              <Section
                title="Vai trò theo vùng"
                action={
                  !locked && (
                    <Button size="small" variant="secondary" onClick={() => setGranting(true)}>
                      Cấp thêm
                    </Button>
                  )
                }
              >
                {current.length === 0 ? (
                  <Empty icon="zi-shield-solid" title="Chưa có vai trò đang hiệu lực" text="Tài khoản chưa dùng được chức năng nào cho tới khi được cấp vai trò." />
                ) : (
                  <Rows>
                    {current.map((g) => (
                      <GrantItem key={g.id} grant={g} onClick={() => setRevoking(g)} />
                    ))}
                  </Rows>
                )}
                {current.length > 0 && <p className="form__hint">Bấm vào một vai trò để thu hồi.</p>}
              </Section>
              {past.length > 0 && (
                <Section title="Đã hết hạn hoặc thu hồi">
                  <Rows>
                    {past.map((g) => (
                      <GrantItem key={g.id} grant={g} />
                    ))}
                  </Rows>
                </Section>
              )}
              <Actions>
                {locked ? (
                  <Button size="large" onClick={() => setLocking("unlock")}>
                    Mở khóa
                  </Button>
                ) : (
                  <Button size="large" variant="secondary" type="danger" onClick={() => setLocking("lock")}>
                    Khóa tài khoản
                  </Button>
                )}
              </Actions>
              <p className="screen__note">Đặt lại mật khẩu thực hiện trên bản web của OMTS.</p>
            </>
          );
        }}
      </Loadable>

      <ReasonSheet
        visible={locking !== null}
        title={locking === "lock" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        intro={locking === "lock" ? "Người này sẽ bị đăng xuất và không vào được OMTS cho tới khi mở khóa." : "Người này sẽ vào lại được OMTS với các vai trò còn hiệu lực."}
        confirmText={locking === "lock" ? "Khóa" : "Mở khóa"}
        required
        maxLength={1000}
        busy={busy}
        onClose={() => setLocking(null)}
        onConfirm={changeLock}
      />

      <ReasonSheet
        visible={revoking !== null}
        title="Thu hồi vai trò"
        intro={revoking ? `${roleName(revoking.roleName)}, ${revoking.allZones ? "toàn HTX" : revoking.zoneName}. Người này mất quyền của vai trò này ngay.` : ""}
        confirmText="Thu hồi"
        required
        maxLength={1000}
        busy={busy}
        onClose={() => setRevoking(null)}
        onConfirm={revoke}
      />

      <GrantSheet
        visible={granting}
        accountId={id}
        onClose={() => setGranting(false)}
        onGranted={(g) => {
          setGrants((grants) => [g, ...grants]);
          setGranting(false);
        }}
      />
    </ManagePage>
  );
}

function GrantItem({ grant: g, onClick }: { grant: GrantRow; onClick?: () => void }) {
  const state = (g.state && GRANT_STATE[g.state]) || { text: g.state ?? "—", tone: "neutral" as const };
  return (
    <Row
      title={roleName(g.roleName)}
      meta={`${g.allZones ? "Toàn HTX" : (g.zoneName ?? "—")} · ${grantPeriod(g)}${g.revokeReason ? ` · Lý do thu hồi: ${g.revokeReason}` : ""}`}
      badge={<Badge text={state.text} tone={state.tone} />}
      onClick={onClick}
    />
  );
}

/** Sheet cấp vai trò: chọn vai trò đang dùng, vùng (hoặc toàn HTX) và khoảng hiệu lực. */
function GrantSheet({ visible, accountId, onClose, onGranted }: { visible: boolean; accountId: string; onClose: () => void; onGranted: (g: GrantRow) => void }) {
  const options = useLoad(async () => {
    if (!visible) return null;
    const [roles, zones] = await Promise.all([listRoles(STATUS_ID.inUse), lookupZones()]);
    return { roles, zones: zones.filter((z) => z.statusId === STATUS_ID.inUse) };
  }, [visible]);
  const [roleId, setRoleId] = useState("");
  const [zoneId, setZoneId] = useState(ALL_ZONES);
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { busy, run } = useAction();

  const submit = async () => {
    if (!roleId) {
      setError(MESSAGES.MSG01("Vai trò"));
      return;
    }
    setError("");
    const result = await run(
      () => addGrant(accountId, { roleId, zoneId: zoneId === ALL_ZONES ? null : zoneId, effectiveFrom: from, effectiveTo: to }),
      "Đã cấp vai trò.",
    );
    if (result) {
      setRoleId("");
      setZoneId(ALL_ZONES);
      setTo(null);
      onGranted(result);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Cấp vai trò">
      <div className="sheet-form form">
        {options.error && <FormError text={options.error} />}
        <Select label="Vai trò" placeholder="Chọn vai trò" mask closeOnSelect value={roleId} onChange={(v) => setRoleId(String(v ?? ""))} disabled={busy || !options.data}>
          {(options.data?.roles ?? []).map((r) => (
            <Select.Option key={r.id} value={r.id} title={roleName(r.name)} />
          ))}
        </Select>
        <Select label="Phạm vi" mask closeOnSelect value={zoneId} onChange={(v) => setZoneId(String(v ?? ALL_ZONES))} disabled={busy || !options.data}>
          <Select.Option value={ALL_ZONES} title="Toàn HTX" />
          {(options.data?.zones ?? []).map((z) => (
            <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
          ))}
        </Select>
        <div className="two-col">
          <DateField label="Hiệu lực từ" value={from} onChange={setFrom} disabled={busy} />
          <DateField label="Đến (không bắt buộc)" value={to} onChange={setTo} disabled={busy} />
        </div>
        {to && (
          <button type="button" className="link-button" onClick={() => setTo(null)}>
            Bỏ ngày kết thúc
          </button>
        )}
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void submit()}>
          Cấp vai trò
        </Button>
      </div>
    </Sheet>
  );
}

export default AccountDetailPage;
