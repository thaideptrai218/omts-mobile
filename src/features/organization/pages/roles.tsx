import { useNavigate } from "zmp-ui";
import { Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { roleName } from "@/shared/lib/labels";
import { listRoles } from "../api/organization";
export default function RolesPage() {
  const navigate = useNavigate(), { data, error, reload } = useLoad(() => listRoles(), []);
  return <ManagePage title="Vai trò"><Loadable data={data} error={error} reload={() => void reload()}>{(roles) => roles.length ? <Rows>{roles.map((role) =>
    <Row key={role.id} title={roleName(role.name)} meta={`${role.code} · ${role.permissions.length} chức năng`} onClick={() => navigate(`/manage/roles/${role.id}`)} />)}</Rows>
    : <Empty icon="zi-shield-solid" title="Không có vai trò nào" />}</Loadable><p className="screen__note">Hai vai trò cố định: Quản lý vùng và Kế toán. Xem quyền tại hồ sơ vai trò; cấp và thu hồi tại tài khoản.</p></ManagePage>;
}
