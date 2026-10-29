import { useState } from "react";
import { Button, Icon, useNavigate } from "zmp-ui";

import { Badge, Chips, Empty, Loadable, ManagePage, Row, Rows, SearchBox } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { listZones, USAGE } from "@/services/farm";
import { num } from "@/services/format";
import { LICENSE_STATE, statusLabel } from "@/services/labels";

type Filter = "inUse" | "discontinued" | "all";

const FILTERS: [Filter, string][] = [
  ["inUse", "Đang dùng"],
  ["discontinued", "Ngừng dùng"],
  ["all", "Tất cả"],
];

/** Danh sách vùng nuôi của HTX: số bè đang dùng và tình trạng giấy tờ của từng vùng. */
function ZonesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("inUse");
  const [search, setSearch] = useState("");
  const statusId = filter === "all" ? undefined : USAGE[filter];
  const { data, error, reload } = useLoad(() => listZones({ search, statusId, pageSize: 100 }), [search, statusId]);

  return (
    <ManagePage
      title="Vùng nuôi"
      footer={
        <Button fullWidth size="large" prefixIcon={<Icon icon="zi-plus" />} onClick={() => navigate("/manage/zones/new")}>
          Thêm vùng nuôi
        </Button>
      }
    >
      <SearchBox placeholder="Tìm theo mã, tên vùng" onSearch={setSearch} />
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(page) =>
          page.items.length === 0 ? (
            <Empty icon="zi-location" title="Không có vùng nuôi nào" text={search ? "Thử tìm bằng từ khóa khác." : undefined} />
          ) : (
            <Rows>
              {page.items.map((z) => {
                const status = statusLabel(z.status);
                const license = LICENSE_STATE[z.licenseState];
                return (
                  <Row
                    key={z.id}
                    title={z.name}
                    meta={[z.code, z.location].filter(Boolean).join(" · ")}
                    badge={
                      <>
                        {z.statusId !== USAGE.inUse && <Badge text={status.text} tone={status.tone} />}
                        {license && <Badge text={`Giấy tờ: ${license.text}`} tone={license.tone} />}
                      </>
                    }
                    value={`${num(z.inUseRaftCount)} bè`}
                    onClick={() => navigate(`/manage/zones/${z.id}`)}
                  />
                );
              })}
            </Rows>
          )
        }
      </Loadable>
    </ManagePage>
  );
}

export default ZonesPage;
