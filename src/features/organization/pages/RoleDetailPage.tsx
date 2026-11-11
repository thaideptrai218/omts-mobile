import { useParams } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { DATA_SCOPE, PERMISSION_ACTION, roleName } from "@/utils/labels";
import { FUNCTION_NAME, getRole, listPermissionFunctions } from "@/features/organization/services/organizationService";

/** Một vai trò cố định (BR-FARM-07), chỉ xem: quyền trên từng chức năng. Mô tả của backend là tiếng Anh nên không hiện. */
function RoleDetailPage() {
  const { id = "" } = useParams();
  const { data, error, reload } = useLoad(async () => {
    const [role, functions] = await Promise.all([getRole(id), listPermissionFunctions()]);
    return { role, functions };
  }, [id]);

  return (
    <ManagePage title="Vai trò">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ role, functions }) => {
          const known = new Map(functions.map((f) => [f.code, f]));
          return (
            <>
              <div className="card">
                <p className="request__name">{roleName(role.name)}</p>
              </div>
              <Section title="Quyền trên từng chức năng">
                {role.permissions.length === 0 ? (
                  <Empty icon="zi-shield-solid" title="Vai trò chưa có quyền nào" />
                ) : (
                  <Rows>
                    {role.permissions.map((p) => {
                      const code = p.functionCode ?? "";
                      const scope = known.get(code)?.cooperativeWide ? "Toàn HTX" : (DATA_SCOPE[p.dataScope] ?? p.dataScope);
                      return <Row key={code} title={FUNCTION_NAME[code] ?? code} meta={`${p.actions.map((a) => PERMISSION_ACTION[a] ?? a).join(", ")} · ${scope}`} />;
                    })}
                  </Rows>
                )}
              </Section>
              <p className="screen__note">Vai trò và quyền do hệ thống quy định, không sửa được.</p>
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default RoleDetailPage;
