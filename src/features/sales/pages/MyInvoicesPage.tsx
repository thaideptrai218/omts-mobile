import type { MyInvoice } from "@/features/sales/models/SalesInvoice";
import { useEffect, useState } from "react";
import { Button, useLocation, useNavigate } from "zmp-ui";

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
import { cageList } from "@/features/sales/components/PortWeighing/PortWeighing";
import { myInvoice, myInvoices } from "@/features/sales/services/invoiceService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, money, num } from "@/utils/format";
import { originTokenFrom } from "@/utils/scanTargets";
import "@/features/sales/styles/sales.scss";

const paidBadge = (isPaid: boolean | null) =>
  isPaid === null ? <Badge text="Đã hủy" tone="neutral" /> : isPaid ? <Badge text="Đã trả đủ" tone="success" /> : <Badge text="Còn nợ" tone="warning" />;

/** Hóa đơn của thương lái: số cân từng lồng, tiền hàng, số còn nợ và trang truy xuất của hàng đã mua. */
export default function MyInvoicesPage() {
  const navigate = useNavigate();
  const openId = new URLSearchParams(useLocation().search).get("open");
  const [page, setPage] = useState(1);
  const list = useLoad(() => myInvoices(page), [page]);
  const [opened, setOpened] = useState<MyInvoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      setOpened(await myInvoice(id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
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
          ["Số lồng", opened.cageCount ? num(opened.cageCount, "lồng") : null],
          ["Tổng khối lượng", num(opened.totalKg, "kg")],
          ["Tổng tiền", money(opened.total)],
          ["Đã trả", money(opened.covered)],
          ["Còn nợ", money(opened.unpaidAmount)],
          ["Trạng thái", paidBadge(opened.isPaid)],
        ]} />
        <Section title="Hàng đã mua">
          {opened.lines.map((line) => (
            <div key={line.lineNumber} className="card form">
              <p className="weighing-lot__title">{line.productName} · lô {line.lotCode}</p>
              <p>{num(line.kg, "kg")} × {money(line.unitPrice)} = {money(line.amount)}</p>
              {line.cageKgs.length > 0 && <p className="weighing-lot__cages">{cageList(line.cageKgs)}</p>}
            </div>
          ))}
        </Section>
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
                    meta={`${date(row.invoiceDate)} · ${row.cageCount ? `${num(row.cageCount, "lồng")} · ` : ""}${num(row.totalKg, "kg")}`}
                    badge={paidBadge(row.isPaid)} onClick={busy ? undefined : () => void open(row.id)} />
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
