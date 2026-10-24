import { useAtomValue } from "jotai";
import { useState } from "react";
import { Icon, Page } from "zmp-ui";

import ActionGrid from "@/components/action-grid";
import RoleSheet from "@/components/role-sheet";
import StatPanel from "@/components/stat-panel";
import TaskList from "@/components/task-list";
import TideHeader from "@/components/tide-header";
import TraceLookup from "@/components/trace-lookup";
import { COOPERATIVE } from "@/data/content";
import { ROLES } from "@/data/roles";
import { roleAtom } from "@/state/role";

const TZ = "Asia/Ho_Chi_Minh";

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ }).format(now));
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function today(now: Date) {
  return now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

/** Tổng quan: nội dung thay đổi theo vai trò đang xem. */
function HomePage() {
  const roleKey = useAtomValue(roleAtom);
  const role = ROLES[roleKey];
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = new Date();
  const isPublic = roleKey === "viewer";

  const roleChip = (
    <button type="button" className="role-chip" onClick={() => setSheetOpen(true)}>
      <span className="role-chip__label">{role.label}</span>
      <span className="role-chip__scope">{role.scope}</span>
      <Icon icon="zi-chevron-down" size={16} />
    </button>
  );

  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      {isPublic ? (
        <TideHeader kicker={COOPERATIVE.shortName} title="Truy xuất nguồn gốc hàu">
          <p className="tide__lead">Quét mã QR trên bao bì để xem hàu được nuôi ở đâu và thu hoạch khi nào.</p>
          {roleChip}
        </TideHeader>
      ) : (
        <TideHeader kicker={`${greeting(now)}, ${today(now)}`} title={role.person}>
          {roleChip}
        </TideHeader>
      )}

      <div className="screen__body">
        {isPublic ? (
          <div className="block block--raised">
            <TraceLookup />
          </div>
        ) : (
          <>
            <StatPanel stats={role.stats} />
            <TaskList title={role.tasksTitle} tasks={role.tasks} />
            <ActionGrid actions={role.actions} />
            {role.note && <p className="screen__note">{role.note}</p>}
          </>
        )}
      </div>

      <RoleSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Page>
  );
}

export default HomePage;
