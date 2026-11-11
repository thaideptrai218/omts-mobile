import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { Role } from "@/features/dashboard/models/Dashboard";
import { useRef } from "react";
import { Icon } from "zmp-ui";

import { Loadable } from "@/components/Loadable/Loadable";
import HomeMenu from "@/features/dashboard/components/HomeMenu/HomeMenu";
import StatPanel from "@/features/dashboard/components/StatPanel/StatPanel";
import TaskList from "@/features/dashboard/components/TaskList/TaskList";

import { useLoad } from "@/hooks/useLoad";
import { loadOwnerSummary } from "@/features/dashboard/services/ownerSummaryService";

/**
 * Tổng quan của Chủ HTX. Việc cần xử lý báo bằng một dải vàng trên cùng, bấm vào cuộn tới danh sách; như vậy các thẻ khu
 * vực luôn nằm đúng một chỗ trên màn đầu. Dưới cùng là số liệu lấy từ API thật.
 */
function OwnerDashboard({ role, permissions }: { role: Role; permissions: MyPermissions }) {
  const { data, error, reload } = useLoad(loadOwnerSummary, []);
  const tasksRef = useRef<HTMLDivElement>(null);
  const taskCount = data?.tasks.length ?? 0;

  return (
    <>
      {taskCount > 0 && (
        <button type="button" className="attention" onClick={() => tasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <Icon icon="zi-warning-solid" />
          <span className="attention__text">Có {taskCount} việc cần xử lý</span>
          <Icon icon="zi-chevron-down" />
        </button>
      )}
      <HomeMenu role={role} permissions={permissions} />
      {data && taskCount > 0 && (
        <div ref={tasksRef}>
          <TaskList title="Cần xử lý" tasks={data.tasks} />
        </div>
      )}
      <div className="block">
        <Loadable data={data} error={error} reload={() => void reload()}>
          {(summary) => (
            <>
              {summary.tasks.length === 0 && <p className="screen__note">Không có việc nào cần xử lý ngay.</p>}
              <StatPanel stats={summary.stats} />
            </>
          )}
        </Loadable>
      </div>
    </>
  );
}

export default OwnerDashboard;
