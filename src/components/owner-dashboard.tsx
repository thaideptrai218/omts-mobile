import ActionGrid from "@/components/action-grid";
import StatPanel from "@/components/stat-panel";
import TaskList from "@/components/task-list";
import type { Role } from "@/data/roles";
import { useLoad } from "@/hooks/use-load";
import { loadOwnerSummary } from "@/services/owner-summary";

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
