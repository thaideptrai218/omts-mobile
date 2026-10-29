import { useState } from "react";
import { Button, Modal, useParams } from "zmp-ui";

import { Actions, Badge, Empty, Facts, Loadable, ManagePage, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { DATA_SCOPE, PERMISSION_ACTION, roleName, statusLabel } from "@/services/labels";
import { discontinueRole, FUNCTION_NAME, getRole, getRoleImpact, listPermissionFunctions, reactivateRole } from "@/services/organization";

/**
 * Một vai trò (chỉ xem): mô tả, quyền trên từng chức năng, số người và vùng đang dùng vai trò. Chủ HTX ngừng dùng
 * hoặc dùng lại vai trò; sửa quyền làm trên bản web.
 */
function RoleDetailPage() {
  const { id = "" } = useParams();
  const { data, error, reload, setData } = useLoad(async () => {
    const [role, impact, functions] = await Promise.all([getRole(id), getRoleImpact(id), listPermissionFunctions()]);
    return { role, impact, functions };
  }, [id]);
  const { busy, run } = useAction();
  const [confirming, setConfirming] = useState(false);

  const inUse = data?.role.status === "In Use";

  const toggle = async () => {
    if (!data) return;
    const name = roleName(data.role.name);
    const role = await run(() => (inUse ? discontinueRole(id) : reactivateRole(id)), inUse ? `Đã ngừng dùng vai trò ${name}.` : `Đã dùng lại vai trò ${name}.`);
    if (role) {
      setData({ ...data, role });
      setConfirming(false);
    }
  };

  return (
    <ManagePage title="Vai trò">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ role, impact, functions }) => {
          const status = statusLabel(role.status);
          const known = new Map(functions.map((f) => [f.code, f]));
          return (
            <>
              <div className="card">
                <p className="request__name">{roleName(role.name)}</p>
                <p className="row__badges">
                  <Badge text={status.text} tone={status.tone} />
                </p>
              </div>
              <Section title="Đang dùng">
                <Facts
                  items={[
                    ["Số tài khoản", `${impact.accountCount} tài khoản`],
                    ["Phạm vi", impact.allZonesGranted ? `Toàn HTX${impact.zoneCount ? ` và ${impact.zoneCount} vùng` : ""}` : `${impact.zoneCount} vùng nuôi`],
                    ["Người dùng", impact.accounts.join(", ")],
                    ["Mô tả", role.description],
                  ]}
                />
              </Section>
              <Section title="Quyền trên từng chức năng">
                {role.permissions.length === 0 ? (
                  <Empty icon="zi-shield-solid" title="Vai trò chưa có quyền nào" />
                ) : (
                  <Rows>
                    {role.permissions.map((p) => {
                      const code = p.functionCode ?? "";
                      const scope = known.get(code)?.cooperativeWide ? "Toàn HTX" : (DATA_SCOPE[p.dataScope] ?? p.dataScope);
                      return (
                        <Row
                          key={code}
                          title={FUNCTION_NAME[code] ?? code}
                          meta={`${p.actions.map((a) => PERMISSION_ACTION[a] ?? a).join(", ")} · ${scope}`}
                        />
                      );
                    })}
                  </Rows>
                )}
              </Section>
              <Actions>
                <Button size="large" variant="secondary" type={inUse ? "danger" : "highlight"} onClick={() => setConfirming(true)}>
                  {inUse ? "Ngừng dùng" : "Dùng lại"}
                </Button>
              </Actions>
              <p className="screen__note">Sửa quyền của vai trò thực hiện trên bản web của OMTS.</p>
            </>
          );
        }}
      </Loadable>

      <Modal
        visible={confirming}
        title={inUse ? "Ngừng dùng vai trò" : "Dùng lại vai trò"}
        description={
          inUse
            ? `Vai trò không cấp thêm được cho ai nữa.${data?.impact.accountCount ? ` ${data.impact.accountCount} tài khoản đang có vai trò này.` : ""}`
            : "Vai trò sẽ cấp được cho tài khoản trở lại."
        }
        onClose={() => setConfirming(false)}
        actions={[
          { text: "Để sau", close: true },
          { text: inUse ? "Ngừng dùng" : "Dùng lại", highLight: true, danger: inUse, disabled: busy, onClick: () => void toggle() },
        ]}
      />
    </ManagePage>
  );
}

export default RoleDetailPage;
