import { useCallback } from "react";
import { useNavigate, useParams } from "zmp-ui";

import RaftMap from "@/features/farming/components/raft-map";
import { Loadable, ManagePage } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { getZone, listRafts } from "@/features/farming/api/farm";

/** Chỉ lấy các bè thuộc vùng người dùng đang xem, qua API có kiểm tra quyền. */
export default function ZoneMapPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(async () => {
    const [zone, rafts] = await Promise.all([getZone(id), listRafts(id)]);
    return { zone, rafts };
  }, [id]);
  const openRaft = useCallback((raftId: string) => navigate(`/manage/rafts/${raftId}`), [navigate]);

  return (
    <ManagePage title={data ? `Bản đồ ${data.zone.name ?? data.zone.code ?? "vùng nuôi"}` : "Bản đồ bè"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ zone, rafts }) => <RaftMap zone={zone} rafts={rafts} onOpenRaft={openRaft} />}
      </Loadable>
    </ManagePage>
  );
}
