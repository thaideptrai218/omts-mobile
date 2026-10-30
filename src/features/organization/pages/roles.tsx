import { useState } from "react";
import { useNavigate } from "zmp-ui";

import { Badge, Chips, Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { roleName, statusLabel } from "@/shared/lib/labels";
import { listRoles, STATUS_ID } from "@/features/organization/api/organization";

type Filter = "inUse" | "discontinued";

const FILTERS: [Filter, string][] = [
  ["inUse", "Đang dùng"],
  ["discontinued", "Ngừng dùng"],
];

/** Danh sách vai trò. Xem quyền của từng vai trò ở trang chi tiết; sửa quyền làm trên bản web. */
function RolesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("inUse");
  const { data, error, reload } = useLoad(() => listRoles(filter === "inUse" ? STATUS_ID.inUse : STATUS_ID.discontinued), [filter]);

  return (
    <ManagePage title="Vai trò">
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(roles) =>
          roles.length === 0 ? (
            <Empty icon="zi-shield-solid" title="Không có vai trò nào" />
          ) : (
            <Rows>
              {roles.map((r) => {
                const status = statusLabel(r.status);
                return (
                  <Row
                    key={r.id}
                    title={roleName(r.name)}
                    meta={`${r.permissions.length} chức năng`}
                    badge={<Badge text={status.text} tone={status.tone} />}
                    onClick={() => navigate(`/manage/roles/${r.id}`)}
                  />
                );
              })}
            </Rows>
          )
        }
      </Loadable>
      <p className="screen__note">Tạo vai trò và sửa quyền thực hiện trên bản web. Cấp vai trò cho người dùng ở màn Tài khoản.</p>
    </ManagePage>
  );
}

export default RolesPage;
