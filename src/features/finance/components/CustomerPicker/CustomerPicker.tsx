import type { CustomerPickerMode, FinanceCustomer } from "@/features/finance/models/FinanceCustomer";
import { useCallback, useState } from "react";

import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { searchPaymentCustomers } from "@/features/finance/services/customerPaymentService";
import { debtText } from "@/features/finance/utils/financeText";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";

const PAGE_SIZE = 20;

/**
 * Bước chọn thương lái khi mở phiếu thu hoặc phiếu trả lại tiền mà chưa có thương lái. Thu tiền: người nợ nhiều lên đầu.
 * Trả lại tiền: chỉ người HTX đang nợ lại (DEBT-02.3 bước 1). Không có quyền xem công nợ thì hiện mọi thương lái theo tên.
 */
export function CustomerPicker({ mode, onPick }: { mode: CustomerPickerMode; onPick: (customer: FinanceCustomer) => void }) {
  const can = useBusinessPermission();
  const seesDebt = can("CUSTOMER_DEBTS", "View");
  const [search, setSearch] = useState("");
  const fetchPage = useCallback(
    (page: number) => searchPaymentCustomers({ search, mode, seesDebt, page, pageSize: PAGE_SIZE }),
    [search, mode, seesDebt],
  );
  const list = usePaged(fetchPage);
  const payBack = mode === "payBack";

  return (
    <div className="block">
      <p className="form__intro">{payBack ? "Chọn thương lái cần trả lại tiền." : "Chọn thương lái đã trả tiền."}</p>
      <SearchBox label="Tìm thương lái" placeholder="Tên, mã hoặc số điện thoại" onSearch={setSearch} />
      <PagedList
        list={list}
        unit="thương lái"
        emptyIcon="zi-user-circle"
        emptyTitle={payBack && seesDebt ? "HTX không nợ lại thương lái nào" : "Không tìm thấy thương lái"}
        emptyText={search ? "Thử từ khóa khác." : undefined}
      >
        {(c) => (
          <Row
            key={c.id}
            title={c.name}
            meta={[c.code, c.phoneNumber].filter(Boolean).join(" · ")}
            value={c.currentDebt === null ? undefined : debtText(c.currentDebt)}
            onClick={() => onPick(c)}
          />
        )}
      </PagedList>
    </div>
  );
}
