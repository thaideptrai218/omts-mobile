import { useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge, Chips, Empty, Loadable, ManagePage, Row, Rows, SearchBox } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { statusLabel, SUPPLIER_TYPE } from "@/shared/lib/labels";
import { listSuppliers, STATUS_DISCONTINUED, STATUS_IN_USE, type SupplierType } from "@/features/purchasing/api/purchasing";

type TypeFilter = "all" | SupplierType;
type StatusFilter = "inUse" | "discontinued";

/** Danh sách nhà cung cấp giống, vật tư. Lọc theo loại và trạng thái; tìm theo tên hoặc số điện thoại. */
function SuppliersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("inUse");
  const { data, error, reload } = useLoad(
    () =>
      listSuppliers({
        search,
        type: type === "all" ? null : type,
        statusId: status === "inUse" ? STATUS_IN_USE : STATUS_DISCONTINUED,
      }),
    [search, type, status],
  );

  return (
    <ManagePage
      title="Nhà cung cấp"
      footer={
        <Button fullWidth size="large" onClick={() => navigate("/manage/suppliers/new")}>
          Thêm nhà cung cấp
        </Button>
      }
    >
      <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate("/manage/supplier-debts")}>
        Xem công nợ nhà cung cấp
      </Button>
      <div className="block">
        <SearchBox placeholder="Tìm tên hoặc số điện thoại" onSearch={setSearch} />
        <Chips
          options={[
            ["all", "Tất cả"],
            ["Seed", SUPPLIER_TYPE.Seed],
            ["Material", SUPPLIER_TYPE.Material],
            ["Other", SUPPLIER_TYPE.Other],
          ]}
          value={type}
          onChange={setType}
        />
        <Chips
          options={[
            ["inUse", "Đang dùng"],
            ["discontinued", "Ngừng dùng"],
          ]}
          value={status}
          onChange={setStatus}
        />
        <Loadable data={data} error={error} reload={() => void reload()}>
          {(page) =>
            page.items.length === 0 ? (
              <Empty icon="zi-user-circle" title="Không có nhà cung cấp nào" text="Thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
            ) : (
              <Rows>
                {page.items.map((s) => {
                  const st = statusLabel(s.status);
                  return (
                    <Row
                      key={s.id}
                      title={s.name}
                      meta={`${SUPPLIER_TYPE[s.supplierType] ?? s.supplierType}${s.phoneNumber ? ` · ${s.phoneNumber}` : ""}`}
                      badge={s.statusId !== STATUS_IN_USE ? <Badge text={st.text} tone={st.tone} /> : undefined}
                      onClick={() => navigate(`/manage/suppliers/${s.id}`)}
                    />
                  );
                })}
              </Rows>
            )
          }
        </Loadable>
      </div>
    </ManagePage>
  );
}

export default SuppliersPage;
