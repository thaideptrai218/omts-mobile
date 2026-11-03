import type { Role } from "@/features/dashboard/models/Dashboard";
import ActionGrid from "@/features/dashboard/components/ActionGrid/ActionGrid";
import StatPanel from "@/features/dashboard/components/StatPanel/StatPanel";
import TaskList from "@/features/dashboard/components/TaskList/TaskList";

import { useLoad } from "@/hooks/useLoad";
import { loadOwnerSummary } from "@/features/dashboard/services/ownerSummaryService";

/**
 * Tổng quan của Chủ HTX: việc cần xử lý và số liệu lấy từ API thật, chức năng chia theo nhóm. Nhóm cuối là các
 * chức năng backend chưa có API, mở ra trang giải thích.
 */
function OwnerDashboard({ role }: { role: Role }) {
  const { data } = useLoad(loadOwnerSummary, []);

  return (
    <>
      {data ? (
        <>
          <TaskList title="Cần xử lý" tasks={data.tasks} />
          {data.tasks.length === 0 && <p className="screen__note">Không có việc nào cần xử lý ngay.</p>}
        </>
      ) : (
        <div className="skeleton skeleton--form" aria-busy />
      )}
      {role.actionGroups?.map((g) => <ActionGrid key={g.title} title={g.title} actions={g.actions} />)}
      {data && <StatPanel stats={data.stats} />}
    </>
  );
}

export default OwnerDashboard;
