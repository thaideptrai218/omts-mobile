import { useAtomValue } from "jotai";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ROLES } from "@/constants/roles";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";
import FeatureRows from "@/features/dashboard/components/FeatureRows/FeatureRows";
import { visibleGroups } from "@/features/dashboard/utils/roleMenu";
import { FEATURE_AREA } from "@/utils/areas";
import { roleKeyFor } from "@/utils/featureAccess";

/** Một nhóm chức năng mở từ trang chủ. Lọc theo quyền giống trang chủ; nhóm không có hoặc không còn gì thì báo rõ. */
function MenuGroupPage() {
  const { group: param } = useParams();
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);

  if (session && !permissions) {
    return (
      <ManagePage title="Chức năng">
        <div className="loading" role="status" aria-busy>
          <p className="loading__text">Đang tải...</p>
          <div className="skeleton skeleton--form" aria-hidden />
        </div>
      </ManagePage>
    );
  }

  const group = permissions
    ? visibleGroups(permissions, ROLES[roleKeyFor(permissions)]).find((g) => String(g.index) === param)
    : undefined;

  return (
    <ManagePage title={group?.title ?? "Không tìm thấy nhóm"} area={group ? group.area ?? FEATURE_AREA[group.actions[0]] : undefined}>
      {group ? (
        <FeatureRows actions={group.actions} />
      ) : (
        <Empty
          title="Nhóm này không có chức năng nào"
          text="Về trang chủ và chọn một nhóm khác."
          action={
            <Button fullWidth size="large" onClick={() => navigate("/", { replace: true })}>
              Về trang chủ
            </Button>
          }
        />
      )}
    </ManagePage>
  );
}

export default MenuGroupPage;
