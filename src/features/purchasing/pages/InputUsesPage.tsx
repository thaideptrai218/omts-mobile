import type { InputIssueListItem, InputIssueStatusFilter } from "@/features/purchasing/models/InputIssue";
import type { StatementPeriodChoice } from "@/models/Period";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";
import { dateTime, money } from "@/utils/format";
import { periodOf } from "@/utils/period";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { searchIssues } from "@/features/purchasing/services/inputIssueService";
import { issuePlace, issueStatusLabel } from "@/features/purchasing/utils/inputIssueText";

type Period = Exclude<StatementPeriodChoice, "custom" | "threeMonths">;

const PAGE_SIZE = 20;

/**
 * Phiếu xuất dùng vật tư cho bè, theo luồng của bản web: mặc định tháng này, tìm theo mã, ghi chú; lọc trạng thái; tổng
 * giá trị các phiếu hoàn thành. Quản lý vùng chỉ thấy phiếu của vùng mình (backend lọc). Bộ lọc vùng, bè, loại xuất,
 * người nhận và xuất file để trên bản web.
 */
function InputUsesPage() {
  const navigate = useNavigate();
  const allowed = useBusinessPermission();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [status, setStatus] = useState<InputIssueStatusFilter>("All");
  const [totalValue, setTotalValue] = useState<number | null>(null);

  const fetchPage = useCallback(
    async (page: number) => {
      const result = await searchIssues({ kind: "Use", search, status, ...periodOf(period), page, pageSize: PAGE_SIZE });
      if (page === 1) setTotalValue(result.summary.totalValue);
      return result;
    },
    [search, status, period],
  );
  const list = usePaged<InputIssueListItem>(fetchPage);

  return (
    <ManagePage
      title="Xuất dùng vật tư"
      footer={
        allowed("INPUT_ISSUES", "Create") ? (
          <Button fullWidth size="large" onClick={() => navigate("/manage/input-uses/new")}>
            Lập phiếu xuất dùng
          </Button>
        ) : undefined
      }
    >
      <SearchBox placeholder="Mã phiếu hoặc ghi chú" onSearch={setSearch} />
      <Chips
        options={[
          ["month", "Tháng này"],
          ["lastMonth", "Tháng trước"],
          ["year", "Năm nay"],
        ]}
        value={period}
        onChange={setPeriod}
      />
      <Chips
        options={[
          ["All", "Tất cả"],
          ["Draft", "Phiếu tạm"],
          ["Completed", "Hoàn thành"],
          ["Cancelled", "Đã hủy"],
        ]}
        value={status}
        onChange={setStatus}
      />
      {list.items && totalValue !== null && (
        <div className="summary">
          <div className="summary__cell">
            <span className="summary__label">Tổng giá trị phiếu hoàn thành</span>
            <span className="summary__value">{money(totalValue)}</span>
          </div>
        </div>
      )}
      <PagedList list={list} unit="phiếu" emptyIcon="zi-file" emptyTitle="Không có phiếu xuất dùng nào" emptyText="Thử chọn kỳ hoặc trạng thái khác.">
        {(r) => {
          const st = issueStatusLabel(r.statusId);
          return (
            <Row
              key={r.id}
              title={r.code}
              meta={
                <MetaLines
                  items={[
                    ["Thời gian", dateTime(r.issuedAt)],
                    ["Nơi nhận", issuePlace(r.zoneCode, r.raftCode)],
                    ["Loại xuất", r.issueTypeName],
                    ["Người nhận", r.receiverName],
                    ["Giá trị", money(r.totalValue)],
                  ]}
                />
              }
              badge={<Badge text={st.text} tone={st.tone} />}
              onClick={() => navigate(`/manage/input-uses/${r.id}`)}
            />
          );
        }}
      </PagedList>
    </ManagePage>
  );
}

export default InputUsesPage;
