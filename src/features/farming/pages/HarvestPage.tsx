import type { RaftListItem } from "@/features/farming/models/Raft";
import { useEffect, useState } from "react";
import { Select, useNavigate } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { listRafts, USAGE, zoneLookup } from "@/features/farming/services/farmService";
import { useLoad } from "@/hooks/useLoad";
import { num } from "@/utils/format";

/** Thu hoạch (HARVEST-01): chọn vùng rồi chọn bè để xem các luống và ghi lô thu hoạch. */
export default function HarvestPage() {
  const navigate = useNavigate();
  const zones = useLoad(() => zoneLookup(), []);
  const [zoneId, setZoneId] = useState("");
  const rafts = useLoad(() => (zoneId ? listRafts(zoneId, USAGE.inUse) : Promise.resolve<RaftListItem[]>([])), [zoneId]);

  // Mở sẵn vùng đầu tiên đang dùng để người dùng chỉ còn chọn bè.
  useEffect(() => {
    if (!zoneId && zones.data?.length) setZoneId(zones.data.find((z) => z.statusId === USAGE.inUse)?.id ?? zones.data[0].id);
  }, [zones.data, zoneId]);

  return (
    <ManagePage title="Thu hoạch">
      <p className="form__intro">Chọn bè vừa thu hoạch để ghi số lồng của lô.</p>
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
                      {items.map((r) => (
                        <Row key={r.id} title={`Bè ${r.code ?? ""}`} meta={num(r.laneCount, "luống")} onClick={() => navigate(`/manage/harvest/${r.id}`)} />
                      ))}
                    </Rows>
                  ) : (
                    <Empty title="Vùng này chưa có bè đang dùng" />
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
