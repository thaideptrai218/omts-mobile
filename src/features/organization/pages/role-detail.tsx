import { useParams } from "zmp-ui";
import { Facts, Loadable, ManagePage, Row, Rows, Section } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { PERMISSION_ACTION, roleName } from "@/shared/lib/labels";
import { FUNCTION_NAME, getRole, listPermissionFunctions } from "../api/organization";
export default function RoleDetailPage() {
  const { id = "" } = useParams();
  const { data, error, reload } = useLoad(async () => { const [role, functions] = await Promise.all([getRole(id), listPermissionFunctions()]); return { role, functions }; }, [id]);
  return <ManagePage title="Vai trò"><Loadable data={data} error={error} reload={() => void reload()}>{({ role, functions }) => <>
    <Facts items={[["Vai trò", roleName(role.name)], ["Mã", role.code], ["Mô tả", role.description]]} />
    <Section title="Quyền trên từng chức năng"><Rows>{role.permissions.map((permission) => { const code = permission.functionCode ?? "";
      return <Row key={code} title={FUNCTION_NAME[code] ?? code} meta={`${permission.actions.map((action) => PERMISSION_ACTION[action] ?? action).join(", ")} · ${functions.find((fn) => fn.code === code)?.cooperativeWide ? "Toàn HTX" : "Trong vùng được cấp"}`} />;
    })}</Rows></Section></>}</Loadable></ManagePage>;
}
