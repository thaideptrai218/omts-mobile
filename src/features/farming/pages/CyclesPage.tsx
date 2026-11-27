import type { ZoneCycleItem } from "@/features/farming/models/Cycle";
import { useEffect, useState } from "react";
import { Select, useLocation, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { CYCLE_STATUS, zoneCycles } from "@/features/farming/services/cultivationService";
import { USAGE, zoneLookup } from "@/features/farming/services/farmService";
import { useLoad } from "@/hooks/useLoad";
import { date, num } from "@/utils/format";

/** Màn mở từ chức năng nào: Chu kỳ nuôi, Thả giống hay Nhật ký nuôi. Hai chức năng sau đi thẳng tới chu kỳ đang mở của bè. */
type Goal = "cycles" | "seeding" | "logs";

const PAGE: Record<Goal, { title: string; intro: string }> = {
  cycles: { title: "Chu kỳ nuôi", intro: "Chọn bè để bắt đầu, xem hoặc đóng chu kỳ nuôi." },
  seeding: { title: "Thả giống", intro: "Chọn bè đang nuôi để ghi phiên thả giống." },
  logs: { title: "Nhật ký nuôi", intro: "Chọn bè đang nuôi để ghi nhật ký đi bè kèm ảnh." },
};

function goalOf(search: string): Goal {
  const value = new URLSearchParams(search).get("for");
  return value === "seeding" || value === "logs" ? value : "cycles";
}

/** Dòng mô tả chu kỳ của bè: đang nuôi từ ngày nào, hoặc chu kỳ gần nhất đóng ngày nào. */
function cycleMeta(item: ZoneCycleItem): string {
  const lanes = num(item.laneCount, "luống");
  if (item.cycle?.statusId === CYCLE_STATUS.open) return `${lanes} · nuôi từ ${date(item.cycle.startDate)}`;
  if (item.lastCloseDate) return `${lanes} · chu kỳ trước đóng ${date(item.lastCloseDate)}`;
  return `${lanes} · chưa có chu kỳ`;
}

/** Chu kỳ nuôi (SCR-CYCLE-01): chọn vùng, rồi chọn bè. */
export default function CyclesPage() {
  const navigate = useNavigate();
  const goal = goalOf(useLocation().search);
  const zones = useLoad(() => zoneLookup(), []);
  const [zoneId, setZoneId] = useState("");
  const rafts = useLoad(() => (zoneId ? zoneCycles(zoneId) : Promise.resolve<ZoneCycleItem[]>([])), [zoneId]);

  // Mở sẵn vùng đầu tiên để người dùng chỉ còn chọn bè.
  useEffect(() => {
    if (!zoneId && zones.data?.length) setZoneId(zones.data[0].id);
  }, [zones.data, zoneId]);

  const open = (item: ZoneCycleItem) => {
    const openCycle = item.cycle?.statusId === CYCLE_STATUS.open ? item.cycle : null;
    if (goal !== "cycles" && openCycle) navigate(`/manage/cycles/${openCycle.id}/${goal}`);
    else navigate(`/manage/cycles/raft/${item.raftId}`);
  };

  const page = PAGE[goal];
  return (
    <ManagePage title={page.title}>
      <p className="form__intro">{page.intro}</p>
      <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>
        {(list) =>
          list.length ? (
            <>
              <div className="card form">
                <Select label="Vùng nuôi" value={zoneId} onChange={(v) => setZoneId(String(v))} closeOnSelect>
                  {list.map((z) => (
                    <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
                  ))}
                </Select>
              </div>
              <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>
                {(items) =>
                  items.length ? (
                    <Rows>
                      {items.map((item) => {
                        const growing = item.cycle?.statusId === CYCLE_STATUS.open;
                        return (
                          <Row key={item.raftId} title={`Bè ${item.raftCode}`} meta={cycleMeta(item)} onClick={() => open(item)}
                            badge={<Badge text={item.raftStatusId !== USAGE.inUse ? "Ngừng dùng" : growing ? "Đang nuôi" : "Chưa nuôi"}
                              tone={item.raftStatusId !== USAGE.inUse ? "neutral" : growing ? "success" : "warning"} />} />
                        );
                      })}
                    </Rows>
                  ) : (
                    <Empty title="Vùng này chưa có bè" text="Chủ HTX cần tạo bè trong vùng nuôi trước." />
                  )
                }
              </Loadable>
              {goal !== "cycles" && <p className="form__hint">Bè chưa có chu kỳ đang mở thì cần bắt đầu chu kỳ nuôi trước.</p>}
            </>
          ) : (
            <Empty title="Chưa có vùng nuôi" text="Chủ HTX cần tạo vùng nuôi và bè trước." />
          )
        }
      </Loadable>
    </ManagePage>
  );
}
