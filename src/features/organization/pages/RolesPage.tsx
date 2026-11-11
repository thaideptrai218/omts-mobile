import { useNavigate } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { roleName } from "@/utils/labels";
import { listRoles, STATUS_ID } from "@/features/organization/services/organizationService";

/** Các vai trò cố định của HTX (BR-FARM-07), chỉ xem. Mở một vai trò để xem quyền của vai trò đó. */
function RolesPage() {
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(() => listRoles(STATUS_ID.inUse), []);

  return (
    <ManagePage title="Vai trò">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(roles) =>
          roles.length === 0 ? (
            <Empty icon="zi-shield-solid" title="Không có vai trò nào" />
          ) : (
            <Rows>
              {roles.map((r) => (
                <Row key={r.id} title={roleName(r.name)} meta={`${r.permissions.length} chức năng`} onClick={() => navigate(`/manage/roles/${r.id}`)} />
              ))}
            </Rows>
          )
        }
      </Loadable>
      <p className="screen__note">Vai trò và quyền do hệ thống quy định, không sửa được. Cấp vai trò cho người dùng ở màn Tài khoản.</p>
    </ManagePage>
  );
}

export default RolesPage;
