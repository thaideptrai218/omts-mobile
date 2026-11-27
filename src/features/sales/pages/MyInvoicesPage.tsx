import type { MyInvoice } from "@/features/sales/models/SalesInvoice";
import { useEffect, useState } from "react";
import { Button, useLocation, useNavigate } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { PurchasePager } from "@/features/sales/components/PurchaseRequest/PurchaseRequest";
import { myInvoice, myInvoices } from "@/features/sales/services/invoiceService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, money, num } from "@/utils/format";
import { originTokenFrom } from "@/utils/scanTargets";
import "@/features/sales/styles/sales.scss";

const paidBadge = (isPaid: boolean | null) =>
  isPaid === null ? <Badge text="Đã hủy" tone="neutral" /> : isPaid ? <Badge text="Đã trả đủ" tone="success" /> : <Badge text="Còn nợ" tone="warning" />;

/**
 * Hóa đơn của thương lái: hàng đã mua theo lô, tiền hàng, số còn nợ, nút thanh toán và trang truy xuất của hàng đã mua.
 * Dòng hóa đơn của backend chỉ có kg của lô, không có số cân từng lồng (backend đã gỡ cân từng lồng ở PR #106).
 */
export default function MyInvoicesPage() {
  const navigate = useNavigate();
  const openId = new URLSearchParams(useLocation().search).get("open");
  const [page, setPage] = useState(1);
  const list = useLoad(() => myInvoices(page), [page]);
  const [opened, setOpened] = useState<MyInvoice | null>(null);
  // Hóa đơn đang mở: hàng đó hiện "Đang mở…", các hàng vẫn là nút bấm nhưng bấm thêm thì bỏ qua cho tới khi mở xong.
  const [openingId, setOpeningId] = useState<string | null>(null);
  const busy = openingId !== null;
  const [error, setError] = useState("");

  const open = async (id: string) => {
    setOpeningId(id);
    setError("");
    try {
      setOpened(await myInvoice(id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setOpeningId(null);
    }
  };

  // Mở thẳng hóa đơn khi đi từ phiếu cân (`?open=<id>`).
  useEffect(() => {
    if (openId) void open(openId);
  }, [openId]);

  if (opened) {
    const token = originTokenFrom(opened.qrUrl ?? "");
    return (
      <ManagePage title={`Hóa đơn ${opened.code}`} onBack={() => setOpened(null)}
        footer={token ? <Button fullWidth size="large" onClick={() => navigate(`/trace?origin=${encodeURIComponent(token)}`)}>Xem nguồn gốc hàng đã mua</Button> : undefined}>
        <Facts items={[
          ["Ngày", date(opened.invoiceDate)],
          ["Vùng", opened.zoneName],
          ["Tổng khối lượng", num(opened.totalKg, "kg")],
          ["Tổng tiền", money(opened.total)],
          ["Đã trả", money(opened.covered)],
          ["Còn nợ", money(opened.unpaidAmount)],
          ["Trạng thái", paidBadge(opened.isPaid)],
        ]} />
        {/* Trả số còn nợ qua Checkout SDK của Zalo và payOS (CLAUDE.md mục 10); server quyết định đã trả hay chưa. */}
        {opened.isPaid === false && opened.unpaidAmount > 0 && (
          <Section title="Thanh toán">
            <p className="form__hint">Trả số còn nợ bằng chuyển khoản, xác nhận trên trang thanh toán của Zalo.</p>
            <Actions>
              <Button fullWidth size="large" onClick={() => navigate(`/account/invoices/${encodeURIComponent(opened.id)}/pay`)}>
                Thanh toán {money(opened.unpaidAmount)}
              </Button>
            </Actions>
          </Section>
        )}
        <Section title="Hàng đã mua">
          <div className="form">
            {opened.lines.map((line) => (
              <div key={line.lineNumber} className="card form">
                <p className="weighing-lot__title">{line.productName} · lô {line.lotCode}</p>
                <p>{num(line.kg, "kg")} × {money(line.unitPrice)} = {money(line.amount)}</p>
              </div>
            ))}
          </div>
        </Section>
        {/* CLAIM-01: hóa đơn đã hủy không khiếu nại được; trường hợp đã trả hàng hay đang có khiếu nại chờ thì server báo. */}
        {opened.isPaid !== null && (
          <Section title="Hàng có vấn đề?">
            <p className="form__hint">Gửi khiếu nại kèm ảnh, HTX sẽ kiểm tra và trả lời bạn.</p>
            <Actions>
              <Button variant="secondary" size="large" onClick={() => navigate(`/account/claims/new?invoice=${encodeURIComponent(opened.id)}`)}>
                Gửi khiếu nại về hóa đơn này
              </Button>
            </Actions>
          </Section>
        )}
      </ManagePage>
    );
  }

  return (
    <ManagePage title="Hóa đơn của tôi">
      <FormError text={error} />
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>
        {(data) => (
          <>
            {data.page.items.length ? (
              <Rows>
                {data.page.items.map((row) => (
                  <Row key={row.id} title={`${row.code} · ${money(row.total)}`}
                    meta={`${date(row.invoiceDate)} · ${num(row.totalKg, "kg")}`}
                    badge={paidBadge(row.isPaid)}
                    value={openingId === row.id ? <span role="status">Đang mở…</span> : undefined}
                    onClick={() => { if (!busy) void open(row.id); }} />
                ))}
              </Rows>
            ) : (
              <Empty icon="zi-file" title="Chưa có hóa đơn" text="Hóa đơn HTX lập sau mỗi lần giao hàng sẽ hiện ở đây." />
            )}
            <PurchasePager page={page} total={data.page.total} onChange={setPage} />
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}
