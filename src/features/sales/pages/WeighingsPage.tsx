import { useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { PurchasePager } from "@/features/sales/components/PurchaseRequest/PurchaseRequest";
import { listPurchaseRequests } from "@/features/sales/services/salesService";
import { useLoad } from "@/hooks/useLoad";
import { date, num } from "@/utils/format";

/** Cân tại cảng: các đơn HTX đã chấp nhận, chọn một đơn để cân từng lồng. */
export default function WeighingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const list = useLoad(() => listPurchaseRequests("accepted", page), [page]);
  return (
    <ManagePage title="Cân tại cảng">
      <p className="form__intro">Chọn đơn của thương lái đang giao hàng. Mỗi lần cân ghi kg của từng lồng, thương lái đồng ý số cân rồi mới lập hóa đơn.</p>
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>
        {(data) => (
          <>
            {data.items.length ? (
              <Rows>
                {data.items.map((row) => (
                  <Row key={row.id} title={`${row.customer.name} · ${row.productName}`}
                    meta={`${num(row.response?.acceptedCages ?? null, "lồng")} đã nhận đơn · giao ${date(row.response?.pickupDate)}`}
                    badge={row.fulfilled ? <Badge text="Đã giao đủ" tone="neutral" />
                      : row.harvestCompletedAt ? <Badge text="Đã thu xong, chờ cân" tone="warning" />
                      : <Badge text="Đang thu, chưa cân được" tone="neutral" />}
                    onClick={() => navigate(`/manage/weighings/${row.id}`)} />
                ))}
              </Rows>
            ) : (
              <Empty icon="zi-inbox" title="Chưa có đơn nào đã chấp nhận" text="Đơn được Chủ HTX chấp nhận sẽ hiện ở đây để cân." />
            )}
            <PurchasePager page={page} total={data.total} onChange={setPage} />
          </>
        )}
      </Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <div className="button-stack">
        <Button fullWidth size="large" variant="secondary" onClick={() => void list.reload()}>Tải lại</Button>
      </div>
    </ManagePage>
  );
}
