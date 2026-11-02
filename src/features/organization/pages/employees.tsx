import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge, Chips, ManagePage, Row, SearchBox } from "@/shared/ui/ui";
import { statusLabel } from "@/shared/lib/labels";
import { listEmployees, STATUS_ID } from "@/features/organization/api/organization";

import PagedList from "@/shared/ui/paged-list";
import { usePaged } from "@/shared/hooks/use-paged";

type Filter = "working" | "left" | "all";

const FILTERS: [Filter, string][] = [
  ["working", "Đang làm"],
  ["left", "Đã nghỉ"],
  ["all", "Tất cả"],
];

const STATUS_FOR: Record<Filter, number | null> = { working: STATUS_ID.employeeWorking, left: STATUS_ID.employeeLeft, all: null };

/** Danh sách nhân viên của HTX: tìm theo tên hoặc số điện thoại, lọc đang làm/đã nghỉ, tải thêm theo trang. */
function EmployeesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("working");
  const [search, setSearch] = useState("");
  const fetchPage = useCallback((page: number) => listEmployees({ search, statusId: STATUS_FOR[filter], page }), [search, filter]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage
      title="Nhân viên"
      footer={
        <Button fullWidth size="large" onClick={() => navigate("/manage/employees/new")}>
          Thêm nhân viên
        </Button>
      }
    >
      <SearchBox placeholder="Tìm theo tên hoặc số điện thoại" onSearch={setSearch} />
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <PagedList list={list} unit="nhân viên" emptyIcon="zi-group" emptyTitle="Không có nhân viên nào" emptyText={search ? "Thử tìm bằng tên hoặc số khác." : undefined}>
        {(e) => {
          const status = statusLabel(e.status);
          const zones = e.workingZones.map((z) => z.name ?? z.code).join(", ");
          return (
            <Row
              key={e.id}
              title={e.fullName ?? "—"}
              meta={[e.phoneNumber, zones].filter(Boolean).join(" · ")}
              badge={
                <>
                  <Badge text={status.text} tone={status.tone} />
                  {!e.account && <Badge text="Chưa có tài khoản" tone="neutral" />}
                </>
              }
              onClick={() => navigate(`/manage/employees/${e.id}`)}
            />
          );
        }}
      </PagedList>
    </ManagePage>
  );
}

export default EmployeesPage;
