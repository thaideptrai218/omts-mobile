import type { ZoneCycleItem } from "@/features/farming/models/Cycle";
import { useEffect, useState } from "react";
import { Select, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { CYCLE_STATUS, zoneCycles } from "@/features/farming/services/cultivationService";
import { USAGE, zoneLookup } from "@/features/farming/services/farmService";
import { useLoad } from "@/hooks/useLoad";
import { date } from "@/utils/format";

/** Dòng phụ của bè: đang nuôi từ ngày nào, hoặc chu kỳ trước đóng ngày nào. */
function raftMeta(item: ZoneCycleItem): string {
  if (item.cycle?.statusId === CYCLE_STATUS.open) return `Đang nuôi từ ${date(item.cycle.startDate)}`;
  if (item.lastCloseDate) return `Chu kỳ trước đóng ${date(item.lastCloseDate)}`;
  return "Chưa có chu kỳ nuôi";
}

/**
 * Vật tư sử dụng (CYCLE-03), mở từ menu: chọn vùng rồi chọn bè. Quản lý vùng chỉ thấy vùng của mình; bè ngừng dùng vẫn
 * mở được để xem vật tư đã ghi.
 */
export default function MaterialUsagesPage() {
  const navigate = useNavigate();
  const zones = useLoad(() => zoneLookup(), []);
  const [zoneId, setZoneId] = useState("");
  const rafts = useLoad(() => (zoneId ? zoneCycles(zoneId) : Promise.resolve<ZoneCycleItem[]>([])), [zoneId]);

  // Mở sẵn vùng đầu tiên đang dùng để người dùng chỉ còn chọn bè.
  useEffect(() => {
    if (!zoneId && zones.data?.length) setZoneId(zones.data.find((z) => z.statusId === USAGE.inUse)?.id ?? zones.data[0].id);
  }, [zones.data, zoneId]);

  return (
    <ManagePage title="Vật tư sử dụng">
      <p className="form__intro">Chọn bè để xem hoặc ghi phao, dây và vật tư đã dùng khi sửa bè.</p>
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
                      {items.map((item) => (
                        <Row
                          key={item.raftId}
                          title={`Bè ${item.raftCode}`}
                          meta={raftMeta(item)}
                          badge={item.raftStatusId !== USAGE.inUse ? <Badge text="Ngừng dùng" tone="neutral" /> : undefined}
                          onClick={() => navigate(`/manage/rafts/${item.raftId}/material-usages`)}
                        />
                      ))}
                    </Rows>
                  ) : (
                    <Empty title="Vùng này chưa có bè" text="Chủ HTX cần tạo bè trong vùng nuôi trước." />
                  )
                }
              </Loadable>
            </>
          ) : (
            <Empty title="Chưa có vùng nuôi" text="Chủ HTX cần tạo vùng nuôi và bè trước." />
          )
        }
      </Loadable>
    </ManagePage>
  );
}
