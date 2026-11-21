import type { CustomerExtraFilter, CustomerStatusFilter } from "@/features/customers/models/Customer";
import { useCallback, useState } from "react";
import { Button, Select, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import PagedList from "@/components/PagedList/PagedList";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";
import { money } from "@/utils/format";
import { listCustomers } from "@/features/customers/services/customerService";
import { CUSTOMER_STATUS, CUSTOMER_TYPE_TEXT, customerStatus } from "@/features/customers/utils/customerText";

const STATUS_FILTERS: [CustomerStatusFilter, string][] = [
  ["InUse", "Đang dùng"],
  ["Discontinued", "Ngừng dùng"],
  ["All", "Tất cả"],
];

/**
 * Danh sách khách hàng (SALE-04): tìm theo tên, mã hoặc số điện thoại, lọc trạng thái, loại khách và khách vượt hạn mức nợ.
 * Hồ sơ không thuộc vùng nào (BR-FARM-08); số nợ chỉ hiện với người có quyền xem công nợ (BR-FARM-07).
 */
function CustomersPage() {
  const navigate = useNavigate();
  const allowed = useBusinessPermission();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatusFilter>("InUse");
  const [extra, setExtra] = useState<CustomerExtraFilter>("all");
  const fetchPage = useCallback(
    (page: number) =>
      listCustomers({
        search,
        status,
        type: extra === "Individual" || extra === "Company" ? extra : null,
        overDebtLimit: extra === "overDebtLimit",
        page,
      }),
    [search, status, extra],
  );
  const list = usePaged(fetchPage);

  return (
    <ManagePage
      title="Khách hàng"
      footer={
        allowed("CUSTOMERS", "Create") ? (
          <Button fullWidth size="large" onClick={() => navigate("/manage/customers/new")}>
            Thêm khách hàng
          </Button>
        ) : undefined
      }
    >
      {allowed("CUSTOMER_DEBTS", "View") && (
        <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate("/manage/customer-debts")}>
          Xem công nợ thương lái
        </Button>
      )}
      <div className="block">
        <SearchBox label="Tìm khách hàng" placeholder="Tên, mã hoặc số điện thoại" onSearch={setSearch} />
        <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <div className="form">
          <Select label="Lọc thêm" value={extra} onChange={(v) => setExtra(v as CustomerExtraFilter)} closeOnSelect>
            <Select.Option value="all" title="Tất cả khách hàng" />
            <Select.Option value="Individual" title={`Khách ${CUSTOMER_TYPE_TEXT.Individual.toLowerCase()}`} />
            <Select.Option value="Company" title={`Khách là ${CUSTOMER_TYPE_TEXT.Company.toLowerCase()}`} />
            <Select.Option value="overDebtLimit" title="Khách vượt hạn mức nợ" />
          </Select>
        </div>
        <PagedList
          list={list}
          unit="khách hàng"
          emptyIcon="zi-user-circle"
          emptyTitle="Không có khách hàng nào"
          emptyText={search || extra !== "all" ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm." : undefined}
        >
          {(c) => {
            const st = customerStatus(c);
            const debt = c.currentDebt;
            return (
              <Row
                key={c.id}
                title={c.name}
                meta={[c.code, c.phoneNumber, c.customerType === "Company" ? (c.companyName ?? CUSTOMER_TYPE_TEXT.Company) : null].filter(Boolean).join(" · ")}
                badge={
                  c.statusId !== CUSTOMER_STATUS.inUse || c.overDebtLimit || c.hasTraderAccount ? (
                    <>
                      {c.statusId !== CUSTOMER_STATUS.inUse && <Badge text={st.text} tone={st.tone} />}
                      {c.overDebtLimit && <Badge text={c.overDebtDays && !c.overDebtAmount ? "Nợ quá số ngày cho phép" : "Vượt hạn mức nợ"} tone="danger" />}
                      {c.hasTraderAccount && <Badge text="Có tài khoản thương lái" tone="neutral" />}
                    </>
                  ) : undefined
                }
                value={
                  debt !== null && debt !== 0 ? (
                    <span className={debt > 0 ? "text-danger" : undefined}>{debt < 0 ? `Nợ lại ${money(-debt)}` : money(debt)}</span>
                  ) : undefined
                }
                onClick={() => navigate(`/manage/customers/${c.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}

export default CustomersPage;
